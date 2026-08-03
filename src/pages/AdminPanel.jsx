import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield } from "lucide-react";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminFinancialTab from "@/components/admin/AdminFinancialTab";
import AdminSystemTab from "@/components/admin/AdminSystemTab";
import DataBackupTab from "@/components/admin/DataBackupTab";
import StabilityCenter from "@/components/admin/stability/StabilityCenter";
import AdminWhitelistTab from "@/components/admin/AdminWhitelistTab";
import AdminAnalyticsTab from "@/components/admin/AdminAnalyticsTab";
import AdminReportSettingsTab from "@/components/admin/AdminReportSettingsTab";
import AdminBugReportsTab from "@/components/admin/AdminBugReportsTab";

export default function AdminPanel() {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Shield className="w-12 h-12 text-muted-foreground" />
        <p className="text-lg font-semibold">Admin Access Required</p>
        <p className="text-sm text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Manage users, whitelist, analytics, financials, stability, and system settings</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-0 flex-wrap">
          {[
            { value: "users", label: "All Users" },
            { value: "whitelist", label: "Whitelist" },
            { value: "analytics", label: "Analytics" },
            { value: "financial", label: "Financial" },
            { value: "stability", label: "Stability" },
            { value: "bug-reports", label: "Bug Reports" },
            { value: "report-settings", label: "Report Settings" },
            { value: "system", label: "System" },
            { value: "backup", label: "Backup" },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <AdminUsersTab currentUser={user} />
        </TabsContent>
        <TabsContent value="whitelist" className="mt-6">
          <AdminWhitelistTab />
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
          <AdminAnalyticsTab />
        </TabsContent>
        <TabsContent value="financial" className="mt-6">
          <AdminFinancialTab />
        </TabsContent>
        <TabsContent value="stability" className="mt-6">
          <StabilityCenter />
        </TabsContent>
        <TabsContent value="bug-reports" className="mt-6">
          <AdminBugReportsTab />
        </TabsContent>
        <TabsContent value="report-settings" className="mt-6">
          <AdminReportSettingsTab />
        </TabsContent>
        <TabsContent value="system" className="mt-6">
          <AdminSystemTab currentUser={user} />
        </TabsContent>
        <TabsContent value="backup" className="mt-6">
          <DataBackupTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}