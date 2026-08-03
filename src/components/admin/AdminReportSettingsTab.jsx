import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { Mail, Save, Bell } from "lucide-react";

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly (Recommended)" },
  { value: "monthly", label: "Monthly" },
  { value: "critical_only", label: "Critical Alerts Only" },
  { value: "custom", label: "Custom Schedule" },
];

const ALERT_TYPES = ["critical", "warning", "info", "regression", "drift"];

export default function AdminReportSettingsTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const existing = await base44.entities.ReportSetting.list();
        if (existing.length > 0) {
          setSettings(existing[0]);
        } else {
          setSettings({
            primary_report_email: user?.email || "",
            critical_alert_email: user?.email || "",
            backup_email: "",
            report_frequency: "weekly",
            alert_types: ["critical", "warning"],
            report_delivery_enabled: true,
          });
        }
      } catch (e) {
        console.error("Failed to load report settings:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.email]);

  const handleSave = async () => {
    if (!settings.primary_report_email) {
      toast({ title: "Primary report email is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (settings.id) {
        await base44.entities.ReportSetting.update(settings.id, settings);
      } else {
        const created = await base44.entities.ReportSetting.create(settings);
        setSettings(created);
      }
      toast({ title: "Report settings saved" });
    } catch (e) {
      toast({ title: "Failed to save settings", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleAlertType = (type) => {
    const current = settings.alert_types || [];
    const updated = current.includes(type) ? current.filter(t => t !== type) : [...current, type];
    setSettings({ ...settings, alert_types: updated });
  };

  if (loading || !settings) {
    return <Card className="p-6"><p className="text-sm text-muted-foreground text-center py-8">Loading…</p></Card>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="font-semibold text-lg flex items-center gap-2 mb-1">
          <Mail className="w-5 h-5 text-blue-500" /> Report Settings
        </h2>
        <p className="text-sm text-muted-foreground mb-5">Configure where stability scan reports and critical alerts are sent.</p>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Primary Report Email *</Label>
            <p className="text-xs text-muted-foreground mb-1.5">Receives scheduled health scan reports</p>
            <Input
              type="email"
              value={settings.primary_report_email}
              onChange={e => setSettings({ ...settings, primary_report_email: e.target.value })}
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Critical Alert Email</Label>
            <p className="text-xs text-muted-foreground mb-1.5">Receives immediate alerts for critical issues</p>
            <Input
              type="email"
              value={settings.critical_alert_email}
              onChange={e => setSettings({ ...settings, critical_alert_email: e.target.value })}
              placeholder="alerts@example.com"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Backup Email</Label>
            <p className="text-xs text-muted-foreground mb-1.5">Optional backup recipient</p>
            <Input
              type="email"
              value={settings.backup_email}
              onChange={e => setSettings({ ...settings, backup_email: e.target.value })}
              placeholder="backup@example.com"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Report Frequency</Label>
            <p className="text-xs text-muted-foreground mb-1.5">How often scan reports are emailed</p>
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={settings.report_frequency}
              onChange={e => setSettings({ ...settings, report_frequency: e.target.value })}
            >
              {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          <div>
            <Label className="text-sm font-medium">Alert Types</Label>
            <p className="text-xs text-muted-foreground mb-2">Which types of alerts to receive</p>
            <div className="flex flex-wrap gap-2">
              {ALERT_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleAlertType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                    (settings.alert_types || []).includes(type)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-input hover:bg-muted"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="delivery-enabled"
              checked={settings.report_delivery_enabled}
              onChange={e => setSettings({ ...settings, report_delivery_enabled: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <Label htmlFor="delivery-enabled" className="text-sm cursor-pointer">Enable report delivery via email</Label>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="mt-5">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving…" : "Save Settings"}
        </Button>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-2">
          <Bell className="w-4 h-4 text-yellow-500" /> Alert Configuration
        </h3>
        <p className="text-sm text-muted-foreground">
          Critical issues (broken routes, runtime errors, failed health checks) trigger immediate alert emails.
          Scheduled scan reports are sent based on the frequency selected above.
          Automated Crawl and Regression findings are included in reports when they detect critical issues.
        </p>
      </Card>
    </div>
  );
}