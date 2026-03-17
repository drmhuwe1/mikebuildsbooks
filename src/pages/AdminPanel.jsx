import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import { Users, Briefcase, DollarSign, FileText, Shield } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function AdminPanel() {
  const { user } = useAuth();

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-created_date", 200),
  });
  const { data: bills = [] } = useQuery({
    queryKey: ["bills"],
    queryFn: () => base44.entities.Bill.list(),
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Shield className="w-12 h-12 text-muted-foreground" />
        <p className="text-lg font-semibold">Admin Access Required</p>
        <p className="text-sm text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  const totalRevenue = jobs.reduce((sum, j) => sum + (j.contract_amount || 0) + (j.change_orders_total || 0), 0);
  const activeJobs = jobs.filter(j => ["in_progress", "contracted"].includes(j.status));
  const completedJobs = jobs.filter(j => j.status === "completed");
  const unpaidBills = bills.filter(b => b.status !== "paid");

  const stats = [
    { label: "Total Users", value: users.length, icon: Users, color: "text-blue-500" },
    { label: "Total Jobs", value: jobs.length, icon: Briefcase, color: "text-yellow-500" },
    { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: DollarSign, color: "text-green-500" },
    { label: "Unpaid Bills", value: unpaidBills.length, icon: FileText, color: "text-red-500" },
  ];

  return (
    <div>
      <PageHeader
        title="Admin Panel"
        description="System-wide overview of all users, jobs, and platform activity"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <Card key={s.label} className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">Registered Users ({users.length})</h3>
          <div className="space-y-2">
            {users.length === 0 && <p className="text-sm text-muted-foreground">No users found.</p>}
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{u.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-xs capitalize">
                  {u.role || "user"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Job Summary */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">Job Status Summary</h3>
          <div className="space-y-3">
            {[
              { label: "Active Jobs", count: activeJobs.length, color: "bg-yellow-100 text-yellow-700" },
              { label: "Completed Jobs", count: completedJobs.length, color: "bg-green-100 text-green-700" },
              { label: "Bidding", count: jobs.filter(j => j.status === "bidding").length, color: "bg-blue-100 text-blue-700" },
              { label: "On Hold", count: jobs.filter(j => j.status === "on_hold").length, color: "bg-gray-100 text-gray-700" },
              { label: "Cancelled", count: jobs.filter(j => j.status === "cancelled").length, color: "bg-red-100 text-red-700" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${item.color}`}>{item.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}