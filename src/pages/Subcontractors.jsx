import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HardHat, Search, MoreHorizontal, Pencil, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { formatCurrency } from "@/lib/formatters";
import DocPreviewModal from "@/components/documents/DocPreviewModal";
import { generateSubPaymentSummary } from "@/lib/docTemplates";
import { FileText } from "lucide-react";

const emptySub = { name: "", company: "", email: "", phone: "", specialty: "", w9_received: false, w9_date: "", payment_rule: "fixed", fixed_amount: 0, hourly_rate: 0, percent_value: 0, status: "active", notes: "" };

export default function Subcontractors() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptySub);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const [docPreview, setDocPreview] = useState(null);
  const { data: subs = [] } = useQuery({ queryKey: ["subcontractors"], queryFn: () => base44.entities.Subcontractor.list("-created_date", 200) });
  const { data: payments = [] } = useQuery({ queryKey: ["subPayments"], queryFn: () => base44.entities.SubcontractorPayment.list("-created_date", 500) });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });

  const saveMutation = useMutation({
    mutationFn: (data) => editId ? base44.entities.Subcontractor.update(editId, data) : base44.entities.Subcontractor.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subcontractors"] }); setDialogOpen(false); setEditId(null); setForm(emptySub); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Subcontractor.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subcontractors"] }),
  });

  const openEdit = (s) => {
    setForm({ name: s.name, company: s.company || "", email: s.email || "", phone: s.phone || "", specialty: s.specialty || "", w9_received: s.w9_received || false, w9_date: s.w9_date || "", payment_rule: s.payment_rule || "fixed", fixed_amount: s.fixed_amount || 0, hourly_rate: s.hourly_rate || 0, percent_value: s.percent_value || 0, status: s.status || "active", notes: s.notes || "" });
    setEditId(s.id);
    setDialogOpen(true);
  };
  const openCreate = () => { setForm(emptySub); setEditId(null); setDialogOpen(true); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtered = subs.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()));
  const missingW9 = subs.filter(s => !s.w9_received && s.status === "active");

  const getYTD = (subId) => {
    const year = new Date().getFullYear();
    return payments.filter(p => p.subcontractor_id === subId && p.status === "paid" && p.payment_date?.startsWith(String(year)))
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  const ruleLabels = { fixed: "Fixed Amount", hourly: "Hourly Rate", percent_labor: "% of Labor", percent_profit: "% of Job Profit" };

  return (
    <div>
      <PageHeader title="Subcontractors / 1099" description="Manage subcontractor profiles, W-9s, and payouts" actionLabel="Add Subcontractor" onAction={openCreate}>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { const html = generateSubPaymentSummary(subs, payments, settings[0] || {}); setDocPreview({ html, title: "Subcontractor Payment Summary" }); }}>
          <FileText className="w-3.5 h-3.5" /> Export Report
        </Button>
      </PageHeader>
      <DocPreviewModal open={!!docPreview} onClose={() => setDocPreview(null)} html={docPreview?.html} title={docPreview?.title} docType="sub_payment" />

      {missingW9.length > 0 && <div className="mb-4"><GuidedPrompt message={`${missingW9.length} active subcontractor(s) are missing W-9 forms.`} variant="warning" /></div>}

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={HardHat} title="No subcontractors yet" description="Add your subcontractors to track payments and W-9s." actionLabel="Add Subcontractor" onAction={openCreate} />
      ) : (
        <div className="grid gap-3">
          {filtered.map(s => (
            <Card key={s.id} className="p-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{s.name}</p>
                  {s.w9_received ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />}
                  <Badge variant="outline" className="text-xs">{ruleLabels[s.payment_rule]}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{[s.company, s.specialty].filter(Boolean).join(" · ") || "—"}</p>
                <p className="text-xs text-muted-foreground mt-1">YTD Paid: <strong>{formatCurrency(getYTD(s.id))}</strong></p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEdit(s)}><Pencil className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(s.id)}><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Subcontractor" : "New Subcontractor"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Company</Label><Input value={form.company} onChange={e => set("company", e.target.value)} /></div>
              <div><Label>Specialty</Label><Input value={form.specialty} onChange={e => set("specialty", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input value={form.email} onChange={e => set("email", e.target.value)} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.w9_received} onCheckedChange={v => set("w9_received", v)} />
              <Label>W-9 Received</Label>
              {form.w9_received && <Input type="date" className="w-40" value={form.w9_date} onChange={e => set("w9_date", e.target.value)} />}
            </div>
            <div><Label>Payment Rule</Label>
              <Select value={form.payment_rule} onValueChange={v => set("payment_rule", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="hourly">Hourly Rate</SelectItem>
                  <SelectItem value="percent_labor">% of Labor</SelectItem>
                  <SelectItem value="percent_profit">% of Job Profit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.payment_rule === "fixed" && <div><Label>Fixed Amount</Label><Input type="number" value={form.fixed_amount} onChange={e => set("fixed_amount", parseFloat(e.target.value) || 0)} /></div>}
            {form.payment_rule === "hourly" && <div><Label>Hourly Rate</Label><Input type="number" value={form.hourly_rate} onChange={e => set("hourly_rate", parseFloat(e.target.value) || 0)} /></div>}
            {(form.payment_rule === "percent_labor" || form.payment_rule === "percent_profit") && <div><Label>Percentage (%)</Label><Input type="number" value={form.percent_value} onChange={e => set("percent_value", parseFloat(e.target.value) || 0)} /></div>}
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} /></div>
            <Button className="w-full" onClick={() => saveMutation.mutate(form)} disabled={!form.name || saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editId ? "Update" : "Add Subcontractor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}