import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  DollarSign, Calendar, HardHat, Briefcase, AlertTriangle,
  ArrowRight, TrendingUp, Clock
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatCard from "@/components/shared/StatCard";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/formatters";

export default function Dashboard() {
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 100) });
  const { data: bills = [] } = useQuery({ queryKey: ["bills"], queryFn: () => base44.entities.Bill.list("-due_date", 100) });
  const { data: subPayments = [] } = useQuery({ queryKey: ["subPayments"], queryFn: () => base44.entities.SubcontractorPayment.list("-created_date", 50) });
  const { data: bankAccounts = [] } = useQuery({ queryKey: ["bankAccounts"], queryFn: () => base44.entities.BankAccount.list() });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });

  const s = settings[0] || {};
  const today = new Date().toISOString().split("T")[0];
  const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const totalCash = bankAccounts.reduce((sum, a) => sum + (a.current_balance || 0), 0);
  const billsDueThisWeek = bills.filter(b => b.status !== "paid" && b.due_date >= today && b.due_date <= weekFromNow);
  const overdueBills = bills.filter(b => b.status !== "paid" && b.due_date < today);
  const pendingSubPayouts = subPayments.filter(p => p.status === "pending");
  const activeJobs = jobs.filter(j => ["in_progress", "contracted"].includes(j.status));

  const taxReserve = activeJobs.reduce((sum, j) => {
    const revenue = (j.contract_amount || 0) + (j.change_orders_total || 0);
    const costs = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0);
    const profit = revenue - costs;
    return sum + profit * ((s.tax_reserve_percent || 25) / 100);
  }, 0);

  const alerts = [];
  activeJobs.forEach(j => {
    if (!j.material_costs) alerts.push({ msg: `"${j.title}" has no material costs entered.`, variant: "warning" });
    if (!j.projected_completion) alerts.push({ msg: `"${j.title}" is missing a projected completion date.`, variant: "warning" });
  });
  if (overdueBills.length > 0) alerts.push({ msg: `You have ${overdueBills.length} overdue bill(s).`, variant: "error" });
  if (pendingSubPayouts.length > 0) alerts.push({ msg: `${pendingSubPayouts.length} subcontractor payment(s) pending.`, variant: "info" });

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 4).map((a, i) => (
            <GuidedPrompt key={i} message={a.msg} variant={a.variant} />
          ))}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Cash on Hand" value={formatCurrency(totalCash)} icon={DollarSign} />
        <StatCard title="Bills Due This Week" value={billsDueThisWeek.length} icon={Calendar} subtitle={formatCurrency(billsDueThisWeek.reduce((s, b) => s + (b.amount || 0), 0))} />
        <StatCard title="Tax Reserve" value={formatCurrency(taxReserve)} icon={TrendingUp} />
        <StatCard title="Active Jobs" value={activeJobs.length} icon={Briefcase} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Jobs */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Active Jobs</h3>
            <Link to="/Jobs" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {activeJobs.length === 0 && <p className="text-sm text-muted-foreground">No active jobs.</p>}
            {activeJobs.slice(0, 5).map(j => (
              <div key={j.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{j.title}</p>
                  <p className="text-xs text-muted-foreground">{j.client_name || "No client"}</p>
                </div>
                <div className="text-right">
                  <Badge className={`text-xs ${getStatusColor(j.status)}`}>
                    {j.status?.replace(/_/g, " ")}
                  </Badge>
                  {j.projected_completion && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(j.projected_completion)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Bills Due */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Upcoming Bills</h3>
            <Link to="/BillsCalendar" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
              View Calendar <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {billsDueThisWeek.length === 0 && overdueBills.length === 0 && (
              <p className="text-sm text-muted-foreground">No bills due this week.</p>
            )}
            {[...overdueBills, ...billsDueThisWeek].slice(0, 6).map(b => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{b.vendor || b.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(b.amount)}</p>
                  <p className={`text-xs ${b.due_date < today ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                    {b.due_date < today ? "OVERDUE" : formatDate(b.due_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Sub Payouts */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Subcontractor Payouts</h3>
            <Link to="/Subcontractors" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {pendingSubPayouts.length === 0 && <p className="text-sm text-muted-foreground">No pending payouts.</p>}
            {pendingSubPayouts.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{p.subcontractor_name || "Subcontractor"}</p>
                  <p className="text-xs text-muted-foreground">{p.job_title || "—"}</p>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(p.amount)}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Payout Recommendations */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Payout & Reserve Summary</h3>
            <Link to="/PayoutEngine" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
              Details <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { label: "Tax Reserve", pct: s.tax_reserve_percent || 25 },
              { label: "Owner Payout", pct: s.owner_payout_percent || 30 },
              { label: "Admin Compensation", pct: s.admin_compensation_percent || 15 },
              { label: "Operating Reserve", pct: s.operating_reserve_percent || 10 },
              { label: "Retained Earnings", pct: s.retained_earnings_percent || 10 },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <p className="text-sm">{item.label}</p>
                <p className="text-sm font-medium">{item.pct}%</p>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-1">
              Based on {(s.payout_basis || "net_profit").replace(/_/g, " ")}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}