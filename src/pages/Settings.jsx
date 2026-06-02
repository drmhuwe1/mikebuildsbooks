import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Upload, X, ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { useToast } from "@/components/ui/use-toast";
import ManagerPayoutTracker from "@/components/settings/ManagerPayoutTracker.jsx";
import OwnerPayoutTracker from "@/components/settings/OwnerPayoutTracker.jsx";
import OwnerAccessSetup from "@/components/settings/OwnerAccessSetup.jsx";
import StripeKeysSetup from "@/components/settings/StripeKeysSetup.jsx";

export default function Settings() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: settings = [], isLoading } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });

  const existing = settings[0];
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [form, setForm] = useState(null);

   useEffect(() => {
     if (existing && !form) {
       setForm({
         tax_reserve_percent: existing.tax_reserve_percent ?? 25,
         operating_reserve_percent: existing.operating_reserve_percent ?? 5,
         manager_pay_percent: existing.manager_pay_percent ?? 10,
         payout_basis: existing.payout_basis || "net_profit",
         default_overhead_percent: existing.default_overhead_percent ?? 10,
         default_contingency_percent: existing.default_contingency_percent ?? 5,
         default_profit_margin: existing.default_profit_margin ?? 20,
         default_labor_rate: existing.default_labor_rate ?? 45,
         company_name: existing.company_name || "",
         company_address: existing.company_address || "",
         company_phone: existing.company_phone || "",
         company_email: existing.company_email || "",
         company_website: existing.company_website || "",
         company_ein: existing.company_ein || "",
         company_logo_url: existing.company_logo_url || "",
         doc_margin_top: existing.doc_margin_top ?? 1,
         doc_margin_bottom: existing.doc_margin_bottom ?? 1,
         doc_margin_left: existing.doc_margin_left ?? 1,
         doc_margin_right: existing.doc_margin_right ?? 1,
         doc_footer_text: existing.doc_footer_text || "",
         manager_name: existing.manager_name || "",
         manager_ein_or_ssn: existing.manager_ein_or_ssn || "",
         manager_address: existing.manager_address || "",
         manager_email: existing.manager_email || "",
         owner_name: existing.owner_name || "",
         manager_pay_basis: existing.manager_pay_basis || "gross_before_subs",
         manager_pay_type: existing.manager_pay_type || "percent",
         manager_pay_flat_amount: existing.manager_pay_flat_amount ?? 0,
         overhead_mode: existing.overhead_mode || "direct",
         });
     } else if (!existing && !form && !isLoading) {
       setForm({
         tax_reserve_percent: 25, operating_reserve_percent: 5, manager_pay_percent: 10,
         payout_basis: "net_profit", default_overhead_percent: 10, default_contingency_percent: 5,
         default_profit_margin: 20, default_labor_rate: 45,
         company_name: "", company_address: "", company_phone: "", company_email: "", company_website: "", company_ein: "",
         company_logo_url: "", doc_margin_top: 1, doc_margin_bottom: 1, doc_margin_left: 1, doc_margin_right: 1, doc_footer_text: "",
         manager_name: "", manager_ein_or_ssn: "", manager_address: "", manager_email: "", owner_name: "", manager_pay_basis: "gross_before_subs",
         manager_pay_type: "percent", manager_pay_flat_amount: 0, overhead_mode: "direct",
         });
     }
   }, [existing, isLoading]);

  const saveMutation = useMutation({
    mutationFn: (data) => existing
      ? base44.entities.AppSettings.update(existing.id, data)
      : base44.entities.AppSettings.create({ ...data, settings_key: "global" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); toast({ title: "Settings saved" }); },
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setNum = (k, v) => setForm(f => ({ ...f, [k]: parseFloat(v) || 0 }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("company_logo_url", file_url);
    setLogoPreview(null);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast({ title: "Logo uploaded successfully" });
  };

  if (!form) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="Settings" description="Configure calculation rules, defaults, and company info" />

      <div className="space-y-6 max-w-2xl">
        {/* Company Info */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">Company Information</h3>
          <div className="space-y-3">
            <div><Label>Company Name</Label><Input value={form.company_name} onChange={e => set("company_name", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input value={form.company_email} onChange={e => set("company_email", e.target.value)} /></div>
              <div><Label>Phone</Label><Input value={form.company_phone} onChange={e => set("company_phone", e.target.value)} /></div>
            </div>
            <div><Label>Website</Label><Input value={form.company_website} onChange={e => set("company_website", e.target.value)} placeholder="https://example.com" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Address</Label><Input value={form.company_address} onChange={e => set("company_address", e.target.value)} /></div>
              <div><Label>EIN / Tax ID</Label><Input value={form.company_ein} onChange={e => set("company_ein", e.target.value)} placeholder="e.g. 12-3456789" /></div>
            </div>
          </div>
        </Card>

        {/* Payout Distribution */}
        <Card className="p-5 border-primary/30">
          <h3 className="text-sm font-semibold mb-2">Payout Distribution Rules</h3>
          <p className="text-xs text-muted-foreground mb-4">Configure how profit is distributed from each job. Tax and Operating reserves are percentages; owner payout is the remainder.</p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tax Reserve %</Label>
                <Input type="number" value={form.tax_reserve_percent} onChange={e => setNum("tax_reserve_percent", e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">For owner's personal income tax</p>
              </div>
              <div>
                <Label>Operating Reserve %</Label>
                <Input type="number" value={form.operating_reserve_percent} onChange={e => setNum("operating_reserve_percent", e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">Emergency business cash buffer</p>
              </div>
            </div>

            {/* Manager Pay Type + Amount */}
            <div className="space-y-2">
              <Label>Manager Pay Type</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => set("manager_pay_type", "percent")}
                  className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors ${
                    form.manager_pay_type !== "flat_rate"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-input hover:bg-muted"
                  }`}
                >
                  % of Profit
                </button>
                <button
                  type="button"
                  onClick={() => set("manager_pay_type", "flat_rate")}
                  className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors ${
                    form.manager_pay_type === "flat_rate"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-input hover:bg-muted"
                  }`}
                >
                  Flat Rate ($/job)
                </button>
              </div>
              {form.manager_pay_type === "flat_rate" ? (
                <div>
                  <Label>Flat Amount per Job ($)</Label>
                  <Input type="number" value={form.manager_pay_flat_amount} onChange={e => setNum("manager_pay_flat_amount", e.target.value)} placeholder="e.g. 500" />
                  <p className="text-xs text-muted-foreground mt-1">Fixed dollar amount paid to manager for each job closed</p>
                </div>
              ) : (
                <div>
                  <Label>Manager Pay %</Label>
                  <Input type="number" value={form.manager_pay_percent} onChange={e => setNum("manager_pay_percent", e.target.value)} />
                  <p className="text-xs text-muted-foreground mt-1">% of gross profit per job (1099 contractor compensation)</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Manager Pay Basis</Label>
              <p className="text-xs text-muted-foreground">
                {form.manager_pay_type === "flat_rate"
                  ? <>Determines whether the flat rate is deducted <strong>before</strong> or <strong>after</strong> subcontractor payouts.</>
                  : <>Calculate manager's % from gross profit <strong>before</strong> or <strong>after</strong> subcontractor payouts are deducted.</>
                }
              </p>
              <select
                value={form.manager_pay_basis || "gross_before_subs"}
                onChange={e => set("manager_pay_basis", e.target.value)}
                className="w-full h-9 border border-input rounded-md px-3 text-sm bg-background"
              >
                <option value="gross_before_subs">
                  {form.manager_pay_type === "flat_rate"
                    ? "Before sub payouts (recommended — flat rate deducted before subs)"
                    : "Before sub payouts (recommended — manager gets % of full gross profit)"}
                </option>
                <option value="gross_after_subs">
                  {form.manager_pay_type === "flat_rate"
                    ? "After sub payouts — flat rate deducted after subs are paid"
                    : "After sub payouts (manager % is taken after subs are paid)"}
                </option>
              </select>
            </div>
            {/* R2-7: Percentage overflow validation */}
            {(() => {
              const totalPct = (form.manager_pay_type !== "flat_rate" ? (form.manager_pay_percent || 0) : 0)
                + (form.tax_reserve_percent || 0)
                + (form.operating_reserve_percent || 0);
              const ownerRemainder = 100 - totalPct;
              if (ownerRemainder > 0) return (
                <p className="text-xs text-green-700 font-medium">✓ Owner receives {ownerRemainder.toFixed(1)}% as remainder</p>
              );
              if (ownerRemainder === 0) return (
                <p className="text-xs text-amber-700 font-medium">⚠ Splits use exactly 100% — owner receives nothing</p>
              );
              return (
                <p className="text-xs text-red-700 font-semibold">⚠️ Splits total {totalPct.toFixed(1)}% — exceeds 100%. Owner payout will be $0. Reduce percentages.</p>
              );
            })()}

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-xs text-blue-900 font-semibold mb-2">Distribution Order ({form.manager_pay_basis === "gross_after_subs" ? "manager paid after subs" : "manager paid before subs"}):</p>
              {form.manager_pay_basis === "gross_before_subs" ? (
                <>
                  <p className="text-xs text-blue-800">1. Manager Pay ({form.manager_pay_type === "flat_rate" ? `$${form.manager_pay_flat_amount}/job flat` : `${form.manager_pay_percent}% of gross profit`})</p>
                  <p className="text-xs text-blue-800">2. Tax Reserve ({form.tax_reserve_percent}%)</p>
                  <p className="text-xs text-blue-800">3. Operating Reserve ({form.operating_reserve_percent}%)</p>
                  <p className="text-xs text-blue-800">4. Subcontractor Payouts (actual)</p>
                  <p className="text-xs text-blue-900 font-semibold">5. Owner Payout = Remainder</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-blue-800">1. Tax Reserve ({form.tax_reserve_percent}%)</p>
                  <p className="text-xs text-blue-800">2. Operating Reserve ({form.operating_reserve_percent}%)</p>
                  <p className="text-xs text-blue-800">3. Subcontractor Payouts (actual)</p>
                  <p className="text-xs text-blue-800">4. Manager Pay ({form.manager_pay_type === "flat_rate" ? `$${form.manager_pay_flat_amount}/job flat` : `${form.manager_pay_percent}% of remaining`})</p>
                  <p className="text-xs text-blue-900 font-semibold">5. Owner Payout = Remainder</p>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Bid Defaults */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-2">Bid Builder Defaults</h3>
          <p className="text-xs text-muted-foreground mb-4">Default values used when creating new bids.</p>

          {/* Overhead Cost Mode Toggle */}
          <div className="mb-4 space-y-2">
            <Label>Overhead Cost Mode</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => set("overhead_mode", "direct")}
                className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors ${
                  form.overhead_mode !== "percentage"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-input hover:bg-muted"
                }`}
              >
                Direct Amount
              </button>
              <button
                type="button"
                onClick={() => set("overhead_mode", "percentage")}
                className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors ${
                  form.overhead_mode === "percentage"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-input hover:bg-muted"
                }`}
              >
                % of Contract
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {form.overhead_mode === "percentage"
                ? "A percentage of the adjusted contract amount is automatically calculated as overhead on each job. Best for shops with fixed monthly overhead costs to allocate across jobs."
                : "Enter actual job expenses (fuel, rentals, dump fees, miscellaneous costs) directly on each job. Best for owner-operators without fixed office overhead."}
            </p>
            {form.overhead_mode === "percentage" && (
              <div className="pt-1">
                <Label>Default Overhead %</Label>
                <Input type="number" value={form.default_overhead_percent} onChange={e => setNum("default_overhead_percent", e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">e.g. 12 means 12% of contract amount will be added as overhead cost</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {form.overhead_mode !== "percentage" && (
              <div><Label>Default Overhead %</Label><Input type="number" value={form.default_overhead_percent} onChange={e => setNum("default_overhead_percent", e.target.value)} /></div>
            )}
            <div><Label>Default Contingency %</Label><Input type="number" value={form.default_contingency_percent} onChange={e => setNum("default_contingency_percent", e.target.value)} /></div>
            <div><Label>Default Profit Margin %</Label><Input type="number" value={form.default_profit_margin} onChange={e => setNum("default_profit_margin", e.target.value)} /></div>
            <div><Label>Default Labor Rate ($/hr)</Label><Input type="number" value={form.default_labor_rate} onChange={e => setNum("default_labor_rate", e.target.value)} /></div>
          </div>
        </Card>

        {/* Document Settings */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-2">Document Settings</h3>
          <p className="text-xs text-muted-foreground mb-4">Configure margins and footer text for generated PDFs.</p>
          <div className="space-y-3">
            <div>
              <Label>Company Logo</Label>
              <p className="text-xs text-muted-foreground mb-2">This logo will appear at the top of all documents, PDFs, contracts, and correspondence.</p>
              <div className="flex items-start gap-3">
                 {form.company_logo_url || logoPreview ? (
                   <div className="relative border rounded-lg p-2 bg-muted/30">
                     <img src={logoPreview || form.company_logo_url} alt="Company logo" className="h-16 max-w-[200px] object-contain" />
                     {!uploading && <button onClick={() => { set("company_logo_url", ""); setLogoPreview(null); }} className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs">
                       <X className="w-3 h-3" />
                     </button>}
                   </div>
                 ) : (
                   <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-1 text-muted-foreground w-[160px]">
                     <ImageIcon className="w-6 h-6" />
                     <span className="text-xs">No logo set</span>
                   </div>
                 )}
                <div className="space-y-2 flex-1">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-1.5 w-full">
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? "Uploading..." : "Upload Logo"}
                  </Button>
                  <p className="text-xs text-muted-foreground">or paste URL:</p>
                  <Input value={form.company_logo_url} onChange={e => set("company_logo_url", e.target.value)} placeholder="https://..." className="text-xs h-8" />
                </div>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Page Margins (inches)</Label>
              <div className="grid grid-cols-4 gap-3">
                <div><Label className="text-xs text-muted-foreground">Top</Label><Input type="number" step="0.25" value={form.doc_margin_top} onChange={e => setNum("doc_margin_top", e.target.value)} /></div>
                <div><Label className="text-xs text-muted-foreground">Bottom</Label><Input type="number" step="0.25" value={form.doc_margin_bottom} onChange={e => setNum("doc_margin_bottom", e.target.value)} /></div>
                <div><Label className="text-xs text-muted-foreground">Left</Label><Input type="number" step="0.25" value={form.doc_margin_left} onChange={e => setNum("doc_margin_left", e.target.value)} /></div>
                <div><Label className="text-xs text-muted-foreground">Right</Label><Input type="number" step="0.25" value={form.doc_margin_right} onChange={e => setNum("doc_margin_right", e.target.value)} /></div>
              </div>
            </div>
            <div><Label>Custom Footer Text (optional)</Label><Input value={form.doc_footer_text} onChange={e => set("doc_footer_text", e.target.value)} placeholder="e.g. Confidential — Internal Use Only" /></div>
          </div>
        </Card>

        {/* Owner & Signatures */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-2">Owner Information</h3>
          <p className="text-xs text-muted-foreground mb-4">Your name will appear on signature lines in contracts and bids.</p>
          <div><Label>Business Owner/Principal Name</Label><Input value={form.owner_name} onChange={e => set("owner_name", e.target.value)} placeholder="e.g. Mike Johnson" /></div>
        </Card>

        {/* Business Manager 1099 */}
         <Card className="p-5 border-primary/30">
           <h3 className="text-sm font-semibold mb-1">Business Manager — 1099 Contractor Info</h3>
           <p className="text-xs text-muted-foreground mb-4">The business manager is compensated as a 1099 independent contractor from job profit. Their pay percentage is configured in the Payout Distribution section above.</p>
           <div className="space-y-3">
             <div className="grid grid-cols-2 gap-3">
               <div><Label>Manager Full Name</Label><Input value={form.manager_name} onChange={e => set("manager_name", e.target.value)} placeholder="e.g. Mike Smith" /></div>
               <div><Label>Manager Email</Label><Input value={form.manager_email} onChange={e => set("manager_email", e.target.value)} placeholder="manager@email.com" /></div>
             </div>
             <div className="grid grid-cols-2 gap-3">
               <div><Label>EIN or SSN (last 4 for display)</Label><Input value={form.manager_ein_or_ssn} onChange={e => set("manager_ein_or_ssn", e.target.value)} placeholder="e.g. XX-XXX1234" /></div>
             </div>
             <div><Label>Manager Mailing Address (for 1099)</Label><Input value={form.manager_address} onChange={e => set("manager_address", e.target.value)} placeholder="Street, City, State, ZIP" /></div>
           </div>
            <p className="text-xs text-muted-foreground mt-3 bg-primary/5 border border-primary/20 rounded px-3 py-2">
              Manager compensation is {form.manager_pay_type === "flat_rate" ? `$${form.manager_pay_flat_amount} flat per job` : `${form.manager_pay_percent}% of gross profit per job`} and is reported on a 1099-NEC at year-end.
            </p>
         </Card>

         {/* Manager Payout Tracking */}
         <ManagerPayoutTracker />

         {/* Owner Payout Tracking */}
         <OwnerPayoutTracker />

         {/* Field Payments Access */}
         <OwnerAccessSetup />

         {/* Stripe Setup */}
         <StripeKeysSetup />

         {/* R2-7: Disable save if splits exceed 100% */}
         {(() => {
           const totalPct = (form.manager_pay_type !== "flat_rate" ? (form.manager_pay_percent || 0) : 0)
             + (form.tax_reserve_percent || 0)
             + (form.operating_reserve_percent || 0);
           if (totalPct > 100) return (
             <p className="text-sm text-red-700 font-semibold">Cannot save — splits exceed 100%. Adjust percentages first.</p>
           );
           return null;
         })()}
         {(() => {
           const totalPct = (form.manager_pay_type !== "flat_rate" ? (form.manager_pay_percent || 0) : 0)
             + (form.tax_reserve_percent || 0)
             + (form.operating_reserve_percent || 0);
           return (
             <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || totalPct > 100} className="w-full sm:w-auto">
          <Save className="w-4 h-4 mr-1.5" />
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
          );
          })()}
      </div>
    </div>
  );
}