import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Search, MoreHorizontal, Pencil, Trash2, Sparkles, Wand2, ClipboardCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/formatters";
import JobDetailDialog from "@/components/jobs/JobDetailDialog";
import DocGeneratorButton from "@/components/documents/DocGeneratorButton";
import JobAssistantPanel from "@/components/assistant/JobAssistantPanel";
import JobSetupWizard from "@/components/jobs/wizard/JobSetupWizard";
import JobCloseoutWizard from "@/components/jobs/closeout/JobCloseoutWizard";
import JobRiskIndicator from "@/components/jobs/JobRiskIndicator";

const emptyJob = {
  title: "", client_id: "", client_name: "", address: "", zip_code: "", city: "", state: "", scope: "", status: "bidding",
  start_date: "", projected_completion: "", contract_amount: 0, deposits_received: 0,
  change_orders_total: 0, material_costs: 0, labor_costs: 0, subcontractor_costs: 0,
  permit_costs: 0, equipment_costs: 0, overhead_costs: 0, other_costs: 0, notes: "",
};

export default function Jobs() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [form, setForm] = useState(emptyJob);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedAssistant, setExpandedAssistant] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardBid, setWizardBid] = useState(null);
  const [closeoutJob, setCloseoutJob] = useState(null);
  const qc = useQueryClient();

  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 200) });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list("-created_date", 200) });
  const { data: contracts = [] } = useQuery({ queryKey: ["contracts"], queryFn: () => base44.entities.Contract.list("-created_date", 200) });
  const { data: bids = [] } = useQuery({ queryKey: ["bids"], queryFn: () => base44.entities.Bid.list("-created_date", 200) });
  const { data: subLabor = [] } = useQuery({ queryKey: ["subLabor"], queryFn: () => base44.entities.SubcontractorWorkEntry.list("-created_date", 500) });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });
  const { data: jobReceipts = [] } = useQuery({ queryKey: ["all-receipts"], queryFn: () => base44.entities.JobReceipt.list("-date", 500) });

  const saveMutation = useMutation({
    mutationFn: (data) => editId ? base44.entities.Job.update(editId, data) : base44.entities.Job.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["jobs"] }); setDialogOpen(false); setEditId(null); setForm(emptyJob); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Job.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });

  const openEdit = (j) => {
    setForm({
      title: j.title, client_id: j.client_id || "", client_name: j.client_name || "", address: j.address || "",
      zip_code: j.zip_code || "", city: j.city || "", state: j.state || "",
      scope: j.scope || "", status: j.status || "bidding", start_date: j.start_date || "",
      projected_completion: j.projected_completion || "", contract_amount: j.contract_amount || 0,
      deposits_received: j.deposits_received || 0, change_orders_total: j.change_orders_total || 0,
      material_costs: j.material_costs || 0, labor_costs: j.labor_costs || 0,
      subcontractor_costs: j.subcontractor_costs || 0, permit_costs: j.permit_costs || 0,
      equipment_costs: j.equipment_costs || 0, overhead_costs: j.overhead_costs || 0,
      other_costs: j.other_costs || 0, notes: j.notes || "",
    });
    setEditId(j.id);
    setDialogOpen(true);
  };

  const openCreate = () => { setForm(emptyJob); setEditId(null); setDialogOpen(true); };

  const filtered = jobs
    .filter(j => statusFilter === "all" || j.status === statusFilter)
    .filter(j => j.title?.toLowerCase().includes(search.toLowerCase()));

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setNum = (k, v) => setForm(f => ({ ...f, [k]: parseFloat(v) || 0 }));

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setForm(f => ({ ...f, client_id: clientId, client_name: client?.name || "" }));
  };

  return (
    <div>
      <PageHeader title="Jobs" description="Track all construction jobs and profitability" actionLabel="New Job" onAction={openCreate}>
        <Button size="sm" onClick={() => setWizardOpen(true)} className="gap-1.5 bg-primary/90 hover:bg-primary">
          <Wand2 className="w-4 h-4" /> Create New Job (Guided)
        </Button>
      </PageHeader>
      {wizardOpen && <JobSetupWizard onClose={() => setWizardOpen(false)} onJobCreated={() => qc.invalidateQueries({ queryKey: ["jobs"] })} />}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="in_progress">Active</TabsTrigger>
            <TabsTrigger value="bidding">Bidding</TabsTrigger>
            <TabsTrigger value="completed">Done</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs yet" description="Create your first job to start tracking." actionLabel="New Job" onAction={openCreate} />
      ) : (
        <div className="grid gap-3">
          {filtered.map(j => {
            const revenue = (j.deposits_received || 0) + (j.change_orders_total || 0);
            const jobCosts = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0);
            const receiptCosts = jobReceipts.filter(r => r.job_id === j.id).reduce((sum, r) => sum + (r.amount || 0), 0);
            const costs = jobCosts + receiptCosts;
            const grossProfit = revenue - costs;
            const s = settings[0] || {};
            const managerPct = s.manager_pay_percent ?? 10;
            const managerPay = Math.max(0, grossProfit) * (managerPct / 100);
            const jobSubLabor = subLabor.filter(entry => entry.job_id === j.id && entry.payment_status === "Paid").reduce((sum, entry) => sum + (entry.calculated_pay || 0), 0);
            const netProfit = grossProfit - managerPay - jobSubLabor;
            const taxReservePct = s.tax_reserve_percent ?? 25;
            const taxReserve = Math.max(0, netProfit) * (taxReservePct / 100);
            const ownerTakeHome = netProfit - taxReserve;
            const contractAmt = j.contract_amount || 0;
            const outstanding = Math.max(0, contractAmt - revenue);
            const alerts = [];
            if (!j.material_costs && receiptCosts === 0) alerts.push("No material costs");
            if (!j.projected_completion) alerts.push("No completion date");
            return (
              <Card key={j.id} className="p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all" onClick={() => { setSelectedJob(j); setDetailOpen(true); }}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{j.title}</p>
                      <Badge className={`text-xs ${getStatusColor(j.status)}`}>{j.status?.replace(/_/g, " ")}</Badge>
                      {j.signed_and_accepted && (
                        <Badge className="text-xs bg-green-600 text-white">✓ Signed</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {j.client_name || "No client"} · {j.address || "No address"}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs flex-wrap">
                      <span>Revenue: <strong>{formatCurrency(revenue)}</strong></span>
                      <span>
                        Expenses: <strong className={costs > 0 ? "text-red-600" : ""}>{formatCurrency(costs)}</strong>
                        {jobCosts > 0 && receiptCosts > 0 && <span className="text-muted-foreground ml-1">(fields + receipts)</span>}
                        {jobCosts === 0 && receiptCosts > 0 && <span className="text-muted-foreground ml-1">({jobReceipts.filter(r => r.job_id === j.id).length} receipt{jobReceipts.filter(r => r.job_id === j.id).length !== 1 ? "s" : ""})</span>}
                      </span>
                      {jobSubLabor > 0 && (
                        <span className="text-blue-600">Sub Labor Paid: <strong>{formatCurrency(jobSubLabor)}</strong></span>
                      )}
                      <span className="text-purple-600">Mgr Pay ({managerPct}%): <strong>{formatCurrency(managerPay)}</strong></span>
                      <span className={grossProfit >= 0 ? "text-green-500" : "text-red-500"}>Gross Profit: <strong>{formatCurrency(grossProfit)}</strong></span>
                      <span className={netProfit >= 0 ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>
                        Net Profit: <strong>{formatCurrency(netProfit)}</strong>
                      </span>
                      <span className="text-yellow-600">Tax Reserve ({taxReservePct}%): <strong>{formatCurrency(taxReserve)}</strong></span>
                      <span className="text-slate-500">Op Reserve (5%): <strong>{formatCurrency(Math.max(0, netProfit) * 0.05)}</strong></span>
                      <span className={ownerTakeHome >= 0 ? "text-emerald-700 font-bold" : "text-red-700 font-bold"}>
                        🏠 Owner Take Home: <strong>{formatCurrency(ownerTakeHome)}</strong>
                      </span>
                      <span className={outstanding > 0 ? "text-orange-600" : "text-green-600"}>
                        Outstanding: <strong>{formatCurrency(outstanding)}</strong>
                      </span>
                    </div>
                    {alerts.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {alerts.map(a => <span key={a} className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">⚠ {a}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Job Assistant"
                      onClick={() => setExpandedAssistant(expandedAssistant === j.id ? null : j.id)}
                      className={expandedAssistant === j.id ? "text-primary" : "text-muted-foreground"}
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                    <DocGeneratorButton job={j} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(j)}><Pencil className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
                        {j.status !== "completed" && (
                          <DropdownMenuItem onClick={() => setCloseoutJob(j)} className="text-primary">
                            <ClipboardCheck className="w-3.5 h-3.5 mr-2" />Close Out Job
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(j.id)}><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {expandedAssistant === j.id && (
                  <div className="mt-3 pt-3 border-t border-border space-y-3">
                    <JobRiskIndicator job={j} allJobs={jobs} />
                    <div>
                      <p className="text-xs font-semibold text-primary flex items-center gap-1 mb-2">
                        <Sparkles className="w-3 h-3" /> Job Assistant
                      </p>
                      <JobAssistantPanel job={j} contracts={contracts} bids={bids} />
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Job" : "New Job"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Job Title *</Label><Input value={form.title} onChange={e => set("title", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Client</Label>
                <Select value={form.client_id} onValueChange={handleClientChange}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["bidding","contracted","in_progress","on_hold","completed","cancelled"].map(s => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Address</Label><Input value={form.address} onChange={e => set("address", e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>ZIP Code</Label><Input value={form.zip_code} onChange={e => set("zip_code", e.target.value)} maxLength="5" /></div>
              <div><Label>City</Label><Input value={form.city} onChange={e => set("city", e.target.value)} /></div>
              <div><Label>State</Label><Input value={form.state} onChange={e => set("state", e.target.value)} maxLength="2" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} /></div>
              <div><Label>Projected End</Label><Input type="date" value={form.projected_completion} onChange={e => set("projected_completion", e.target.value)} /></div>
              <div><Label>Contract Amount</Label><Input type="number" value={form.contract_amount} onChange={e => setNum("contract_amount", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Deposits Received</Label><Input type="number" value={form.deposits_received} onChange={e => setNum("deposits_received", e.target.value)} /></div>
              <div><Label>Change Orders</Label><Input type="number" value={form.change_orders_total} onChange={e => setNum("change_orders_total", e.target.value)} /></div>
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Cost Tracking</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Materials</Label><Input type="number" value={form.material_costs} onChange={e => setNum("material_costs", e.target.value)} /></div>
              <div><Label>Labor</Label><Input type="number" value={form.labor_costs} onChange={e => setNum("labor_costs", e.target.value)} /></div>
              <div><Label>Subcontractors</Label><Input type="number" value={form.subcontractor_costs} onChange={e => setNum("subcontractor_costs", e.target.value)} /></div>
              <div><Label>Permits</Label><Input type="number" value={form.permit_costs} onChange={e => setNum("permit_costs", e.target.value)} /></div>
              <div><Label>Equipment</Label><Input type="number" value={form.equipment_costs} onChange={e => setNum("equipment_costs", e.target.value)} /></div>
              <div><Label>Overhead</Label><Input type="number" value={form.overhead_costs} onChange={e => setNum("overhead_costs", e.target.value)} /></div>
              <div><Label>Other Costs</Label><Input type="number" value={form.other_costs} onChange={e => setNum("other_costs", e.target.value)} /></div>
            </div>
            <div><Label>Scope of Work</Label><Textarea value={form.scope} onChange={e => set("scope", e.target.value)} rows={2} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} /></div>
            <Button className="w-full" onClick={() => saveMutation.mutate(form)} disabled={!form.title || saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editId ? "Update Job" : "Create Job"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <JobDetailDialog
        job={jobs.find(j => j.id === selectedJob?.id) || selectedJob}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
      {closeoutJob && (
        <JobCloseoutWizard
          job={closeoutJob}
          onClose={() => setCloseoutJob(null)}
          onJobClosed={() => { qc.invalidateQueries({ queryKey: ["jobs"] }); setCloseoutJob(null); }}
        />
      )}
    </div>
  );
}