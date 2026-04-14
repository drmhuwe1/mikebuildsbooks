import React, { useState, useMemo } from "react";
import SubscriptionGate from "@/components/subscription/SubscriptionGate";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Search, Plus, Filter, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import ChangeOrderStatusBadge from "@/components/changeorders/ChangeOrderStatusBadge";
import ChangeOrderEditor from "@/components/changeorders/ChangeOrderEditor";
import ChangeOrderImportWizard from "@/components/changeorders/ChangeOrderImportWizard";
import { formatCurrency, formatDate } from "@/lib/formatters";

export default function ChangeOrders() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // null=list, "new"=create, id=edit
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [showImport, setShowImport] = useState(false);
  const [importJobId, setImportJobId] = useState(null);

  const { data: changeOrders = [], isLoading } = useQuery({
    queryKey: ["changeOrders"],
    queryFn: () => base44.entities.ChangeOrder.list("-created_date", 500),
  });
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 200) });

  const now = new Date();
  const thisMonth = changeOrders.filter(co => {
    const d = new Date(co.created_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const approvedThisMonth = thisMonth.filter(co => co.status === "approved").reduce((s, co) => s + (co.total_amount || 0), 0);
  const pendingApproval = changeOrders.filter(co => co.status === "sent").reduce((s, co) => s + (co.total_amount || 0), 0);

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
        <Button variant="outline" size="sm" onClick={() => { setShowImport(true); setImportJobId(jobFilter !== "all" ? jobFilter : null); }} disabled={jobFilter === "all"} className="gap-1.5 mr-2">
          <Upload className="w-4 h-4" /> Import from PDF/Doc
        </Button>
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
                    <td className={`p-3 text-right font-semibold ${(co.total_amount || 0) < 0 ? "text-red-600" : "text-green-700"}`}>
                      {(co.total_amount || 0) >= 0 ? "+" : ""}{formatCurrency(co.total_amount)}
                    </td>
                    <td className="p-3"><ChangeOrderStatusBadge status={co.status} /></td>
                    <td className="p-3 text-muted-foreground text-xs">{formatDate(co.created_date)}</td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={e => { e.stopPropagation(); setEditing(co.id); }}>Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* Import Wizard */}
      <ChangeOrderImportWizard
        open={showImport}
        onClose={() => { setShowImport(false); setImportJobId(null); }}
        jobId={importJobId}
        onCOCreated={() => {
          setShowImport(false);
          qc.invalidateQueries({ queryKey: ["changeOrders"] });
        }}
      />
    </div>
    </SubscriptionGate>
  );
}