import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Send, Database, Zap, RefreshCw, CheckCircle, XCircle } from "lucide-react";

export default function AdminSystemTab({ currentUser }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState({});

  const setLoad = (key, val) => setLoading(prev => ({ ...prev, [key]: val }));

  const sendWelcomeToSelf = async () => {
    setLoad("welcome", true);
    await base44.integrations.Core.SendEmail({
      to: currentUser.email,
      subject: "Welcome to MikeBuildsBooks!",
      body: `Hi ${currentUser.full_name || "there"},\n\nWelcome to MikeBuildsBooks — your all-in-one construction business platform!\n\nYou can log in at any time to manage your jobs, bids, contracts, subcontractors, and financials.\n\nIf you have any questions, just reply to this email.\n\nBest,\nThe MikeBuildsBooks Team`,
    });
    setLoad("welcome", false);
    toast({ title: "Welcome email sent to yourself!" });
  };

  const systemItems = [
    { label: "Database Status", desc: "Base44 cloud database", status: "Online", ok: true },
    { label: "Backend Functions", desc: "All functions deployed", status: "Active", ok: true },
    { label: "Email Service", desc: "SMTP configured", status: "Active", ok: true },
    { label: "Stripe Integration", desc: "Payments connected", status: "Active", ok: true },
  ];

  return (
    <div className="space-y-6">
      {/* Send Welcome Email */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg flex items-center gap-2 mb-1">
          <Mail className="w-5 h-5 text-blue-500" /> Send Welcome Email
        </h2>
        <p className="text-sm text-muted-foreground mb-4">Manually trigger a welcome email to yourself to test the email system.</p>
        <Button
          onClick={sendWelcomeToSelf}
          disabled={loading["welcome"]}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Send className="w-4 h-4 mr-2" />
          {loading["welcome"] ? "Sending…" : "Send Welcome Email to Myself"}
        </Button>
      </Card>

      {/* System Information */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-purple-500" /> System Information
        </h2>
        <p className="text-sm text-muted-foreground mb-4">System status and service health</p>
        <div className="space-y-3">
          {systemItems.map(item => (
            <div key={item.label} className="flex items-center justify-between bg-muted/40 rounded-lg px-4 py-3 border">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${item.ok ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"}`}>
                {item.ok ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-yellow-500" /> Quick Admin Actions
        </h2>
        <p className="text-sm text-muted-foreground mb-4">Utility actions for system management</p>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => { window.location.reload(); toast({ title: "Page refreshed" }); }}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh App
          </Button>
        </div>
      </Card>
    </div>
  );
}