import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import { User, Mail, Shield, Save, LogOut, Camera, ClipboardList } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ClientPhotoGallery from "@/components/photos/ClientPhotoGallery";
import ClientDailyLogList from "@/components/dailylog/ClientDailyLogList";

export default function CustomerAccount() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ full_name: "", email: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ full_name: user.full_name || "", email: user.email || "" });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({ full_name: form.full_name });
    toast({ title: "Profile updated" });
    setSaving(false);
  };

  const handleLogout = () => {
    base44.auth.logout("/Landing");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My Account" description="Manage your profile and account settings" />

      <div className="max-w-lg space-y-5">
        {/* Profile */}
        <Card className="p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-base">{user.full_name || "No name set"}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-xs mt-1 capitalize">
                <Shield className="w-3 h-3 mr-1" />{user.role || "user"}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label>Full Name</Label>
              <Input
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Your full name"
              />
            </div>
            <div>
              <Label>Email Address</Label>
              <div className="flex items-center gap-2">
                <Input value={form.email} disabled className="text-muted-foreground" />
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here. Contact an admin.</p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="mt-4 gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Card>

        {/* Account Info */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-3">Account Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Account Role</span>
              <span className="font-medium capitalize">{user.role || "user"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Member Since</span>
              <span className="font-medium">{user.created_date ? new Date(user.created_date).toLocaleDateString() : "—"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-xs text-muted-foreground">{user.id?.slice(0, 12)}...</span>
            </div>
          </div>
        </Card>

        {/* Sign out */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-2">Session</h3>
          <p className="text-sm text-muted-foreground mb-4">Sign out of your account on this device.</p>
          <Button variant="destructive" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </Card>
      </div>
    </div>
  );
}