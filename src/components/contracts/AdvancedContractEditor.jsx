import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Printer, Save, CheckCircle, Eye, EyeOff } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CONTRACT_TEMPLATE_V1 } from "@/lib/contractTemplateV1";
import { useToast } from "@/components/ui/use-toast";

const LOGO_URL = "https://media.base44.com/images/public/69b9774720c1d890b1162f57/17e5112da_MikeBuildsBooksLogo.png";

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-semibold block mb-1 text-slate-600">{label}</label>
      {children}
    </div>
  );
}

export default function AdvancedContractEditor({ contract, company, onClose, onSave }) {
  const [data, setData] = useState({ ...contract });
  const [showPreview, setShowPreview] = useState(true);
  const [printing, setPrinting] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  const setNum = (k, v) => setData(d => ({ ...d, [k]: parseFloat(v) || 0 }));

  const paymentLines = (data.payment_schedule || "").split("\n");

  const updatePaymentLine = (idx, val) => {
    const lines = [...paymentLines];
    lines[idx] = val;
    set("payment_schedule", lines.join("\n"));
  };

  const addPaymentLine = () => {
    set("payment_schedule", [...paymentLines, ""].join("\n"));
  };

  const removePaymentLine = (idx) => {
    const lines = paymentLines.filter((_, i) => i !== idx);
    set("payment_schedule", lines.join("\n"));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.entities.Contract.update(contract.id, {
        ...data,
        client_paid_amount: parseFloat(data.client_paid_amount) || 0,
      });
      if (data.job_id && data.client_paid_amount > 0) {
        try {
          await base44.functions.invoke('syncContractPaymentToJob', {
            contractId: contract.id,
            clientPaidAmount: data.client_paid_amount,
          });
        } catch (err) {
          console.warn('Sync warning:', err);
        }
      }
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Changes saved!" });
      onSave?.();
    },
  });

  const signMutation = useMutation({
    mutationFn: () => base44.entities.Contract.update(contract.id, {
      ...data,
      status: 'signed',
      client_paid_amount: parseFloat(data.client_paid_amount) || 0,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: 'Contract signed!' });
      set("status", "signed");
      onSave?.();
    },
  });

  const co = company || {};

  const buildHtml = (forPrint = false) => CONTRACT_TEMPLATE_V1.buildHTML(data, co, LOGO_URL, forPrint);

  const fetchImageAsDataUrl = async (url) => {
    if (!url) return null;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch { return null; }
  };

  const handlePrint = async () => {
    try {
      setPrinting(true);
      const companyLogoData = co.company_logo_url ? await fetchImageAsDataUrl(co.company_logo_url) : null;
      const appLogoData = await fetchImageAsDataUrl(LOGO_URL);
      let html = buildHtml(true);
      if (companyLogoData && co.company_logo_url) {
        html = html.replace(new RegExp(`src="[^"]*\\Q${co.company_logo_url}\\E[^"]*"`, 'g'), `src="${companyLogoData}"`);
      }
      if (appLogoData) {
        html = html.replace(/src="[^"]*MikeBuildsBooksLogo[^"]*"/g, `src="${appLogoData}"`);
      }
      const printWindow = window.open('', '', 'width=1200,height=800');
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => { printWindow.focus(); printWindow.print(); setTimeout(() => printWindow.close(), 500); }, 1500);
    } catch (error) {
      console.error('Print error:', error);
      alert('Error preparing PDF. Try again.');
    } finally {
      setPrinting(false);
    }
  };

  const inputCls = "w-full text-sm border border-slate-200 rounded p-2 bg-white focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b bg-white shrink-0 flex-wrap">
        <Button size="sm" onClick={handlePrint} disabled={printing}>
          <Printer className="w-4 h-4 mr-1" />{printing ? "Generating..." : "Print / PDF"}
        </Button>
        <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-green-600 hover:bg-green-700">
          <Save className="w-4 h-4 mr-1" />{saveMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
        {data.status !== 'signed' && (
          <Button size="sm" onClick={() => signMutation.mutate()} disabled={signMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
            <CheckCircle className="w-4 h-4 mr-1" />{signMutation.isPending ? "Signing..." : "Sign Contract"}
          </Button>
        )}
        {data.status === 'signed' && (
          <div className="flex items-center gap-1 px-3 py-1 bg-green-100 rounded-md text-green-700 text-xs font-medium">
            <CheckCircle className="w-3 h-3" /> Signed
          </div>
        )}
        <Button size="sm" variant="outline" onClick={() => setShowPreview(v => !v)}>
          {showPreview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
          {showPreview ? "Hide Preview" : "Show Preview"}
        </Button>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Body: editor left, preview right */}
      <div className="flex flex-1 overflow-hidden">

        {/* Edit Panel — always fully scrollable */}
        <div className="w-full overflow-y-auto bg-slate-50 p-5 space-y-6" style={{ width: showPreview ? "40%" : "100%" }}>

          {/* Client Info */}
          <section>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Client Info</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name"><input className={inputCls} value={data.client_name || ""} onChange={e => set("client_name", e.target.value)} /></Field>
              <Field label="Last Name"><input className={inputCls} value={data.client_last_name || ""} onChange={e => set("client_last_name", e.target.value)} /></Field>
              <div className="col-span-2">
                <Field label="Client Address"><input className={inputCls} value={data.client_address || ""} onChange={e => set("client_address", e.target.value)} /></Field>
              </div>
              <Field label="Start Date"><input type="date" className={inputCls} value={data.start_date || ""} onChange={e => set("start_date", e.target.value)} /></Field>
              <Field label="Est. Completion"><input type="date" className={inputCls} value={data.estimated_completion || ""} onChange={e => set("estimated_completion", e.target.value)} /></Field>
            </div>
          </section>

          {/* Project Details */}
          <section>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Project Details</p>
            <div className="space-y-3">
              <Field label="Project Description">
                <textarea className={inputCls} rows={3} value={data.project_description || ""} onChange={e => set("project_description", e.target.value)} placeholder="Overall project description..." />
              </Field>
              <Field label="Scope of Work">
                <textarea className={inputCls} rows={6} value={data.scope_summary || ""} onChange={e => set("scope_summary", e.target.value)} placeholder="Detailed scope of work..." />
              </Field>
            </div>
          </section>

          {/* Payment Schedule */}
          <section>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Payment Schedule</p>
            <div className="space-y-3">
              <Field label="Contract Total ($)">
                <input type="number" className={inputCls} value={data.contract_amount || ""} onChange={e => setNum("contract_amount", e.target.value)} />
              </Field>
              <Field label="Deposit Amount ($)">
                <input type="number" className={inputCls} value={data.deposit_amount || ""} onChange={e => setNum("deposit_amount", e.target.value)} />
              </Field>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-600">Payment Lines <span className="font-normal text-slate-400">(one per line on the contract)</span></label>
                  <button type="button" onClick={addPaymentLine} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90">
                    + Add Payment
                  </button>
                </div>
                {paymentLines.map((line, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      className={inputCls + " flex-1"}
                      value={line}
                      onChange={e => updatePaymentLine(idx, e.target.value)}
                      placeholder="e.g. Deposit: $10,000 — Due upon acceptance"
                    />
                    <button type="button" onClick={() => removePaymentLine(idx)} className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded border border-red-200 shrink-0">✕</button>
                  </div>
                ))}
                {paymentLines.every(l => !l.trim()) && (
                  <p className="text-xs text-slate-400 italic">No payment lines yet. Click "+ Add Payment" to add entries.</p>
                )}
              </div>

              <Field label="Amount Paid to Date ($)">
                <input type="number" className={inputCls} value={data.client_paid_amount || ""} onChange={e => setNum("client_paid_amount", e.target.value)} />
              </Field>
            </div>
          </section>

          {/* Terms */}
          <section>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Terms & Conditions</p>
            <div className="space-y-3">
              <Field label="Change Order Terms">
                <textarea className={inputCls} rows={4} value={data.change_order_terms || ""} onChange={e => set("change_order_terms", e.target.value)} />
              </Field>
              <Field label="Notes / Additional Terms">
                <textarea className={inputCls} rows={4} value={data.notes || ""} onChange={e => set("notes", e.target.value)} placeholder="Additional terms, cost breakdown, etc." />
              </Field>
              <Field label="Disclaimer / Additional Fees">
                <textarea className={inputCls} rows={3} value={data.disclaimer || ""} onChange={e => set("disclaimer", e.target.value)} placeholder="e.g. Possible manifold replacement ~$500 if needed" />
              </Field>
            </div>
          </section>

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full bg-green-600 hover:bg-green-700">
            {saveMutation.isPending ? "Saving..." : "Save All Changes"}
          </Button>
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="flex-1 overflow-hidden border-l" style={{ minWidth: 0 }}>
            <iframe
              srcDoc={buildHtml(false)}
              title="Contract Preview"
              style={{ width: "100%", height: "100%", border: "none" }}
              key={JSON.stringify(data)}
            />
          </div>
        )}
      </div>
    </div>
  );
}