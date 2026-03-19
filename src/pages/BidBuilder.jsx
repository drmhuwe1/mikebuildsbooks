import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, ArrowLeft, ArrowRight, Check, Calculator, Upload, FileCheck, Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/formatters";
import BidWizard from "@/components/bids/BidWizard";
import BidImportWizard from "@/components/bids/BidImportWizard";
import JobSetupWizard from "@/components/jobs/wizard/JobSetupWizard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

export default function BidBuilder() {
  const { toast } = useToast();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editBid, setEditBid] = useState(null);
  const [contractApprovalDialog, setContractApprovalDialog] = useState(false);
  const [contractBidId, setContractBidId] = useState(null);
  const [jobWizardOpen, setJobWizardOpen] = useState(false);
  const [jobWizardBid, setJobWizardBid] = useState(null);
  const qc = useQueryClient();

  const { data: bids = [] } = useQuery({ queryKey: ["bids"], queryFn: () => base44.entities.Bid.list("-created_date", 200) });

  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list() });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Bid.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bids"] }),
  });

  const createContractMutation = useMutation({
    mutationFn: async (bidId) => {
      const bid = bids.find(b => b.id === bidId);
      const job = jobs.find(j => j.id === bid.job_id);
      const contractNum = `CONT-${Date.now().toString().slice(-6)}`;
      
      return base44.entities.Contract.create({
        title: bid.title || `Contract for ${bid.client_name}`,
        bid_id: bidId,
        client_id: bid.client_id,
        client_name: bid.client_name,
        client_last_name: bid.client_last_name || "",
        job_id: bid.job_id,
        contract_amount: bid.bid_amount,
        deposit_amount: bid.deposit_amount,
        deposit_percent: bid.deposit_percent,
        scope_summary: bid.scope_summary,
        payment_schedule: bid.terms_and_conditions || `Deposit: ${formatCurrency(bid.deposit_amount)} (${bid.deposit_percent}%) upon acceptance. Final: ${formatCurrency(bid.bid_amount - bid.deposit_amount)} upon completion.`,
        change_order_terms: bid.change_orders || "",
        notes: (bid.exclusions ? `Exclusions: ${bid.exclusions}\n\n` : "") + (bid.disclaimer || ""),
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{b.title}</p>
                    <Badge className={`text-xs ${getStatusColor(b.status)}`}>{b.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.client_name || "No client"}</p>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span>Est. Cost: <strong>{formatCurrency(totalEstimatedCost)}</strong></span>
                    <span>Bid: <strong>{formatCurrency(bidAmount)}</strong></span>
                    <span className="text-green-600">Profit: <strong>{formatCurrency(grossProfit)}</strong></span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                   {b.status === "draft" && (
                     <>
                       <Button 
                         size="sm" 
                         variant="outline"
                         className="gap-1" 
                         onClick={(e) => {
                           e.stopPropagation();
                           setJobWizardBid(b);
                           setJobWizardOpen(true);
                         }}
                       >
                         <Briefcase className="w-3.5 h-3.5" /> Create Job
                       </Button>
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
                     </>
                   )}
                   <Button variant="ghost" size="sm" className="text-destructive" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(b.id); }}>
                     Delete
                   </Button>
                 </div>
              </div>
            </Card>
            );
          })}
        </div>
      )}
      {importOpen && <BidImportWizard open={importOpen} onClose={() => setImportOpen(false)} onBidCreated={() => qc.invalidateQueries({ queryKey: ["bids"] })} />}
      {jobWizardOpen && <JobSetupWizard initialBid={jobWizardBid} onClose={() => { setJobWizardOpen(false); setJobWizardBid(null); }} onJobCreated={() => { qc.invalidateQueries({ queryKey: ["jobs"] }); setJobWizardOpen(false); }} />}

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