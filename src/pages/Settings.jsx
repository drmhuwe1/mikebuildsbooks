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

export default function Settings() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: settings = [], isLoading } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });

  const existing = settings[0];
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (existing && !form) {
      setForm({
        tax_reserve_percent: existing.tax_reserve_percent ?? 25,
        subcontractor_reserve_percent: existing.subcontractor_reserve_percent ?? 10,
        operating_reserve_percent: existing.operating_reserve_percent ?? 10,
        owner_payout_percent: existing.owner_payout_percent ?? 30,
        admin_compensation_percent: existing.admin_compensation_percent ?? 15,
        retained_earnings_percent: existing.retained_earnings_percent ?? 10,
        payout_basis: existing.payout_basis || "net_profit",
        default_overhead_percent: existing.default_overhead_percent ?? 10,
        default_contingency_percent: existing.default_contingency_percent ?? 5,
        default_profit_margin: existing.default_profit_margin ?? 20,
        default_labor_rate: existing.default_labor_rate ?? 45,
        company_name: existing.company_name || "",
        company_address: existing.company_address || "",
        company_phone: existing.company_phone || "",
        company_email: existing.company_email || "",
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
        manager_pay_percent: existing.manager_pay_percent ?? 10,
      });
    } else if (!existing && !form && !isLoading) {
      setForm({
        tax_reserve_percent: 25, subcontractor_reserve_percent: 10, operating_reserve_percent: 10,
        owner_payout_percent: 30, admin_compensation_percent: 15, retained_earnings_percent: 10,
        payout_basis: "net_profit", default_overhead_percent: 10, default_contingency_percent: 5,
        default_profit_margin: 20, default_labor_rate: 45,
        company_name: "", company_address: "", company_phone: "", company_email: "",
        company_logo_url: "", doc_margin_top: 1, doc_margin_bottom: 1, doc_margin_left: 1, doc_margin_right: 1, doc_footer_text: "",
        manager_name: "", manager_ein_or_ssn: "", manager_address: "", manager_email: "", manager_pay_percent: 10,
      });
    }
  }, [existing, form, isLoading]);

  const saveMutation = useMutation({
    mutationFn: (data) => existing
      ? base44.entities.AppSettings.update(existing.id, data)
      : base44.entities.AppSettings.create({ ...data, settings_key: "global" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); toast({ title: "Settings saved" }); },
  });

  if (!form) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setNum = (k, v) => setForm(f => ({ ...f, [k]: parseFloat(v) || 0 }));

  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("company_logo_url", file_url);
    setUploading(false);
    toast({ title: "Logo uploaded successfully" });
  };

  const totalPct = (form.tax_reserve_percent || 0) + (form.subcontractor_reserve_percent || 0) + (form.operating_reserve_percent || 0) + (form.owner_payout_percent || 0) + (form.admin_compensation_percent || 0) + (form.retained_earnings_percent || 0);

  return (
    <div>
      <PageHeader title="Settings" description="Configure calculation rules, defaults, and company info" />

      <div className="space-y-6 max-w-2xl">
        {/* Company Info */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">Company Information</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Company Name</Label><Input value={form.company_name} onChange={e => set("company_name", e.target.value)} /></div>
              <div><Label>Email</Label><Input value={form.company_email} onChange={e => set("company_email", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input value={form.company_phone} onChange={e => set("company_phone", e.target.value)} /></div>
              <div><Label>Address</Label><Input value={form.company_address} onChange={e => set("company_address", e.target.value)} /></div>
            </div>
          </div>
        </Card>

        {/* Reserve Allocation */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-2">Reserve & Payout Allocation</h3>
          <p className="text-xs text-muted-foreground mb-4">Define what percentage of profits to allocate to each bucket.</p>

          {totalPct !== 100 && (
            <GuidedPrompt message={`Total allocation is ${totalPct}%. Ideally should equal 100%.`} variant={totalPct > 100 ? "error" : "warning"} />
          )}

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div><Label>Tax Reserve %</Label><Input type="number" value={form.tax_reserve_percent} onChange={e => setNum("tax_reserve_percent", e.target.value)} /></div>
            <div><Label>Subcontractor Reserve %</Label><Input type="number" value={form.subcontractor_reserve_percent} onChange={e => setNum("subcontractor_reserve_percent", e.target.value)} /></div>
            <div><Label>Operating Reserve %</Label><Input type="number" value={form.operating_reserve_percent} onChange={e => setNum("operating_reserve_percent", e.target.value)} /></div>
            <div><Label>Owner Payout %</Label><Input type="number" value={form.owner_payout_percent} onChange={e => setNum("owner_payout_percent", e.target.value)} /></div>
            <div><Label>Admin Compensation %</Label><Input type="number" value={form.admin_compensation_percent} onChange={e => setNum("admin_compensation_percent", e.target.value)} /></div>
            <div><Label>Retained Earnings %</Label><Input type="number" value={form.retained_earnings_percent} onChange={e => setNum("retained_earnings_percent", e.target.value)} /></div>
          </div>

          <div className="mt-4">
            <Label>Payout Basis</Label>
            <Select value={form.payout_basis} onValueChange={v => set("payout_basis", v)}>
              <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gross_profit">Gross Profit</SelectItem>
                <SelectItem value="net_profit">Net Profit</SelectItem>
                <SelectItem value="cash_collected">Cash Collected</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Determines the base amount used for all percentage calculations.</p>
          </div>
        </Card>

        {/* Bid Defaults */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-2">Bid Builder Defaults</h3>
          <p className="text-xs text-muted-foreground mb-4">Default values used when creating new bids.</p>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Default Overhead %</Label><Input type="number" value={form.default_overhead_percent} onChange={e => setNum("default_overhead_percent", e.target.value)} /></div>
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
                {form.company_logo_url ? (
                  <div className="relative border rounded-lg p-2 bg-muted/30">
                    <img src={form.company_logo_url} alt="Company logo" className="h-16 max-w-[200px] object-contain" />
                    <button onClick={() => set("company_logo_url", "")} className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-1 text-muted-foreground w-[160px]">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-xs">No logo set</span>
                  </div>
                )}
                <div className="space-y-2">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-1.5">
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

        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="w-full sm:w-auto">
          <Save className="w-4 h-4 mr-1.5" />
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}