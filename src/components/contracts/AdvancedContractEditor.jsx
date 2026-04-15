import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Edit2, Printer, Save, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CONTRACT_TEMPLATE_V1 } from "@/lib/contractTemplateV1";
import { useToast } from "@/components/ui/use-toast";

const LOGO_URL = "https://media.base44.com/images/public/69b9774720c1d890b1162f57/17e5112da_MikeBuildsBooksLogo.png";

export default function AdvancedContractEditor({ contract, company, onClose, onSave }) {
  const [data, setData] = useState({ ...contract });
  const [showEdit, setShowEdit] = useState(false);
  const [printing, setPrinting] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const finalPayment = Math.max(0, parseFloat(data.contract_amount || 0) - parseFloat(data.deposit_amount || 0) - parseFloat(data.start_of_construction_amount || 0));
      const result = await base44.entities.Contract.update(contract.id, {
        ...data,
        client_paid_amount: parseFloat(data.client_paid_amount) || 0,
        final_payment_amount: finalPayment,
      });
      
      // Sync payment to job if updated
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
      onSave?.();
    },
  });

  const signMutation = useMutation({
    mutationFn: () => {
      const finalPayment = Math.max(0, parseFloat(data.contract_amount || 0) - parseFloat(data.deposit_amount || 0) - parseFloat(data.start_of_construction_amount || 0));
      return base44.entities.Contract.update(contract.id, {
        ...data,
        status: 'signed',
        client_paid_amount: parseFloat(data.client_paid_amount) || 0,
        final_payment_amount: finalPayment,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: 'Contract signed!' });
      setData(d => ({ ...d, status: 'signed' }));
      onSave?.();
    },
  });

  const co = company || {};

  const buildHtml = (forPrint = false) => {
    return CONTRACT_TEMPLATE_V1.buildHTML(data, co, LOGO_URL, forPrint);
  };

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
    } catch {
      return null;
    }
  };

  const handlePrint = async () => {
    try {
      setPrinting(true);
      
      // Fetch images as data URLs for proper PDF embedding
      const companyLogoData = co.company_logo_url ? await fetchImageAsDataUrl(co.company_logo_url) : null;
      const appLogoData = await fetchImageAsDataUrl(LOGO_URL);
      
      // Build the HTML with embedded images
      let html = buildHtml(true);
      
      // Replace image src with data URLs
      if (companyLogoData && co.company_logo_url) {
        html = html.replace(
          new RegExp(`src="[^"]*\\Q${co.company_logo_url}\\E[^"]*"`, 'g'),
          `src="${companyLogoData}"`
        );
      }
      if (appLogoData) {
        html = html.replace(
          /src="[^"]*MikeBuildsBooksLogo[^"]*"/g,
          `src="${appLogoData}"`
        );
      }
      
      // Create print window with proper settings
      const printWindow = window.open('', '', 'width=1200,height=800');
      printWindow.document.write(html);
      printWindow.document.close();
      
      // Wait for images to load before printing
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => printWindow.close(), 500);
      }, 1500);
    } catch (error) {
      console.error('Print error:', error);
      alert('Error preparing PDF. Try again.');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
      {/* Toolbar */}
       <div className="flex items-center gap-2 p-3 border-b bg-white shrink-0 flex-wrap">
         <Button size="sm" onClick={handlePrint} disabled={printing}>
           <Printer className="w-4 h-4 mr-1" /> {printing ? "Generating PDF..." : "Print / Save as PDF"}
         </Button>
         <Button size="sm" variant="outline" onClick={() => setShowEdit(v => !v)}>
           <Edit2 className="w-4 h-4 mr-1" />{showEdit ? "Hide" : "Edit"} Details
         </Button>
         {showEdit && (
           <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-green-600 hover:bg-green-700">
             <Save className="w-4 h-4 mr-1" /> {saveMutation.isPending ? "Saving..." : "Save Changes"}
           </Button>
         )}
         {data.status !== 'signed' && (
           <Button size="sm" onClick={() => signMutation.mutate()} disabled={signMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
             <CheckCircle className="w-4 h-4 mr-1" /> {signMutation.isPending ? "Signing..." : "Sign Contract"}
           </Button>
         )}
         {data.status === 'signed' && (
           <div className="flex items-center gap-1 px-3 py-1 bg-green-100 rounded-md text-green-700 text-xs font-medium">
             <CheckCircle className="w-3 h-3" /> Signed
           </div>
         )}
         <Button size="sm" variant="ghost" className="ml-auto" onClick={onClose}>
           <X className="w-4 h-4" />
         </Button>
       </div>

      {/* Full editor panel */}
      {showEdit && (
        <div className="border-b bg-slate-50 p-4 overflow-y-auto flex-shrink-0 space-y-4" style={{ maxHeight: "60vh" }}>

          {/* Client & Dates */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Client Info</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold block mb-1">Client First Name</label><Input value={data.client_name || ""} onChange={e => setData(d => ({ ...d, client_name: e.target.value }))} className="text-sm" /></div>
              <div><label className="text-xs font-semibold block mb-1">Client Last Name</label><Input value={data.client_last_name || ""} onChange={e => setData(d => ({ ...d, client_last_name: e.target.value }))} className="text-sm" /></div>
              <div className="col-span-2"><label className="text-xs font-semibold block mb-1">Client Address</label><Input value={data.client_address || ""} onChange={e => setData(d => ({ ...d, client_address: e.target.value }))} className="text-sm" /></div>
              <div><label className="text-xs font-semibold block mb-1">Start Date</label><Input type="date" value={data.start_date || ""} onChange={e => setData(d => ({ ...d, start_date: e.target.value }))} className="text-sm" /></div>
              <div><label className="text-xs font-semibold block mb-1">Est. Completion</label><Input type="date" value={data.estimated_completion || ""} onChange={e => setData(d => ({ ...d, estimated_completion: e.target.value }))} className="text-sm" /></div>
            </div>
          </div>

          {/* Scope */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Project Details</p>
            <div className="space-y-3">
              <div><label className="text-xs font-semibold block mb-1">Project Description</label><textarea value={data.project_description || ""} onChange={e => setData(d => ({ ...d, project_description: e.target.value }))} className="w-full text-xs border rounded p-2 bg-white" rows={3} placeholder="Overall project description..." /></div>
              <div><label className="text-xs font-semibold block mb-1">Scope of Work</label><textarea value={data.scope_summary || ""} onChange={e => setData(d => ({ ...d, scope_summary: e.target.value }))} className="w-full text-xs border rounded p-2 bg-white" rows={5} placeholder="Detailed scope of work..." /></div>
            </div>
          </div>

          {/* Payment Schedule */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Schedule</p>
            <div className="space-y-3">
              <div><label className="text-xs font-semibold block mb-1">Contract Total ($)</label><Input type="number" value={data.contract_amount || 0} onChange={e => setData(d => ({ ...d, contract_amount: parseFloat(e.target.value) || 0 }))} className="text-sm" /></div>

              {/* Payment rows */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold">Payment Lines <span className="font-normal text-slate-400">(each appears as a bullet on the contract)</span></label>
                  <button
                    type="button"
                    onClick={() => {
                      const lines = (data.payment_schedule || "").split("\n").filter(Boolean);
                      lines.push("");
                      setData(d => ({ ...d, payment_schedule: lines.join("\n") }));
                    }}
                    className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  >+ Add Line</button>
                </div>
                {(data.payment_schedule || "").split("\n").map((line, idx, arr) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Input
                      value={line}
                      onChange={e => {
                        const lines = (data.payment_schedule || "").split("\n");
                        lines[idx] = e.target.value;
                        setData(d => ({ ...d, payment_schedule: lines.join("\n") }));
                      }}
                      className="text-xs flex-1"
                      placeholder={`e.g. Deposit: $5,000 — Due upon acceptance`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const lines = (data.payment_schedule || "").split("\n");
                        lines.splice(idx, 1);
                        setData(d => ({ ...d, payment_schedule: lines.join("\n") }));
                      }}
                      className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded border border-red-200"
                    >✕</button>
                  </div>
                ))}
                {!(data.payment_schedule || "").trim() && (
                  <button
                    type="button"
                    onClick={() => setData(d => ({ ...d, payment_schedule: "" }))}
                    className="text-xs text-muted-foreground"
                  >Click "+ Add Line" to add payment entries</button>
                )}
              </div>

              <div><label className="text-xs font-semibold block mb-1">Amount Paid to Date ($)</label><Input type="number" value={data.client_paid_amount || 0} onChange={e => setData(d => ({ ...d, client_paid_amount: parseFloat(e.target.value) || 0 }))} className="text-sm" /></div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Terms & Conditions</p>
            <div className="space-y-3">
              <div><label className="text-xs font-semibold block mb-1">Change Order Terms</label><textarea value={data.change_order_terms || ""} onChange={e => setData(d => ({ ...d, change_order_terms: e.target.value }))} className="w-full text-xs border rounded p-2 bg-white" rows={3} /></div>
              <div><label className="text-xs font-semibold block mb-1">Notes / Terms &amp; Conditions</label><textarea value={data.notes || ""} onChange={e => setData(d => ({ ...d, notes: e.target.value }))} className="w-full text-xs border rounded p-2 bg-white" rows={4} placeholder="Additional terms, conditions, cost breakdown, etc." /></div>
              <div><label className="text-xs font-semibold block mb-1">Disclaimer / Additional Fees</label><textarea value={data.disclaimer || ""} onChange={e => setData(d => ({ ...d, disclaimer: e.target.value }))} className="w-full text-xs border rounded p-2 bg-white" rows={3} placeholder="e.g. Possible manifold replacement ~$500 if needed" /></div>
            </div>
          </div>

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full bg-green-600 hover:bg-green-700">
            {saveMutation.isPending ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      )}

      {/* Live preview - shows the paper-card layout */}
      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <iframe
          srcDoc={buildHtml(false)}
          title="Contract Preview"
          style={{ width: "100%", height: "100%", border: "none" }}
          key={JSON.stringify(data)}
        />
      </div>
    </div>
  );
}