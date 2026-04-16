import React, { useState, useMemo } from "react";
import SubscriptionGate from "@/components/subscription/SubscriptionGate";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Search, Plus, Filter, Trash2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import ChangeOrderStatusBadge from "@/components/changeorders/ChangeOrderStatusBadge";
import ChangeOrderEditor from "@/components/changeorders/ChangeOrderEditor";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useToast } from "@/components/ui/use-toast";

export default function ChangeOrders() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [movingToContract, setMovingToContract] = useState(null);

  const { data: changeOrders = [], isLoading } = useQuery({
    queryKey: ["changeOrders"],
    queryFn: () => base44.entities.ChangeOrder.list("-created_date", 500),
  });
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 200) });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await base44.entities.ChangeOrder.delete(deleteTarget.id);
      qc.invalidateQueries({ queryKey: ["changeOrders"] });
      toast({ title: "Change order deleted" });
      setDeleteTarget(null);
    } catch (e) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleMoveToContract = async (co) => {
    setMovingToContract(co.id);
    try {
      const s = settings[0] || {};
      const depositAmt = co.deposit_amount || (co.change_order_amount * ((co.deposit_percent || 50) / 100));
      const finalAmt = Math.max(0, (co.change_order_amount || 0) - depositAmt);
      const contract = await base44.entities.Contract.create({
        title: `Change Order: ${co.title} — ${co.job_title || ""}`,
        client_id: co.client_id,
        client_name: co.client_name,
        client_last_name: co.client_last_name || "",
        client_address: co.client_address || "",
        job_id: co.job_id,
        contract_amount: co.change_order_amount || 0,
        deposit_amount: depositAmt,
        deposit_percent: co.deposit_percent || 50,
        final_payment_amount: finalAmt,
        scope_summary: co.scope_summary || "",
        project_description: co.project_description || `Change Order for: ${co.job_title}\nReason: ${co.reason || ""}`,
        change_order_terms: co.change_order_terms || "",
        disclaimer: co.disclaimer || "",
        notes: [
          co.included_in_change_order ? `Included:\n${co.included_in_change_order}` : "",
          co.exclusions ? `Exclusions:\n${co.exclusions}` : "",
          co.notes || "",
        ].filter(Boolean).join("\n\n"),
        status: "draft",
      });
      await base44.entities.ChangeOrder.update(co.id, { contract_id: contract.id });
      qc.invalidateQueries({ queryKey: ["contracts"] });
      qc.invalidateQueries({ queryKey: ["changeOrders"] });
      toast({ title: "Moved to Contracts!", description: "A draft contract was created. Go to Contracts to review and generate the PDF." });
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setMovingToContract(null);
    }
  };

  const now = new Date();
  const thisMonth = changeOrders.filter(co => {
    const d = new Date(co.created_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const coAmt = (co) => co.change_order_amount || co.total_amount || 0;
  const approvedThisMonth = thisMonth.filter(co => co.status === "approved").reduce((s, co) => s + coAmt(co), 0);
  const pendingApproval = changeOrders.filter(co => co.status === "sent").reduce((s, co) => s + coAmt(co), 0);

  const filtered = useMemo(() => changeOrders
    .filter(co => statusFilter === "all" || co.status === statusFilter)
    .filter(co => jobFilter === "all" || co.job_id === jobFilter)
    .filter(co => {
      const q = search.toLowerCase();
      return !q || co.title?.toLowerCase().includes(q) || co.job_title?.toLowerCase().includes(q) || co.client_name?.toLowerCase().includes(q) || co.change_order_number?.toLowerCase().includes(q);
    }),
    [changeOrders, statusFilter, jobFilter, search]
  );

  if (editing) {
    return (
      <div>
        <ChangeOrderEditor
          changeOrderId={editing === "new" ? null : editing}
          jobId={null}
          onBack={() => setEditing(null)}
          onSaved={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["changeOrders"] }); }}
        />
      </div>
    );
  }

  return (
    <SubscriptionGate feature="changeorders">
    <div>
      <PageHeader title="Change Orders" description="Manage scope and cost modifications across all jobs">
        <Button onClick={() => setEditing("new")} size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> New Change Order
        </Button>
      </PageHeader>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Approved This Month</p>
          <p className="text-xl font-bold text-green-700">{formatCurrency(approvedThisMonth)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Pending Approval</p>
          <p className="text-xl font-bold text-yellow-700">{formatCurrency(pendingApproval)}</p>
          {changeOrders.filter(co => co.status === "sent").length > 0 && (
            <p className="text-xs text-muted-foreground">{changeOrders.filter(co => co.status === "sent").length} awaiting response</p>
          )}
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search change orders..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent to Client</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
            <SelectItem value="void">Void</SelectItem>
          </SelectContent>
        </Select>
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Jobs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            {jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No change orders" description="Create your first change order to track scope modifications." actionLabel="New Change Order" onAction={() => setEditing("new")} />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">CO #</th>
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Job</th>
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Client</th>
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Title</th>
                  <th className="text-right p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Amount</th>
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(co => (
                  <tr key={co.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setEditing(co.id)}>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{co.change_order_number || "—"}</td>
                    <td className="p-3 font-medium max-w-[140px] truncate">{co.job_title || "—"}</td>
                    <td className="p-3 text-muted-foreground">{co.client_name || "—"}</td>
                    <td className="p-3 max-w-[200px] truncate">{co.title}</td>
                    <td className={`p-3 text-right font-semibold ${coAmt(co) < 0 ? "text-red-600" : "text-green-700"}`}>
                      {coAmt(co) >= 0 ? "+" : ""}{formatCurrency(coAmt(co))}
                    </td>
                    <td className="p-3"><ChangeOrderStatusBadge status={co.status} /></td>
                    <td className="p-3 text-muted-foreground text-xs">{formatDate(co.created_date)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={e => { e.stopPropagation(); setEditing(co.id); }}>Edit</Button>
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Move to Contracts"
                          disabled={movingToContract === co.id}
                          onClick={e => { e.stopPropagation(); handleMoveToContract(co); }}
                        >
                          {movingToContract === co.id ? "..." : <ArrowRight className="w-3.5 h-3.5" />}
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 text-xs text-destructive hover:text-destructive hover:bg-red-50"
                          onClick={e => { e.stopPropagation(); setDeleteTarget(co); }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Change Order?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </SubscriptionGate>
  );
}