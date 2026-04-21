import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield } from "lucide-react";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminFinancialTab from "@/components/admin/AdminFinancialTab";
import AdminSystemTab from "@/components/admin/AdminSystemTab";
import PlatformStability from "@/components/admin/PlatformStability";
import CalcHealthCheck from "@/components/admin/CalcHealthCheck";

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
        <p className="text-sm text-muted-foreground">Manage users, financials, and system settings</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-0">
          {["users", "financial", "system", "stability"].map(tab => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent capitalize px-6 py-3 text-sm font-medium"
            >
              {tab === "users" ? "All Users" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <AdminUsersTab currentUser={user} />
        </TabsContent>
        <TabsContent value="financial" className="mt-6">
          <AdminFinancialTab />
        </TabsContent>
        <TabsContent value="system" className="mt-6">
          <AdminSystemTab currentUser={user} />
        </TabsContent>
        <TabsContent value="stability" className="mt-6">
          <div className="space-y-10">
            <PlatformStability />
            <div className="border-t pt-8">
              <CalcHealthCheck />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}