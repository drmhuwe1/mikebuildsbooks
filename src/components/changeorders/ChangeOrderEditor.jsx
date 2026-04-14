import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Eye, Send, CheckCircle, XCircle, FileX, Loader2, Upload } from "lucide-react";
import ChangeOrderLineItems from "./ChangeOrderLineItems";
import ChangeOrderStatusBadge from "./ChangeOrderStatusBadge";
import { formatCurrency } from "@/lib/formatters";
import { generateChangeOrderPdf } from "@/lib/changeOrderPdf";
import { printDocument } from "@/lib/printDocument";
import { useToast } from "@/components/ui/use-toast";

const REASONS = [
  { value: "client_request", label: "Client Request" },
  { value: "unforeseen_condition", label: "Unforeseen Condition" },
  { value: "design_change", label: "Design Change" },
  { value: "material_substitution", label: "Material Substitution" },
  { value: "other", label: "Other" },
];

export default function ChangeOrderEditor({ changeOrderId, jobId, onBack, onSaved }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState(changeOrderId ? "details" : "import"); // "import" or "details"

  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 200) });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list("-created_date", 200) });
  const { data: contracts = [] } = useQuery({ queryKey: ["contracts"], queryFn: () => base44.entities.Contract.list("-created_date", 200) });
  const { data: existing = null, isLoading } = useQuery({
    queryKey: ["changeOrder", changeOrderId],
    queryFn: () => changeOrderId ? base44.entities.ChangeOrder.filter({ id: changeOrderId }).then(r => r[0]) : null,
    enabled: !!changeOrderId,
  });

  const company = settings[0] || {};

  const defaultForm = {
    job_id: jobId || "",
    job_title: "",
    client_id: "",
    client_name: "",
    client_email: "",
    title: "",
    description: "",
    reason: "client_request",
    line_items: [],
    tax_enabled: false,
    tax_rate: 0,
    notes: "",
    status: "draft",
    original_contract_amount: 0,
  };

  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (existing) {
      setForm({ ...defaultForm, ...existing });
    } else if (jobId) {
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        const client = clients.find(c => c.id === job.client_id);
        setForm(f => ({
          ...f,
          job_id: jobId,
          job_title: job.title,
          client_id: job.client_id || "",
          client_name: job.client_name || "",
          client_email: client?.email || "",
          original_contract_amount: job.contract_amount || 0,
        }));
      }
    }
  }, [existing, jobId, jobs, clients]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const subtotal = (form.line_items || []).reduce((s, item) => s + (item.total_cost || 0), 0);
  const taxAmount = form.tax_enabled ? subtotal * (form.tax_rate / 100) : 0;
  const totalAmount = subtotal + taxAmount;
  const revisedContractAmount = (form.original_contract_amount || 0) + totalAmount;

  const handleJobChange = (jId) => {
    const job = jobs.find(j => j.id === jId);
    if (!job) return;
    const client = clients.find(c => c.id === job.client_id);
    set("job_id", jId);
    set("job_title", job.title);
    set("client_id", job.client_id || "");
    set("client_name", job.client_name || "");
    set("client_email", client?.email || "");
    set("original_contract_amount", job.contract_amount || 0);
  };

  const buildSaveData = () => ({
    ...form,
    subtotal,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    revised_contract_amount: revisedContractAmount,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = buildSaveData();
      let saved;
      if (changeOrderId) {
        saved = await base44.entities.ChangeOrder.update(changeOrderId, data);
      } else {
        // Auto-generate CO number
        const existingCOs = await base44.entities.ChangeOrder.filter({ job_id: form.job_id });
        const num = String(existingCOs.length + 1).padStart(3, "0");
        saved = await base44.entities.ChangeOrder.create({ ...data, change_order_number: `CO-${num}` });
      }
      qc.invalidateQueries({ queryKey: ["changeOrders"] });
      toast({ title: "Change order saved" });
      onSaved?.(saved);
    } catch (e) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    const data = buildSaveData();
    const html = generateChangeOrderPdf(data, company);
    printDocument(html, `Change Order ${data.change_order_number || ""}`);
  };

  const handleSendToClient = async () => {
    if (!form.client_email) {
      toast({ title: "No client email", description: "Add a client email before sending.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const saved = changeOrderId
        ? { id: changeOrderId, ...buildSaveData() }
        : await handleSave().then(() => null);

      const token = crypto.randomUUID();
      const coId = changeOrderId || saved?.id;

      await base44.entities.ChangeOrder.update(coId, {
        status: "sent",
        sent_at: new Date().toISOString(),
        approval_token: token,
      });

      const approvalUrl = `${window.location.origin}/change-order-approval?token=${token}&id=${coId}`;

      await base44.functions.invoke("sendChangeOrderEmail", {
        to: form.client_email,
        clientName: form.client_name,
        jobTitle: form.job_title,
        coNumber: form.change_order_number || "CO-???",
        coTitle: form.title,
        totalAmount,
        revisedContractAmount,
        approvalUrl,
        companyName: company.company_name || "Your Contractor",
      });

      qc.invalidateQueries({ queryKey: ["changeOrders"] });
      toast({ title: "Sent to client", description: `Approval link emailed to ${form.client_email}` });
    } catch (e) {
      toast({ title: "Send failed", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleMarkApproved = async () => {
    if (!changeOrderId) return;
    await base44.entities.ChangeOrder.update(changeOrderId, { status: "approved" });
    
    // Update job's change_orders_total and contract amount
    if (form.job_id) {
      const job = jobs.find(j => j.id === form.job_id);
      if (job) {
        await base44.entities.Job.update(form.job_id, {
          change_orders_total: (job.change_orders_total || 0) + totalAmount,
          contract_amount: (job.contract_amount || 0) + totalAmount,
        });
      }

      // Update linked contract with change order details
      const linkedContract = contracts.find(c => c.job_id === form.job_id);
      if (linkedContract) {
        const updatedScope = linkedContract.scope_summary 
          ? `${linkedContract.scope_summary}\n\n[CHANGE ORDER: ${form.title}]\n${form.description || ""}`
          : form.description;

        const updatedNotes = linkedContract.notes
          ? `${linkedContract.notes}\n\nChange Order Approved: ${form.title} - ${formatCurrency(totalAmount)}`
          : `Change Order: ${form.title} - ${formatCurrency(totalAmount)}`;

        await base44.entities.Contract.update(linkedContract.id, {
          scope_summary: updatedScope,
          notes: updatedNotes,
          contract_amount: (linkedContract.contract_amount || 0) + totalAmount,
        });
      }
    }

    qc.invalidateQueries({ queryKey: ["changeOrders"] });
    qc.invalidateQueries({ queryKey: ["jobs"] });
    qc.invalidateQueries({ queryKey: ["contracts"] });
    toast({ title: "Change order approved and contract updated" });
    onSaved?.();
  };

  const handleVoid = async () => {
    if (!changeOrderId) return;
    await base44.entities.ChangeOrder.update(changeOrderId, { status: "void" });
    qc.invalidateQueries({ queryKey: ["changeOrders"] });
    toast({ title: "Change order voided" });
    onSaved?.();
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
          <div>
            <h2 className="text-base font-bold">{changeOrderId ? `Edit ${form.change_order_number || "Change Order"}` : "New Change Order"}</h2>
            {form.status && <ChangeOrderStatusBadge status={form.status} />}
          </div>
        </div>
        
        {!changeOrderId && (
          <div className="flex gap-2 mr-2">
            <Button 
              variant={tab === "import" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setTab("import")}
              className="gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" /> Import from PDF
            </Button>
            <Button 
              variant={tab === "details" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setTab("details")}
              className="gap-1.5"
            >
              Manual Entry
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button variant="outline" size="sm" onClick={handlePreview} className="gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Preview PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Draft
          </Button>
          {form.status !== "approved" && form.status !== "void" && (
            <Button size="sm" onClick={handleSendToClient} disabled={sending} className="gap-1.5">
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send to Client
            </Button>
          )}
          {changeOrderId && form.status === "sent" && (
            <Button size="sm" variant="outline" onClick={handleMarkApproved} className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50">
              <CheckCircle className="w-3.5 h-3.5" /> Mark Approved
            </Button>
          )}
          {changeOrderId && form.status !== "void" && (
            <Button size="sm" variant="ghost" onClick={handleVoid} className="gap-1.5 text-muted-foreground">
              <FileX className="w-3.5 h-3.5" /> Void
            </Button>
          )}
        </div>
      </div>

      {/* Import Tab */}
      {!changeOrderId && tab === "import" && (
        <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center space-y-4">
          <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
          <div>
            <p className="text-sm font-semibold mb-2">Upload Change Order Document</p>
            <p className="text-xs text-muted-foreground mb-4">PDF, Word (.doc/.docx), or image (JPG/PNG)</p>
          </div>
          <input
            type="file"
            accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              
              setTab("details"); // Switch to details tab
              
              // Upload and extract
              try {
                const uploadResult = await base44.integrations.Core.UploadFile({ file });
                
                const extractResult = await base44.integrations.Core.InvokeLLM({
                  model: "gemini_3_pro",
                  prompt: `You are a construction change order analyzer. Extract ALL information from this change order document. Return ONLY a JSON object with these keys:

{
  "title": "Change order title/description",
  "description": "Detailed scope of the change",
  "reason": "client_request|unforeseen_condition|design_change|material_substitution|other",
  "line_items": [
    {
      "description": "Item description",
      "quantity": 1,
      "unit": "each/sq ft/hrs/etc",
      "unit_price": 100,
      "total_cost": 100
    }
  ],
  "tax_rate": 0,
  "notes": "Any additional notes"
}`,
                  file_urls: [uploadResult.file_url],
                  response_json_schema: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      reason: { type: "string" },
                      line_items: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            description: { type: "string" },
                            quantity: { type: "number" },
                            unit: { type: "string" },
                            unit_price: { type: "number" },
                            total_cost: { type: "number" },
                          },
                        },
                      },
                      tax_rate: { type: "number" },
                      notes: { type: "string" },
                    },
                  },
                });

                // Populate form with extracted data
                setForm(f => ({
                  ...f,
                  title: extractResult.title || "",
                  description: extractResult.description || "",
                  reason: extractResult.reason || "client_request",
                  line_items: extractResult.line_items || [],
                  tax_rate: extractResult.tax_rate || 0,
                  tax_enabled: (extractResult.tax_rate || 0) > 0,
                  notes: extractResult.notes || "",
                }));

                toast({ title: "Document analyzed", description: "Review and edit the extracted data below" });
              } catch (err) {
                toast({ title: "Upload failed", description: err.message, variant: "destructive" });
              }
            }}
            className="hidden"
            id="import-file"
          />
          <label htmlFor="import-file">
            <Button asChild variant="outline">
              <span className="cursor-pointer">Choose File</span>
            </Button>
          </label>
        </div>
      )}

      {/* Form */}
      {tab === "details" && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label>Job *</Label>
            <Select value={form.job_id} onValueChange={handleJobChange} disabled={!!jobId && !changeOrderId}>
              <SelectTrigger><SelectValue placeholder="Select job" /></SelectTrigger>
              <SelectContent>{jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Change Order Title *</Label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Add French drain along north wall" />
          </div>
          <div>
            <Label>Reason</Label>
            <Select value={form.reason} onValueChange={v => set("reason", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Client Email</Label>
            <Input type="email" value={form.client_email} onChange={e => set("client_email", e.target.value)} placeholder="client@email.com" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Description (shown to client)</Label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4} placeholder="Detailed scope of work being added, removed, or modified..." />
          </div>
          <div>
            <Label>Internal Notes (not shown to client)</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} placeholder="Internal notes..." />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">Line Items</Label>
        <ChangeOrderLineItems
          lineItems={form.line_items}
          onChange={items => set("line_items", items)}
        />
      </div>

      {/* Totals */}
      <div className="flex flex-col items-end gap-2 pt-4 border-t">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={form.tax_enabled} onCheckedChange={v => set("tax_enabled", v)} id="tax-toggle" />
            <Label htmlFor="tax-toggle" className="text-sm">Tax</Label>
            {form.tax_enabled && (
              <div className="flex items-center gap-1">
                <Input type="number" value={form.tax_rate} onChange={e => set("tax_rate", parseFloat(e.target.value) || 0)} className="w-16 h-7 text-xs text-right" />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            )}
          </div>
        </div>
        <div className="w-64 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
          {form.tax_enabled && <div className="flex justify-between"><span className="text-muted-foreground">Tax ({form.tax_rate}%)</span><span>{formatCurrency(taxAmount)}</span></div>}
          <div className="flex justify-between text-base font-bold border-t pt-1.5">
            <span className={totalAmount < 0 ? "text-red-600" : "text-green-700"}>
              {totalAmount < 0 ? "Credit / Deduction" : "Total Amount"}
            </span>
            <span className={totalAmount < 0 ? "text-red-600" : "text-green-700"}>{formatCurrency(totalAmount)}</span>
          </div>
        </div>
        <div className="w-64 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1 text-xs">
          <div className="flex justify-between"><span className="text-blue-700">Original Contract</span><span className="font-medium">{formatCurrency(form.original_contract_amount)}</span></div>
          <div className="flex justify-between"><span className="text-blue-700">This Change Order</span><span className={`font-medium ${totalAmount < 0 ? "text-red-600" : "text-green-700"}`}>{totalAmount >= 0 ? "+" : ""}{formatCurrency(totalAmount)}</span></div>
          <div className="flex justify-between font-bold text-blue-900 border-t border-blue-200 pt-1"><span>Revised Contract</span><span>{formatCurrency(revisedContractAmount)}</span></div>
        </div>
      </div>

      {/* Payment Tracking */}
      {form.status === "approved" && (
        <div className="pt-4 border-t space-y-3">
          <Label className="text-sm font-semibold">Payment Tracking</Label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Payment Status</Label>
              <Select value={form.paid_status} onValueChange={v => set("paid_status", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Amount Paid ($)</Label>
              <Input type="number" value={form.paid_amount} onChange={e => set("paid_amount", parseFloat(e.target.value) || 0)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Date Paid</Label>
              <Input type="date" value={form.paid_date} onChange={e => set("paid_date", e.target.value)} className="h-8 text-xs" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}