import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  DollarSign, Calendar, HardHat, Briefcase, AlertTriangle,
  ArrowRight, TrendingUp, Clock, Sparkles, Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatCard from "@/components/shared/StatCard";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
// import FinancialAlertsWidget from "@/components/finance/FinancialAlertsWidget";
import DragDropCards from "@/components/dashboard/DragDropCards";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/formatters";

export default function Dashboard() {
  const [wizardOpen, setWizardOpen] = useState(false); // job creation wizard state
  const qc = useQueryClient();
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 100) });
  const { data: contracts = [] } = useQuery({ queryKey: ["contracts"], queryFn: () => base44.entities.Contract.list("-created_date", 200) });
  const { data: bills = [] } = useQuery({ queryKey: ["bills"], queryFn: () => base44.entities.Bill.list("-due_date", 100) });
  const { data: subPayments = [] } = useQuery({ queryKey: ["subPayments"], queryFn: () => base44.entities.SubcontractorPayment.list("-created_date", 50) });
  const { data: bankAccounts = [] } = useQuery({ queryKey: ["bankAccounts"], queryFn: () => base44.entities.BankAccount.list() });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });

  const s = settings[0] || {};
  const today = new Date().toISOString().split("T")[0]; // current date
  const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const totalCash = (bankAccounts || []).reduce((sum, a) => sum + (a.current_balance || 0), 0);
  const billsDueThisWeek = bills.filter(b => b.status !== "paid" && b.due_date >= today && b.due_date <= weekFromNow);
  const overdueBills = bills.filter(b => b.status !== "paid" && b.due_date < today);
  const pendingSubPayouts = subPayments.filter(p => p.status === "pending");
  const activeJobs = jobs.filter(j => ["in_progress", "contracted", "bidding"].includes(j.status));

  // Tax reserve based on collected amounts — jobs are single source of truth
  const totalCollected = jobs.reduce((sum, j) => sum + (j.deposits_received || 0), 0);
  const taxReserve = totalCollected * ((s.tax_reserve_percent || 25) / 100);

  const alerts = [];
  activeJobs.forEach(j => {
    if (!j.material_costs) alerts.push({ msg: `"${j.title}" has no material costs entered.`, variant: "warning" });
    if (!j.projected_completion) alerts.push({ msg: `"${j.title}" is missing a projected completion date.`, variant: "warning" });
  });
  if (overdueBills.length > 0) alerts.push({ msg: `You have ${overdueBills.length} overdue bill(s).`, variant: "error" });
  if (pendingSubPayouts.length > 0) alerts.push({ msg: `${pendingSubPayouts.length} subcontractor payment(s) pending.`, variant: "info" });

  const urgentAlerts = alerts.filter(a => a.variant === "error");
  const totalActionItems = overdueBills.length + pendingSubPayouts.length + activeJobs.filter(j => !j.material_costs || !j.projected_completion).length;

  return (
    <div className="space-y-6">
      {/* Wizard temporarily disabled */}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {/* <Button onClick={() => setWizardOpen(true)} className="gap-2">
          <Wand2 className="w-4 h-4" /> Create New Job (Guided)
        </Button> */}
        <Link to="/Jobs">
          <Button variant="outline" className="gap-2">
            <Briefcase className="w-4 h-4" /> All Jobs
          </Button>
        </Link>
      </div>

      {/* Daily Assistant Banner */}
      <Link
        to="/DailyAssistant"
        className="block px-5 py-4 rounded-xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">Daily Business Assistant</p>
              <p className="text-xs text-muted-foreground">
                {totalActionItems > 0
                  ? `${totalActionItems} item(s) need your attention today`
                  : "No urgent tasks — everything looks good"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {urgentAlerts.length > 0 && (
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700">{urgentAlerts.length} Urgent</span>
            )}
            <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>

      {/* Financial Alerts Widget disabled temporarily */}
      {/* <FinancialAlertsWidget /> */}

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

      <DragDropCards cards={{
        "active-jobs": {
          id: "active-jobs",
          component: (
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
          )
        },
        "bills-due": {
          id: "bills-due",
          component: (
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
          )
        },
        "sub-payouts": {
          id: "sub-payouts",
          component: (
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
          )
        },
        "payout-summary": {
          id: "payout-summary",
          component: (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Payout & Reserve Summary</h3>
                <Link to="/PayoutEngine" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                  Details <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Tax Reserve", amount: formatCurrency(taxReserve) },
                  { label: "Operating Reserve", pct: s.operating_reserve_percent || 5 },
                  { label: "Manager Compensation", pct: s.manager_pay_percent || 10 },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <p className="text-sm">{item.label}</p>
                    <p className="text-sm font-medium">{item.amount || `${item.pct}%`}</p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-1">
                  Owner payout is remaining profit after all deductions
                </p>
              </div>
            </Card>
          )
        }
      }} />
    </div>
  );
}