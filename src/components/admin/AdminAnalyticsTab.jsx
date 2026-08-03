import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { BarChart3, Users, Briefcase, FileText, FileCheck, HardHat, FolderOpen, TrendingUp, Activity } from "lucide-react";

export default function AdminAnalyticsTab() {
  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["admin-jobs-analytics"],
    queryFn: () => base44.entities.Job.list("-created_date", 500),
  });

  const { data: bids = [] } = useQuery({
    queryKey: ["admin-bids-analytics"],
    queryFn: () => base44.entities.Bid.list("-created_date", 500),
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["admin-contracts-analytics"],
    queryFn: () => base44.entities.Contract.list("-created_date", 500),
  });

  const { data: subcontractors = [] } = useQuery({
    queryKey: ["admin-subs-analytics"],
    queryFn: () => base44.entities.Subcontractor.list(),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["admin-docs-analytics"],
    queryFn: () => base44.entities.Document.list("-created_date", 500),
  });

  const { data: receipts = [] } = useQuery({
    queryKey: ["admin-receipts-analytics"],
    queryFn: () => base44.entities.JobReceipt.list("-created_date", 500),
  });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const newUsers = users.filter(u => new Date(u.created_date) >= thirtyDaysAgo).length;
  const recentUsers = users.filter(u => new Date(u.updated_date) >= sevenDaysAgo).length;
  const adminUsers = users.filter(u => u.role === "admin").length;
  const regularUsers = users.filter(u => u.role !== "admin").length;

  const featureUsage = [
    { label: "Jobs", count: jobs.length, icon: Briefcase, color: "text-yellow-600" },
    { label: "Bids", count: bids.length, icon: FileText, color: "text-blue-600" },
    { label: "Contracts", count: contracts.length, icon: FileCheck, color: "text-green-600" },
    { label: "Subcontractors", count: subcontractors.length, icon: HardHat, color: "text-purple-600" },
    { label: "Documents", count: documents.length, icon: FolderOpen, color: "text-orange-600" },
    { label: "Receipts", count: receipts.length, icon: TrendingUp, color: "text-red-600" },
  ];

  const sortedFeatures = [...featureUsage].sort((a, b) => b.count - a.count);
  const mostUsed = sortedFeatures.slice(0, 3);
  const leastUsed = sortedFeatures.slice(-3).reverse();

  const userStats = [
    { label: "Total Users", value: users.length, color: "text-blue-600" },
    { label: "New (30 days)", value: newUsers, color: "text-green-600" },
    { label: "Active (7 days)", value: recentUsers, color: "text-purple-600" },
    { label: "Admins", value: adminUsers, color: "text-orange-600" },
  ];

  const jobStatuses = ["bidding", "contracted", "in_progress", "on_hold", "completed", "cancelled"];
  const jobBreakdown = jobStatuses.map(s => ({ label: s.replace(/_/g, " "), count: jobs.filter(j => j.status === s).length }));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="font-semibold text-lg flex items-center gap-2 mb-5">
          <Users className="w-5 h-5 text-blue-500" /> User Analytics
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {userStats.map(s => (
            <div key={s.label} className="bg-muted/50 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold text-lg flex items-center gap-2 mb-5">
          <BarChart3 className="w-5 h-5 text-yellow-500" /> Feature Usage
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {featureUsage.map(f => (
            <div key={f.label} className="flex items-center gap-3 bg-muted/50 rounded-xl p-4">
              <f.icon className={`w-8 h-8 ${f.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{f.label}</p>
                <p className="text-xl font-bold">{f.count}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-500" /> Most Used Features
          </h3>
          <div className="space-y-2">
            {mostUsed.map((f, i) => (
              <div key={f.label} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                  {f.label}
                </span>
                <span className="font-semibold text-sm">{f.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" /> Least Used Features
          </h3>
          <div className="space-y-2">
            {leastUsed.map((f, i) => (
              <div key={f.label} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                  {f.label}
                </span>
                <span className="font-semibold text-sm">{f.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-yellow-500" /> Job Status Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {jobBreakdown.map(j => (
            <div key={j.label} className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground capitalize mb-1">{j.label}</p>
              <p className="text-lg font-bold">{j.count}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}