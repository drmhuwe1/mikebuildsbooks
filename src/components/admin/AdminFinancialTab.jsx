import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, CreditCard, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function AdminFinancialTab() {
  const [stripeData, setStripeData] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-created_date", 200),
  });

  const fetchStripeData = async () => {
    setLoading(true);
    const res = await base44.functions.invoke('adminStripeStats', {});
    setLoading(false);
    if (res.data) setStripeData(res.data);
  };

  const totalRevenue = jobs.reduce((sum, j) => sum + (j.contract_amount || 0) + (j.change_orders_total || 0), 0);
  const activeJobs = jobs.filter(j => ["in_progress", "contracted"].includes(j.status)).length;
  const completedJobs = jobs.filter(j => j.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* App Stats */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-yellow-500" /> App Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: users.length, color: "text-blue-600" },
            { label: "Total Jobs", value: jobs.length, color: "text-yellow-600" },
            { label: "Active Jobs", value: activeJobs, color: "text-green-600" },
            { label: "Completed Jobs", value: completedJobs, color: "text-purple-600" },
          ].map(s => (
            <div key={s.label} className="bg-muted/50 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Stripe Revenue */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-500" /> Stripe Revenue
          </h2>
          <Button variant="outline" size="sm" onClick={fetchStripeData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            {stripeData ? "Refresh" : "Load Stripe Data"}
          </Button>
        </div>

        {!stripeData ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Click "Load Stripe Data" to fetch live subscription and revenue stats.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Monthly Recurring (MRR)", value: formatCurrency(stripeData.mrr || 0), color: "text-green-600", border: "border-green-200 bg-green-50" },
                { label: "Revenue (30 Days)", value: formatCurrency(stripeData.revenue30d || 0), color: "text-blue-600", border: "border-blue-200 bg-blue-50" },
                { label: "All-Time Revenue", value: formatCurrency(stripeData.allTimeRevenue || 0), color: "text-purple-600", border: "border-purple-200 bg-purple-50" },
                { label: "Stripe Balance", value: formatCurrency(stripeData.balance || 0), color: stripeData.balance < 0 ? "text-red-600" : "text-green-600", border: "border-gray-200 bg-gray-50" },
              ].map(s => (
                <div key={s.label} className={`rounded-xl p-4 border ${s.border}`}>
                  <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="border rounded-xl p-4">
                <h3 className="font-semibold mb-3">Active Subscriptions</h3>
                {[
                  { label: "Active Subscriptions", value: stripeData.activeSubscriptions || 0 },
                  { label: "Past Due", value: stripeData.pastDue || 0 },
                  { label: "Total Users", value: users.length },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center py-2 border-b last:border-0 text-sm">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-semibold">{r.value}</span>
                  </div>
                ))}
              </div>

              <div className="border rounded-xl p-4">
                <h3 className="font-semibold mb-3">Recent Transactions</h3>
                {!stripeData.recentTransactions?.length ? (
                  <p className="text-sm text-muted-foreground">No recent transactions</p>
                ) : (
                  stripeData.recentTransactions.slice(0, 5).map((t, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b last:border-0 text-sm">
                      <span className="text-muted-foreground">{t.description || t.email}</span>
                      <span className="font-semibold text-green-600">{formatCurrency(t.amount / 100)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}