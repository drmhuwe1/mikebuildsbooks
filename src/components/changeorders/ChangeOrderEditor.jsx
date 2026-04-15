import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check, Save, Eye, Send, CheckCircle, FileX, Loader2, Upload, Calculator, FileText } from "lucide-react";
import ChangeOrderStatusBadge from "./ChangeOrderStatusBadge";
import { formatCurrency } from "@/lib/formatters";
import { generateChangeOrderPdf } from "@/lib/changeOrderPdf";
import { printDocument } from "@/lib/printDocument";
import { useToast } from "@/components/ui/use-toast";

const STEPS = ["Job & Basics", "Scope & Costs", "Margins", "Payment & Terms", "Review"];

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
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [importing, setImporting] = useState(false);

  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 200) });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list("-created_date", 200) });
  const { data: contracts = [] } = useQuery({ queryKey: ["contracts"], queryFn: () => base44.entities.Contract.list("-created_date", 200) });
  const { data: bids = [] } = useQuery({ queryKey: ["bids"], queryFn: () => base44.entities.Bid.list("-created_date", 200) });
  const { data: existing = null, isLoading } = useQuery({
    queryKey: ["changeOrder", changeOrderId],
    queryFn: () => changeOrderId ? base44.entities.ChangeOrder.filter({ id: changeOrderId }).then(r => r[0]) : null,
    enabled: !!changeOrderId,
  });

  const s = settings[0] || {};
  const company = s;

  const defaultForm = {
    job_id: jobId || "",
    job_title: "",
    client_id: "",
    client_name: "",
    client_last_name: "",
    client_email: "",
    client_address: "",
    title: "",
    reason: "client_request",
    project_description: "",
    scope_summary: "",
    included_in_change_order: "",
    material_cost: 0,
    material_description: "",
    labor_hours: 0,
    labor_rate: s.default_labor_rate || 45,
    subcontractor_cost: 0,
    subcontractor_description: "",
    permit_cost: 0,
    permit_description: "",
    equipment_cost: 0,
    equipment_description: "",
    overhead_percent: s.default_overhead_percent ?? 10,
    contingency_percent: s.default_contingency_percent ?? 5,
    target_profit_margin: s.default_profit_margin ?? 20,
    change_order_amount: 0,
    payment_schedule: [],
    deposit_amount: 0,
    deposit_percent: 50,
    final_payment_amount: 0,
    terms_and_conditions: "",
    change_order_terms: "Any additional changes to the scope of this change order must be documented in writing and signed by both parties prior to commencement of the changed work.",
    exclusions: "",
    unforeseen_conditions: "",
    terms_and_conditions: "",
    disclaimer: "",
    estimated_duration: "",
    notes: "",
    original_contract_amount: 0,
    status: "draft",
  };

  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (existing) {
      const loaded = { ...defaultForm, ...existing };
      // If original_contract_amount is 0, try to pull it from linked job/contract/bid
      if (!loaded.original_contract_amount && loaded.job_id && jobs.length > 0) {
        const job = jobs.find(j => j.id === loaded.job_id);
        if (job) {
          const linkedContract = contracts.find(c => c.job_id === loaded.job_id) || contracts.find(c => c.bid_id === job.bid_id);
          const linkedBid = bids.find(b => b.id === job.bid_id);
          loaded.original_contract_amount = job.contract_amount > 0
            ? job.contract_amount
            : (linkedContract?.contract_amount || linkedBid?.bid_amount || 0);
        }
      }
      setForm(loaded);
    } else if (jobId && jobs.length > 0) {
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        const client = clients.find(c => c.id === job.client_id);
        const linkedContract = contracts.find(c => c.job_id === jobId) || contracts.find(c => c.bid_id === job.bid_id);
        const linkedBid = bids.find(b => b.id === job.bid_id);
        const originalAmount = job.contract_amount > 0
          ? job.contract_amount
          : (linkedContract?.contract_amount || linkedBid?.bid_amount || 0);
        setForm(f => ({
          ...f,
          job_id: jobId,
          job_title: job.title,
          client_id: job.client_id || "",
          client_name: job.client_name || "",
          client_email: client?.email || "",
          client_address: job.address || "",
          original_contract_amount: originalAmount,
        }));
      }
    }
  }, [existing, jobId, jobs, clients, contracts, bids]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setNum = (k, v) => setForm(f => ({ ...f, [k]: parseFloat(v) || 0 }));

  const calc = useMemo(() => {
    const laborCost = form.labor_hours * form.labor_rate;
    // Direct costs = what you actually spend (no overhead/contingency added to cost)
    const directCosts = form.material_cost + laborCost + form.subcontractor_cost + form.permit_cost + form.equipment_cost;
    // Overhead and contingency are internal reserves — they reduce profit, they do NOT add to the price
    const overhead = directCosts * (form.overhead_percent / 100);
    const contingency = directCosts * (form.contingency_percent / 100);
    const totalInternalCosts = directCosts + overhead + contingency;
    // The CO amount is what the customer pays — entered directly by user
    const coAmount = form.change_order_amount || 0;
    // Gross profit = what's left after covering all internal costs
    const grossProfit = coAmount - totalInternalCosts;
    const depositAmt = form.deposit_amount || (coAmount * (form.deposit_percent / 100));
    const finalPayAmt = Math.max(0, coAmount - depositAmt);
    const revisedContract = (form.original_contract_amount || 0) + coAmount;
    return { laborCost, directCosts, overhead, contingency, totalInternalCosts, coAmount, grossProfit, depositAmt, finalPayAmt, revisedContract };
  }, [form]);

  const handleJobChange = (jId) => {
    const job = jobs.find(j => j.id === jId);
    if (!job) return;
    const client = clients.find(c => c.id === job.client_id);
    // Pull contract amount from job, or from the most recent linked contract, or from linked bid
    const linkedContract = contracts.find(c => c.job_id === jId) || contracts.find(c => c.bid_id === job.bid_id);
    const linkedBid = bids.find(b => b.id === job.bid_id);
    const originalAmount = job.contract_amount > 0
      ? job.contract_amount
      : (linkedContract?.contract_amount || linkedBid?.bid_amount || 0);
    setForm(f => ({
      ...f,
      job_id: jId,
      job_title: job.title,
      client_id: job.client_id || "",
      client_name: job.client_name || "",
      client_email: client?.email || "",
      client_address: job.address || "",
      original_contract_amount: originalAmount,
    }));
  };

  const buildSaveData = () => ({
    ...form,
    total_estimated_cost: Math.round(calc.totalInternalCosts * 100) / 100,
    change_order_amount: Math.round(calc.coAmount * 100) / 100,
    deposit_amount: Math.round(calc.depositAmt * 100) / 100,
    final_payment_amount: Math.round(calc.finalPayAmt * 100) / 100,
    revised_contract_amount: Math.round(calc.revisedContract * 100) / 100,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = buildSaveData();
      let saved;
      if (changeOrderId) {
        saved = await base44.entities.ChangeOrder.update(changeOrderId, data);
      } else {
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

  const handleCreateContract = async () => {
    setSaving(true);
    try {
      const data = buildSaveData();
      let coId = changeOrderId;
      if (!coId) {
        const existingCOs = await base44.entities.ChangeOrder.filter({ job_id: form.job_id });
        const num = String(existingCOs.length + 1).padStart(3, "0");
        const saved = await base44.entities.ChangeOrder.create({ ...data, change_order_number: `CO-${num}` });
        coId = saved.id;
      } else {
        await base44.entities.ChangeOrder.update(coId, data);
      }

      // Build payment schedule text
      let paymentScheduleText = "";
      if (form.payment_schedule && form.payment_schedule.length > 0) {
        paymentScheduleText = form.payment_schedule.map(p => {
          const amt = p.percent > 0 ? formatCurrency(calc.coAmount * p.percent / 100) : formatCurrency(p.amount);
          return `${p.milestone}: ${amt} - ${p.condition}`;
        }).join("\n");
      } else {
        paymentScheduleText = `Deposit: ${formatCurrency(calc.depositAmt)} upon acceptance.\nFinal Payment: ${formatCurrency(calc.finalPayAmt)} upon completion.`;
      }

      const contractTitle = `Change Order: ${form.title} — ${form.job_title}`;
      const contract = await base44.entities.Contract.create({
        title: contractTitle,
        bid_id: null,
        client_id: form.client_id,
        client_name: form.client_name,
        client_last_name: form.client_last_name || "",
        client_address: form.client_address || "",
        job_id: form.job_id,
        contract_amount: Math.round(calc.coAmount * 100) / 100,
        deposit_amount: Math.round(calc.depositAmt * 100) / 100,
        deposit_percent: form.deposit_percent,
        final_payment_amount: Math.round(calc.finalPayAmt * 100) / 100,
        scope_summary: form.scope_summary,
        project_description: form.project_description || `Change Order for: ${form.job_title}\nReason: ${form.reason}`,
        payment_schedule: paymentScheduleText,
        change_order_terms: form.change_order_terms || "",
        disclaimer: form.disclaimer || "",
        notes: [
          form.included_in_change_order ? `Included in this Change Order:\n${form.included_in_change_order}` : "",
          form.exclusions ? `Exclusions (NOT included):\n${form.exclusions}` : "",
          form.unforeseen_conditions ? `Unforeseen Conditions:\n${form.unforeseen_conditions}` : "",
          form.terms_and_conditions ? `Additional Terms:\n${form.terms_and_conditions}` : "",
          form.notes ? form.notes : "",
          `\nOriginal Contract Amount: ${formatCurrency(form.original_contract_amount)}`,
          `Revised Contract Amount: ${formatCurrency(calc.revisedContract)}`,
        ].filter(Boolean).join("\n\n"),
        status: "draft",
      });

      // Update the CO with contract reference
      await base44.entities.ChangeOrder.update(coId, { contract_id: contract.id });

      qc.invalidateQueries({ queryKey: ["changeOrders"] });
      qc.invalidateQueries({ queryKey: ["contracts"] });
      toast({ title: "Contract created!", description: "Change Order contract is ready in Contracts." });
      onSaved?.();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
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
      const data = buildSaveData();
      let coId = changeOrderId;
      if (!coId) {
        const existingCOs = await base44.entities.ChangeOrder.filter({ job_id: form.job_id });
        const num = String(existingCOs.length + 1).padStart(3, "0");
        const saved = await base44.entities.ChangeOrder.create({ ...data, change_order_number: `CO-${num}` });
        coId = saved.id;
      }
      const token = crypto.randomUUID();
      await base44.entities.ChangeOrder.update(coId, { status: "sent", sent_at: new Date().toISOString(), approval_token: token });
      const approvalUrl = `${window.location.origin}/change-order-approval?token=${token}&id=${coId}`;
      await base44.functions.invoke("sendChangeOrderEmail", {
        to: form.client_email,
        clientName: form.client_name,
        jobTitle: form.job_title,
        coNumber: form.change_order_number || "CO-???",
        coTitle: form.title,
        totalAmount: calc.coAmount,
        revisedContractAmount: calc.revisedContract,
        approvalUrl,
        companyName: s.company_name || "Your Contractor",
      });
      qc.invalidateQueries({ queryKey: ["changeOrders"] });
      toast({ title: "Sent to client", description: `Approval link emailed to ${form.client_email}` });
      onSaved?.();
    } catch (e) {
      toast({ title: "Send failed", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleMarkApproved = async () => {
    if (!changeOrderId) return;
    await base44.entities.ChangeOrder.update(changeOrderId, { status: "approved" });
    if (form.job_id) {
      const job = jobs.find(j => j.id === form.job_id);
      if (job) {
        await base44.entities.Job.update(form.job_id, {
          change_orders_total: (job.change_orders_total || 0) + calc.coAmount,
          contract_amount: (job.contract_amount || 0) + calc.coAmount,
        });
      }
    }
    qc.invalidateQueries({ queryKey: ["changeOrders"] });
    qc.invalidateQueries({ queryKey: ["jobs"] });
    toast({ title: "Change order approved" });
    onSaved?.();
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);
    try {
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      const extractResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a construction change order document analyzer. Extract ALL information from this document. Return a JSON object:
{
  "title": "Change order title",
  "reason": "client_request|unforeseen_condition|design_change|material_substitution|other",
  "project_description": "Overview/background of the change",
  "scope_summary": "Full detailed scope of work for this change order",
  "included_in_change_order": "What is included",
  "material_cost": 0,
  "material_description": "Materials being used",
  "labor_hours": 0,
  "labor_rate": 0,
  "subcontractor_cost": 0,
  "subcontractor_description": "Subcontractor scope",
  "equipment_cost": 0,
  "equipment_description": "Equipment/rentals",
  "permit_cost": 0,
  "permit_description": "Permit info",
  "overhead_percent": 10,
  "contingency_percent": 5,
  "target_profit_margin": 20,
  "change_order_amount": 0,
  "deposit_percent": 50,
  "estimated_duration": "Duration estimate",
  "exclusions": "What is NOT included",
  "notes": "Additional notes",
  "disclaimer": "Any disclaimers"
}`,
        file_urls: [uploadResult.file_url],
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            reason: { type: "string" },
            project_description: { type: "string" },
            scope_summary: { type: "string" },
            included_in_change_order: { type: "string" },
            material_cost: { type: "number" },
            material_description: { type: "string" },
            labor_hours: { type: "number" },
            labor_rate: { type: "number" },
            subcontractor_cost: { type: "number" },
            subcontractor_description: { type: "string" },
            equipment_cost: { type: "number" },
            equipment_description: { type: "string" },
            permit_cost: { type: "number" },
            permit_description: { type: "string" },
            overhead_percent: { type: "number" },
            contingency_percent: { type: "number" },
            target_profit_margin: { type: "number" },
            change_order_amount: { type: "number" },
            deposit_percent: { type: "number" },
            estimated_duration: { type: "string" },
            exclusions: { type: "string" },
            notes: { type: "string" },
            disclaimer: { type: "string" },
          },
        },
      });
      setForm(f => ({ ...f, ...extractResult }));
      setStep(1);
      toast({ title: "Document analyzed", description: "Review and adjust the imported data." });
    } catch (err) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
          <div>
            <h2 className="text-base font-bold">{changeOrderId ? `Edit ${form.change_order_number || "Change Order"}` : "New Change Order"}</h2>
            {form.status && <ChangeOrderStatusBadge status={form.status} />}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handlePreview} className="gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Preview PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Draft
          </Button>
          {form.status !== "approved" && form.status !== "void" && (
            <Button size="sm" variant="outline" onClick={handleSendToClient} disabled={sending} className="gap-1.5">
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send to Client
            </Button>
          )}
          <Button size="sm" onClick={handleCreateContract} disabled={saving} className="gap-1.5 bg-green-600 hover:bg-green-700">
            <FileText className="w-3.5 h-3.5" /> Generate Contract
          </Button>
          {changeOrderId && form.status === "sent" && (
            <Button size="sm" variant="outline" onClick={handleMarkApproved} className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50">
              <CheckCircle className="w-3.5 h-3.5" /> Mark Approved
            </Button>
          )}
          {changeOrderId && form.status !== "void" && (
            <Button size="sm" variant="ghost" onClick={async () => { await base44.entities.ChangeOrder.update(changeOrderId, { status: "void" }); qc.invalidateQueries({ queryKey: ["changeOrders"] }); onSaved?.(); }} className="gap-1.5 text-muted-foreground">
              <FileX className="w-3.5 h-3.5" /> Void
            </Button>
          )}
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <button
              onClick={() => setStep(i)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="w-3 h-3 inline mr-1" /> : null}{label}
            </button>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
          </React.Fragment>
        ))}
      </div>

      <Card className="p-6">
        {/* ── STEP 0: Job & Basics ── */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Select the job and describe this change order. Or import from a document.</p>
              <div>
                <input type="file" accept=".pdf,.docx,.doc,.jpg,.jpeg,.png" onChange={handleImportFile} className="hidden" id="co-import-file" />
                <label htmlFor="co-import-file">
                  <Button asChild variant="outline" size="sm" disabled={importing}>
                    <span className="cursor-pointer gap-1.5 flex items-center">
                      {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Upload className="w-3.5 h-3.5" /> Import from PDF</>}
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            <div>
              <Label>Job *</Label>
              <Select value={form.job_id} onValueChange={handleJobChange} disabled={!!jobId && !changeOrderId}>
                <SelectTrigger><SelectValue placeholder="Select job" /></SelectTrigger>
                <SelectContent>{jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {form.job_id && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-0.5">
                <p><strong>Client:</strong> {form.client_name}</p>
                <p><strong>Current Contract Amount:</strong> {formatCurrency(form.original_contract_amount)}</p>
              </div>
            )}

            <div><Label>Change Order Title *</Label><Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Add French drain along north wall" /></div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Reason for Change</Label>
                <Select value={form.reason} onValueChange={v => set("reason", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Estimated Duration</Label><Input value={form.estimated_duration} onChange={e => set("estimated_duration", e.target.value)} placeholder="e.g. 3-5 days" /></div>
            </div>

            <div><Label>Client Email</Label><Input type="email" value={form.client_email} onChange={e => set("client_email", e.target.value)} placeholder="client@email.com" /></div>
            <div><Label>Project Description / Background</Label><Textarea value={form.project_description} onChange={e => set("project_description", e.target.value)} rows={3} placeholder="Describe why this change is needed and any background context..." /></div>
          </div>
        )}

        {/* ── STEP 1: Scope & Costs ── */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter the full scope and all associated costs for this change order.</p>
            <div><Label>Full Scope of Work *</Label><Textarea value={form.scope_summary} onChange={e => set("scope_summary", e.target.value)} rows={5} placeholder="Describe all work to be performed as part of this change order..." /></div>
            <div><Label>What's Included</Label><Textarea value={form.included_in_change_order} onChange={e => set("included_in_change_order", e.target.value)} rows={2} placeholder="List what is included in this change order..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Material Cost ($)</Label><Input type="number" value={form.material_cost} onChange={e => setNum("material_cost", e.target.value)} /></div>
              <div><Label>Labor Hours</Label><Input type="number" value={form.labor_hours} onChange={e => setNum("labor_hours", e.target.value)} /></div>
              <div><Label>Labor Rate ($/hr)</Label><Input type="number" value={form.labor_rate} onChange={e => setNum("labor_rate", e.target.value)} /></div>
              <div className="p-3 rounded-lg bg-muted flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Labor Cost:</span>
                <span className="text-sm font-bold">{formatCurrency(calc.laborCost)}</span>
              </div>
              <div><Label>Subcontractor Cost ($)</Label><Input type="number" value={form.subcontractor_cost} onChange={e => setNum("subcontractor_cost", e.target.value)} /></div>
              <div><Label>Equipment / Rentals ($)</Label><Input type="number" value={form.equipment_cost} onChange={e => setNum("equipment_cost", e.target.value)} /></div>
              <div><Label>Permit Cost ($)</Label><Input type="number" value={form.permit_cost} onChange={e => setNum("permit_cost", e.target.value)} /></div>
            </div>
            <div className="p-3 rounded-lg bg-muted flex items-center justify-between">
              <span className="text-sm font-medium">Direct Costs Total:</span>
              <span className="text-base font-bold">{formatCurrency(calc.directCosts)}</span>
            </div>
            <div className="border-t pt-3 space-y-3">
              <h3 className="font-semibold text-sm">Cost Descriptions (optional)</h3>
              <div><Label className="text-sm">Material Details</Label><Textarea value={form.material_description} onChange={e => set("material_description", e.target.value)} rows={2} placeholder="Describe materials..." /></div>
              <div><Label className="text-sm">Subcontractor Work</Label><Textarea value={form.subcontractor_description} onChange={e => set("subcontractor_description", e.target.value)} rows={2} placeholder="Describe subcontractor scope..." /></div>
              <div><Label className="text-sm">Equipment & Rentals</Label><Textarea value={form.equipment_description} onChange={e => set("equipment_description", e.target.value)} rows={2} placeholder="Describe equipment..." /></div>
              <div><Label className="text-sm">Permits & Inspections</Label><Textarea value={form.permit_description} onChange={e => set("permit_description", e.target.value)} rows={2} placeholder="Describe permit requirements..." /></div>
            </div>
            <div><Label>Exclusions (what is NOT included)</Label><Textarea value={form.exclusions} onChange={e => set("exclusions", e.target.value)} rows={2} placeholder="List what is NOT included..." /></div>
            <div><Label>Unforeseen Conditions</Label><Textarea value={form.unforeseen_conditions || ""} onChange={e => set("unforeseen_conditions", e.target.value)} rows={2} placeholder="If unforeseen issues are encountered, describe how they'll be handled..." /></div>
            <div><Label>Terms & Conditions</Label><Textarea value={form.terms_and_conditions || ""} onChange={e => set("terms_and_conditions", e.target.value)} rows={2} placeholder="Additional terms applicable to this change order..." /></div>
          </div>
        )}

        {/* ── STEP 2: Margins ── */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">These are internal cost reserves — they reduce your profit but do NOT add to the customer's price.</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Overhead % (internal reserve)</Label><Input type="number" value={form.overhead_percent} onChange={e => setNum("overhead_percent", e.target.value)} /></div>
              <div><Label>Contingency % (internal reserve)</Label><Input type="number" value={form.contingency_percent} onChange={e => setNum("contingency_percent", e.target.value)} /></div>
            </div>
            <div className="space-y-2 p-4 bg-muted rounded-lg text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Direct Costs (materials + labor + subs)</span><strong>{formatCurrency(calc.directCosts)}</strong></div>
              <div className="flex justify-between text-orange-700"><span>Overhead Reserve ({form.overhead_percent}%) — reduces profit</span><strong>- {formatCurrency(calc.overhead)}</strong></div>
              <div className="flex justify-between text-orange-700"><span>Contingency Reserve ({form.contingency_percent}%) — reduces profit</span><strong>- {formatCurrency(calc.contingency)}</strong></div>
              <div className="flex justify-between border-t pt-2"><span>Total Internal Costs</span><strong>{formatCurrency(calc.totalInternalCosts)}</strong></div>
              <div className="flex justify-between border-t pt-2 text-base"><span className="font-bold">Change Order Price (what customer pays)</span><strong className="text-primary">{formatCurrency(calc.coAmount)}</strong></div>
              <div className={`flex justify-between ${calc.grossProfit >= 0 ? "text-green-700" : "text-red-600"}`}>
                <span>Your Profit (after reserves)</span><strong>{formatCurrency(calc.grossProfit)}</strong>
              </div>
              <div className="flex justify-between border-t pt-2 text-blue-900"><span className="font-semibold">Revised Contract Total</span><strong>{formatCurrency(calc.revisedContract)}</strong></div>
            </div>
            {!form.change_order_amount && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800">
                ⚠ No change order price set yet. Go to Payment & Terms (Step 4) to enter the customer price.
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Payment & Terms ── */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Set the total amount, payment schedule, and contract terms.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Change Order Price — What Customer Pays ($) *</Label>
                <Input type="number" value={form.change_order_amount || ""} onChange={e => setNum("change_order_amount", e.target.value)} placeholder="Enter the price you're charging the client" />
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 space-y-1">
                <div className="flex items-center justify-between"><span className="text-xs text-blue-700">Original Contract:</span><span className="text-sm font-medium text-blue-900">{formatCurrency(form.original_contract_amount)}</span></div>
                <div className="flex items-center justify-between"><span className="text-xs text-blue-700">+ This Change Order:</span><span className="text-sm font-medium text-blue-900">{formatCurrency(calc.coAmount)}</span></div>
                <div className="flex items-center justify-between border-t border-blue-200 pt-1"><span className="text-xs font-bold text-blue-900">Revised Contract:</span><span className="text-sm font-bold text-blue-900">{formatCurrency(calc.revisedContract)}</span></div>
              </div>
            </div>

            {/* Payment Schedule */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="font-semibold">Payment Schedule</Label>
                <Button size="sm" variant="outline" onClick={() => set("payment_schedule", [...(form.payment_schedule || []), { milestone: "", condition: "", percent: 0, amount: 0 }])}>
                  + Add Payment
                </Button>
              </div>
              {form.payment_schedule && form.payment_schedule.length > 0 ? (
                <div className="space-y-3">
                  {form.payment_schedule.map((payment, idx) => (
                    <Card key={idx} className="p-4 space-y-3 bg-muted/30 border-l-4 border-l-primary">
                      <div className="space-y-2">
                        <div><Label className="text-xs font-semibold block mb-1">Payment Description *</Label>
                          <Input value={payment.milestone || ""} onChange={e => { const u = [...form.payment_schedule]; u[idx].milestone = e.target.value; set("payment_schedule", u); }} placeholder="e.g., Deposit, Progress Payment, Final Payment" className="h-9 text-sm" /></div>
                        <div><Label className="text-xs font-semibold block mb-1">When (Condition/Timing) *</Label>
                          <Input value={payment.condition || ""} onChange={e => { const u = [...form.payment_schedule]; u[idx].condition = e.target.value; set("payment_schedule", u); }} placeholder="e.g., Upon acceptance, Upon start of work, Upon completion" className="h-9 text-sm" /></div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div><Label className="text-xs">Type</Label>
                          <select value={payment.percent > 0 ? "percent" : "amount"} onChange={e => { const u = [...form.payment_schedule]; u[idx] = e.target.value === "percent" ? { ...payment, percent: payment.percent || 25, amount: 0 } : { ...payment, amount: payment.amount || 0, percent: 0 }; set("payment_schedule", u); }} className="h-9 w-full px-2 border rounded text-xs">
                            <option value="percent">% of Total</option>
                            <option value="amount">Fixed Amount</option>
                          </select>
                        </div>
                        <div><Label className="text-xs">Value</Label>
                          <Input type="number" value={payment.percent > 0 ? payment.percent : payment.amount} onChange={e => { const u = [...form.payment_schedule]; if (payment.percent > 0) u[idx].percent = parseFloat(e.target.value) || 0; else u[idx].amount = parseFloat(e.target.value) || 0; set("payment_schedule", u); }} className="h-9 text-sm" /></div>
                        <div className="flex flex-col justify-end">
                          <Button size="sm" variant="ghost" className="text-destructive h-9" onClick={() => set("payment_schedule", form.payment_schedule.filter((_, i) => i !== idx))}>Remove</Button>
                        </div>
                      </div>
                      <div className="pt-2 border-t px-2 py-1.5 bg-white/50 rounded text-xs text-muted-foreground">
                        <strong>Amount:</strong> {formatCurrency((payment.percent > 0 ? calc.coAmount * payment.percent / 100 : payment.amount) || 0)}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="border-t pt-3 space-y-3 bg-amber-50 border-l-4 border-amber-400 p-3 rounded">
                  <p className="text-xs text-amber-800 font-medium">Using simple deposit / final payment split (no custom schedule)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-sm">Deposit %</Label><Input type="number" value={form.deposit_percent} onChange={e => setNum("deposit_percent", e.target.value)} /></div>
                    <div className="p-2 bg-muted rounded flex items-center justify-between"><span className="text-xs">Deposit Amount:</span><span className="font-bold text-sm">{formatCurrency(calc.depositAmt)}</span></div>
                  </div>
                  <div className="p-2 bg-muted rounded flex items-center justify-between"><span className="text-xs">Final Payment:</span><span className="font-bold text-sm">{formatCurrency(calc.finalPayAmt)}</span></div>
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div><Label>Change Order Terms</Label><Textarea value={form.change_order_terms} onChange={e => set("change_order_terms", e.target.value)} rows={3} /></div>
              <div><Label>Additional Disclaimer</Label><Textarea value={form.disclaimer} onChange={e => set("disclaimer", e.target.value)} rows={2} placeholder="Any additional fees or conditions..." /></div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} placeholder="Internal notes..." /></div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Review ── */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2"><Calculator className="w-4 h-4" /> Change Order Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Job:</span> <strong>{form.job_title}</strong></div>
              <div><span className="text-muted-foreground">Client:</span> <strong>{form.client_name}</strong></div>
              <div><span className="text-muted-foreground">CO Title:</span> <strong>{form.title}</strong></div>
              <div><span className="text-muted-foreground">Reason:</span> <strong>{form.reason?.replace(/_/g, " ")}</strong></div>
            </div>

            <div className="space-y-1.5 text-sm border-t pt-3">
              {[
                ["Materials", form.material_cost],
                [`Labor (${form.labor_hours}h × ${formatCurrency(form.labor_rate)}/hr)`, calc.laborCost],
                ["Subcontractors", form.subcontractor_cost],
                ["Equipment", form.equipment_cost],
                ["Permits", form.permit_cost],
              ].filter(([, v]) => v > 0).map(([l, v]) => (
                <div key={l} className="flex justify-between"><span className="text-muted-foreground">{l}</span><strong>{formatCurrency(v)}</strong></div>
              ))}
              <div className="flex justify-between border-t pt-2"><span>Direct Costs</span><strong>{formatCurrency(calc.directCosts)}</strong></div>
              <div className="flex justify-between text-orange-700"><span>Overhead Reserve ({form.overhead_percent}%)</span><strong>- {formatCurrency(calc.overhead)}</strong></div>
              <div className="flex justify-between text-orange-700"><span>Contingency Reserve ({form.contingency_percent}%)</span><strong>- {formatCurrency(calc.contingency)}</strong></div>
              <div className="flex justify-between border-t pt-2"><span>Total Internal Costs</span><strong>{formatCurrency(calc.totalInternalCosts)}</strong></div>
              <div className="flex justify-between text-lg border-t pt-2"><span className="font-bold">Change Order Price (Customer Pays)</span><strong className="text-primary">{formatCurrency(calc.coAmount)}</strong></div>
              <div className={`flex justify-between ${calc.grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}><span>Your Profit (after reserves)</span><strong>{formatCurrency(calc.grossProfit)}</strong></div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-blue-700">Original Contract</span><span className="font-medium">{formatCurrency(form.original_contract_amount)}</span></div>
              <div className="flex justify-between text-green-700"><span>+ This Change Order</span><span className="font-medium">{formatCurrency(calc.coAmount)}</span></div>
              <div className="flex justify-between font-bold text-blue-900 border-t border-blue-200 pt-2 text-base"><span>Revised Contract Total</span><span>{formatCurrency(calc.revisedContract)}</span></div>
            </div>

            {form.scope_summary && (
              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Scope of Work</p>
                <p className="text-sm whitespace-pre-wrap">{form.scope_summary}</p>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-800">Ready to save or generate a contract? Use the buttons above.</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : onBack()}>
            <ArrowLeft className="w-4 h-4 mr-1" />{step > 0 ? "Back" : "Cancel"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={!form.title || !form.job_id || saving} className="bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4 mr-1" />{saving ? "Saving..." : "Save Change Order"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}