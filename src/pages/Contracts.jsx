import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileCheck, MoreHorizontal, Pencil, Trash2, Eye, Mail, Printer, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/formatters";
import { generateContract } from "@/lib/docTemplates";
import AdvancedContractEditor from "@/components/contracts/AdvancedContractEditor";

const emptyContract = { title: "", client_id: "", client_name: "", job_id: "", bid_id: "", status: "draft", contract_amount: 0, deposit_amount: 0, deposit_percent: 0, scope_summary: "", payment_schedule: "", change_order_terms: "", start_date: "", estimated_completion: "", notes: "" };

export default function Contracts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [form, setForm] = useState(emptyContract);
  const [editId, setEditId] = useState(null);
  const qc = useQueryClient();

  const { data: contracts = [] } = useQuery({ queryKey: ["contracts"], queryFn: () => base44.entities.Contract.list("-created_date", 200) });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list("-created_date", 200) });
  const { data: bids = [] } = useQuery({ queryKey: ["bids"], queryFn: () => base44.entities.Bid.filter({ status: "approved" }) });
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 200) });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });

  const saveMutation = useMutation({
    mutationFn: (data) => editId ? base44.entities.Contract.update(editId, data) : base44.entities.Contract.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contracts"] }); setDialogOpen(false); setEditId(null); setForm(emptyContract); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Contract.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });

  const openEdit = (c) => {
    setForm({ title: c.title, client_id: c.client_id || "", client_name: c.client_name || "", job_id: c.job_id || "", bid_id: c.bid_id || "", status: c.status || "draft", contract_amount: c.contract_amount || 0, deposit_amount: c.deposit_amount || 0, deposit_percent: c.deposit_percent || 0, scope_summary: c.scope_summary || "", payment_schedule: c.payment_schedule || "", change_order_terms: c.change_order_terms || "", start_date: c.start_date || "", estimated_completion: c.estimated_completion || "", notes: c.notes || "" });
    setEditId(c.id);
    setDialogOpen(true);
  };

  const openFromBid = (b) => {
    setForm({ ...emptyContract, title: `Contract - ${b.title}`, client_id: b.client_id || "", client_name: b.client_name || "", bid_id: b.id, contract_amount: b.bid_amount || 0, scope_summary: b.scope_summary || "" });
    setEditId(null);
    setDialogOpen(true);
  };

  const openCreate = () => { setForm(emptyContract); setEditId(null); setDialogOpen(true); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setNum = (k, v) => setForm(f => ({ ...f, [k]: parseFloat(v) || 0 }));

  const missingSchedule = contracts.filter(c => c.status !== "cancelled" && !c.payment_schedule);

  return (
    <div>
      <PageHeader title="Contracts" description="Convert bids into contracts and manage terms" actionLabel="New Contract" onAction={openCreate} />

      {missingSchedule.length > 0 && (
        <div className="mb-4">
          <GuidedPrompt message={`${missingSchedule.length} contract(s) are missing payment schedules.`} variant="warning" />
        </div>
      )}

      {bids.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Approved Bids Ready for Contract</p>
          <div className="flex gap-2 flex-wrap">
            {bids.map(b => (
              <Button key={b.id} variant="outline" size="sm" onClick={() => openFromBid(b)}>
                Convert: {b.title}
              </Button>
            ))}
          </div>
        </div>
      )}

      {contracts.length === 0 ? (
        <EmptyState icon={FileCheck} title="No contracts yet" description="Create a contract or convert an approved bid." actionLabel="New Contract" onAction={openCreate} />
      ) : (
        <div className="grid gap-3">
          {contracts.map(c => (
            <Card key={c.id} className="p-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{c.title}</p>
                  <Badge className={`text-xs ${getStatusColor(c.status)}`}>{c.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{c.client_name || "No client"} · {formatCurrency(c.contract_amount)}</p>
                {!c.payment_schedule && <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded mt-1 inline-block">⚠ Missing payment schedule</span>}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setSelectedContract(c); setPreviewOpen(true); }}><Eye className="w-3.5 h-3.5 mr-2" />View & Print</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Contract" : "New Contract"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => set("title", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Client</Label>
                <Select value={form.client_id} onValueChange={v => { set("client_id", v); set("client_name", clients.find(c => c.id === v)?.name || ""); }}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["draft","sent","signed","active","completed","cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Contract Amount</Label><Input type="number" value={form.contract_amount} onChange={e => setNum("contract_amount", e.target.value)} /></div>
              <div><Label>Deposit Amount</Label><Input type="number" value={form.deposit_amount} onChange={e => setNum("deposit_amount", e.target.value)} /></div>
              <div><Label>Deposit %</Label><Input type="number" value={form.deposit_percent} onChange={e => setNum("deposit_percent", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} /></div>
              <div><Label>Est. Completion</Label><Input type="date" value={form.estimated_completion} onChange={e => set("estimated_completion", e.target.value)} /></div>
            </div>
            <div><Label>Scope Summary</Label><Textarea value={form.scope_summary} onChange={e => set("scope_summary", e.target.value)} rows={3} /></div>
            <div><Label>Payment Schedule</Label><Textarea value={form.payment_schedule} onChange={e => set("payment_schedule", e.target.value)} rows={3} placeholder="e.g. 50% deposit, 25% at framing, 25% at completion" /></div>
            <div><Label>Change Order Terms</Label><Textarea value={form.change_order_terms} onChange={e => set("change_order_terms", e.target.value)} rows={2} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} /></div>
            <Button className="w-full" onClick={() => saveMutation.mutate(form)} disabled={!form.title || saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editId ? "Update" : "Create Contract"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">{selectedContract?.title}</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <AdvancedContractEditor
              contract={selectedContract}
              company={settings[0] || {}}
              onSave={(templateData) => {
                // Template is saved to ContractTemplate entity
                qc.invalidateQueries({ queryKey: ["contracts"] });
              }}
              onClose={() => setPreviewOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}