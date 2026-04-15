import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Upload, FileCheck, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { formatCurrency, getStatusColor } from "@/lib/formatters";
import BidWizard from "@/components/bids/BidWizard";
import BidImportWizard from "@/components/bids/BidImportWizard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

export default function BidBuilder() {
  const { toast } = useToast();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editBid, setEditBid] = useState(null);
  const [contractApprovalDialog, setContractApprovalDialog] = useState(false);
   const [contractBidId, setContractBidId] = useState(null);
   const qc = useQueryClient();

  const { data: bids = [] } = useQuery({ queryKey: ["bids"], queryFn: () => base44.entities.Bid.list("-created_date", 200) });

  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list() });
  const { data: documents = [] } = useQuery({ queryKey: ["documents"], queryFn: () => base44.entities.Document.list() });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [bidToDelete, setBidToDelete] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: async (bidId) => {
      // Find and delete all linked documents
      const linkedDocs = documents.filter(d => d.bid_id === bidId);
      for (const doc of linkedDocs) {
        await base44.entities.Document.delete(doc.id);
      }

      // Find and delete the linked job (if in bidding status)
      const linkedJob = jobs.find(j => j.bid_id === bidId);
      if (linkedJob && linkedJob.status === "bidding") {
        await base44.entities.Job.delete(linkedJob.id);
      }

      // Delete the bid itself
      await base44.entities.Bid.delete(bidId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bids"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Bid deleted", description: "All linked documents and jobs removed." });
      setDeleteDialog(false);
      setBidToDelete(null);
    },
    onError: (error) => {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    },
  });

  const createContractMutation = useMutation({
    mutationFn: async (bidId) => {
       const bid = bids.find(b => b.id === bidId);

       // Format payment schedule — use exactly what the user typed, no fabrication
       let paymentScheduleText = "";
       if (bid.payment_schedule && Array.isArray(bid.payment_schedule) && bid.payment_schedule.length > 0) {
         paymentScheduleText = bid.payment_schedule.map(p => {
           const amount = p.percent > 0 ? formatCurrency((bid.bid_amount * p.percent / 100)) : formatCurrency(p.amount);
           const condition = p.condition ? ` — ${p.condition}` : "";
           return `${p.milestone}: ${amount}${condition}`;
         }).join("\n");
       } else {
         // Legacy fallback — only use fields that were explicitly entered by the user
         const lines = [];
         if (bid.deposit_amount > 0) {
           lines.push(`Deposit: ${formatCurrency(bid.deposit_amount)}`);
         }
         if (bid.start_of_construction_amount > 0) {
           const label = bid.start_of_construction_label || "Payment 2";
           lines.push(`${label}: ${formatCurrency(bid.start_of_construction_amount)}`);
         }
         if (bid.payment3_amount > 0) {
           const label = bid.payment3_label || "Payment 3";
           lines.push(`${label}: ${formatCurrency(bid.payment3_amount)}`);
         }
         const remaining = (bid.bid_amount || 0) - (bid.deposit_amount || 0) - (bid.start_of_construction_amount || 0) - (bid.payment3_amount || 0);
         if (remaining > 0) {
           lines.push(`Final Payment: ${formatCurrency(remaining)}`);
         }
         paymentScheduleText = lines.join("\n");
       }

       return base44.entities.Contract.create({
        title: bid.title || `Contract for ${bid.client_name}`,
        bid_id: bidId,
        client_id: bid.client_id,
        client_name: bid.client_name,
        client_last_name: bid.client_last_name || "",
        client_address: bid.client_address || bid.project_address || "",
        job_id: bid.job_id,
        contract_amount: bid.bid_amount,
        deposit_amount: bid.deposit_amount,
        deposit_percent: bid.deposit_percent,
        start_of_construction_amount: bid.start_of_construction_amount || 0,
        start_of_construction_label: bid.start_of_construction_label || "",
        final_payment_amount: bid.final_payment_amount || 0,
        scope_summary: bid.scope_summary,
        project_description: bid.project_description || "",
        disclaimer: bid.disclaimer || "",
        payment_schedule: paymentScheduleText,
        change_order_terms: bid.change_orders || "",
        notes: [
          // Cost breakdown — only show if user entered values
          (() => {
            const lines = [];
            if (bid.material_cost > 0) lines.push(`Materials: ${formatCurrency(bid.material_cost)}${bid.material_description ? ` — ${bid.material_description}` : ""}`);
            if (bid.permit_cost > 0) lines.push(`Permits & Fees: ${formatCurrency(bid.permit_cost)}${bid.permit_description ? ` — ${bid.permit_description}` : ""}`);
            return lines.length > 0 ? `Cost Breakdown:\n${lines.join("\n")}` : "";
          })(),
          bid.exclusions ? `Exclusions:\n${bid.exclusions}` : "",
          bid.additional_notes || bid.notes || "",
        ].filter(Boolean).join("\n\n"),
        status: "draft",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      toast({ title: "Contract created from bid. Review and send for signature." });
      setContractApprovalDialog(false);
      setContractBidId(null);
    },
  });

  const openCreate = () => { setEditBid(null); setWizardOpen(true); };
  const openEdit = (b) => { setEditBid(b); setWizardOpen(true); };

  if (wizardOpen) {
    return <BidWizard bid={editBid} onClose={() => { setWizardOpen(false); setEditBid(null); }} />;
  }

  return (
    <div>
      <PageHeader title="Estimate & Bid Builder" description="Create professional bids with guided step-by-step workflow" actionLabel="New Bid" onAction={openCreate}>
        <Button size="sm" onClick={() => setImportOpen(true)} variant="outline" className="gap-1.5">
          <Upload className="w-4 h-4" /> Import Bid
        </Button>
      </PageHeader>

      {bids.length === 0 ? (
        <EmptyState icon={FileText} title="No bids yet" description="Create your first bid using the step-by-step builder." actionLabel="Create Bid" onAction={openCreate} />
      ) : (
        <div className="grid gap-3">
          {bids.map(b => {
            const bidAmount = b.bid_amount || 0;
            const totalEstimatedCost = b.total_estimated_cost || 0;
            const grossProfit = bidAmount - totalEstimatedCost;

            return (
            <Card key={b.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(b)}>
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate">{b.title}</p>
                    <Badge className={`text-xs ${getStatusColor(b.status)}`}>{b.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.client_name || "No client"}</p>
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 mt-2 text-xs">
                    <span className="truncate">Est. Cost: <strong>{formatCurrency(totalEstimatedCost)}</strong></span>
                    <span className="truncate">Bid: <strong>{formatCurrency(bidAmount)}</strong></span>
                    <span className="text-green-600 truncate">Profit: <strong>{formatCurrency(grossProfit)}</strong></span>
                    {(b.deposits_received || 0) > 0 && (
                      <span className="text-blue-600 truncate">Received: <strong>{formatCurrency(b.deposits_received)}</strong></span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                   {b.status === "draft" && (
                     <Button 
                       size="sm" 
                       className="gap-1" 
                       onClick={(e) => {
                         e.stopPropagation();
                         setContractBidId(b.id);
                         setContractApprovalDialog(true);
                       }}
                     >
                       <FileCheck className="w-3.5 h-3.5" /> Create Contract
                     </Button>
                   )}
                   <Button 
                     variant="ghost" 
                     size="sm" 
                     className="text-destructive" 
                     onClick={(e) => { 
                       e.stopPropagation(); 
                       setBidToDelete(b);
                       setDeleteDialog(true);
                     }}
                   >
                     <Trash2 className="w-3.5 h-3.5" />
                   </Button>
                 </div>
              </div>
            </Card>
            );
          })}
        </div>
      )}
      {importOpen && <BidImportWizard open={importOpen} onClose={() => setImportOpen(false)} onBidCreated={() => qc.invalidateQueries({ queryKey: ["bids"] })} />}

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
       <DialogContent>
         <DialogHeader>
           <DialogTitle>Delete Bid?</DialogTitle>
         </DialogHeader>
         {bidToDelete && (
           <div className="space-y-4">
             <div className="bg-red-50 border border-red-200 rounded-lg p-4">
               <p className="text-sm font-semibold text-red-900">This will permanently delete:</p>
               <ul className="text-xs text-red-800 mt-2 space-y-1">
                 <li>• The bid "{bidToDelete.title}"</li>
                 <li>• All linked documents and proposals</li>
                 {jobs.find(j => j.bid_id === bidToDelete.id)?.status === "bidding" && (
                   <li>• The linked job (only if in "bidding" status)</li>
                 )}
               </ul>
             </div>
             <p className="text-sm text-muted-foreground">
               No financial data will be left behind. This cannot be undone.
             </p>
           </div>
         )}
         <DialogFooter>
           <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancel</Button>
           <Button 
             variant="destructive" 
             onClick={() => deleteMutation.mutate(bidToDelete.id)}
             disabled={deleteMutation.isPending}
           >
             {deleteMutation.isPending ? "Deleting..." : "Delete Bid"}
           </Button>
         </DialogFooter>
       </DialogContent>
      </Dialog>

      <Dialog open={contractApprovalDialog} onOpenChange={setContractApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Contract from Bid</DialogTitle>
          </DialogHeader>
          {contractBidId && (() => {
            const bid = bids.find(b => b.id === contractBidId);
            return (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900">Professional Contract</p>
                  <p className="text-xs text-blue-700 mt-2">
                    This will create a professional contract with all legal terms and signature blocks. The contract will be pre-filled with bid details and ready for client approval.
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Client:</span><span className="font-medium">{bid?.client_name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Project:</span><span className="font-medium">{bid?.title}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Amount:</span><span className="font-medium">{formatCurrency(bid?.bid_amount)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Deposit:</span><span className="font-medium">{formatCurrency(bid?.deposit_amount)} ({bid?.deposit_percent}%)</span></div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded p-3">
                  <p className="text-xs text-amber-800">
                    ✓ Contract will include professional terms, payment schedule, change order policy, and signature blocks for contractor and client.
                  </p>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setContractApprovalDialog(false)}>Cancel</Button>
            <Button onClick={() => createContractMutation.mutate(contractBidId)} disabled={createContractMutation.isPending}>
              {createContractMutation.isPending ? "Creating..." : "Create Contract"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}