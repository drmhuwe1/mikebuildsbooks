import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Search, MoreHorizontal, Pencil, Trash2, Eye, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
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

const emptyJob = {
  title: "", client_id: "", client_name: "", address: "", scope: "", status: "bidding",
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
  const qc = useQueryClient();

  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 200) });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list("-created_date", 200) });
  const { data: contracts = [] } = useQuery({ queryKey: ["contracts"], queryFn: () => base44.entities.Contract.list("-created_date", 200) });
  const { data: bids = [] } = useQuery({ queryKey: ["bids"], queryFn: () => base44.entities.Bid.list("-created_date", 200) });
  const [expandedAssistant, setExpandedAssistant] = useState(null);

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
      <PageHeader title="Jobs" description="Track all construction jobs and profitability" actionLabel="New Job" onAction={openCreate} />

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
            const revenue = (j.contract_amount || 0) + (j.change_orders_total || 0);
            const costs = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0);
            const profit = revenue - costs;
            const alerts = [];
            if (!j.material_costs) alerts.push("No material costs");
            if (!j.projected_completion) alerts.push("No completion date");
            return (
              <Card key={j.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{j.title}</p>
                      <Badge className={`text-xs ${getStatusColor(j.status)}`}>{j.status?.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {j.client_name || "No client"} · {j.address || "No address"}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span>Revenue: <strong>{formatCurrency(revenue)}</strong></span>
                      <span>Costs: <strong>{formatCurrency(costs)}</strong></span>
                      <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                        Profit: <strong>{formatCurrency(profit)}</strong>
                      </span>
                    </div>
                    {alerts.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {alerts.map(a => <span key={a} className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">⚠ {a}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
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
                        <DropdownMenuItem onClick={() => { setSelectedJob(j); setDetailOpen(true); }}><Eye className="w-3.5 h-3.5 mr-2" />View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(j)}><Pencil className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(j.id)}><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {expandedAssistant === j.id && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-semibold text-primary flex items-center gap-1 mb-2">
                      <Sparkles className="w-3 h-3" /> Job Assistant
                    </p>
                    <JobAssistantPanel job={j} contracts={contracts} bids={bids} />
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
            </div>
            <div><Label>Scope of Work</Label><Textarea value={form.scope} onChange={e => set("scope", e.target.value)} rows={2} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} /></div>
            <Button className="w-full" onClick={() => saveMutation.mutate(form)} disabled={!form.title || saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editId ? "Update Job" : "Create Job"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <JobDetailDialog job={selectedJob} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}