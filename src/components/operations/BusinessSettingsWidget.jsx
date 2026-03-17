import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Building2, Loader } from "lucide-react";

export default function BusinessSettingsWidget() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const { data: settings = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" })
  });

  const s = settings[0] || {};

  const [form, setForm] = useState({
    company_name: s.company_name || "",
    company_phone: s.company_phone || "",
    company_email: s.company_email || "",
    company_address: s.company_address || "",
    company_logo_url: s.company_logo_url || "",
  });

  const updateMutation = useMutation({
    mutationFn: (data) => 
      s.id 
        ? base44.entities.AppSettings.update(s.id, data)
        : base44.entities.AppSettings.create({ settings_key: "global", ...data }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); setOpen(false); }
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, company_logo_url: res.file_url }));
    } catch (err) {
      console.error(err);
    }
    setLogoUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Card className="p-5 border-2 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors">
        <DialogTrigger asChild>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Business Details</h3>
                <p className="text-xs text-muted-foreground">Company info & branding</p>
              </div>
              <Settings className="w-4 h-4 text-muted-foreground ml-auto" />
            </div>
            <div className="text-xs space-y-1">
              {form.company_name && <p className="font-medium">{form.company_name}</p>}
              {form.company_phone && <p className="text-muted-foreground">{form.company_phone}</p>}
              {!form.company_name && <p className="text-muted-foreground italic">Click to add company details</p>}
            </div>
          </div>
        </DialogTrigger>
      </Card>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Business Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Logo */}
          <div>
            <Label className="text-xs">Company Logo</Label>
            {form.company_logo_url ? (
              <div className="mt-2 flex items-start gap-3">
                <img
                  src={form.company_logo_url}
                  alt="Logo"
                  className="h-16 w-16 object-contain rounded border"
                />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={logoUploading}
                    className="hidden"
                  />
                  <Button variant="outline" size="sm" disabled={logoUploading} asChild>
                    <span>
                      {logoUploading ? <Loader className="w-3 h-3 animate-spin mr-1" /> : null}
                      Change Logo
                    </span>
                  </Button>
                </label>
              </div>
            ) : (
              <label className="cursor-pointer mt-2 block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={logoUploading}
                  className="hidden"
                />
                <Button variant="outline" className="w-full" disabled={logoUploading} asChild>
                  <span>
                    {logoUploading ? <Loader className="w-3 h-3 animate-spin mr-1" /> : null}
                    Upload Logo
                  </span>
                </Button>
              </label>
            )}
          </div>

          {/* Company Info */}
          <div>
            <Label htmlFor="company_name" className="text-xs">Company Name</Label>
            <Input
              id="company_name"
              value={form.company_name}
              onChange={(e) => setForm(f => ({ ...f, company_name: e.target.value }))}
              placeholder="e.g., Thornburg Construction LLC"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="company_phone" className="text-xs">Phone</Label>
              <Input
                id="company_phone"
                value={form.company_phone}
                onChange={(e) => setForm(f => ({ ...f, company_phone: e.target.value }))}
                placeholder="412-296-2616"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="company_email" className="text-xs">Email</Label>
              <Input
                id="company_email"
                value={form.company_email}
                onChange={(e) => setForm(f => ({ ...f, company_email: e.target.value }))}
                placeholder="info@company.com"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="company_address" className="text-xs">Address</Label>
            <Input
              id="company_address"
              value={form.company_address}
              onChange={(e) => setForm(f => ({ ...f, company_address: e.target.value }))}
              placeholder="123 Main St, City, PA 12345"
              className="mt-1"
            />
          </div>

          <Button
            onClick={() => updateMutation.mutate(form)}
            disabled={updateMutation.isPending}
            className="w-full"
          >
            {updateMutation.isPending ? "Saving..." : "Save Business Details"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}