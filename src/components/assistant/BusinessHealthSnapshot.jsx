import React from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle, Briefcase } from "lucide-react";

function HealthRow({ label, value, sub, status }) {
  const color = status === "good" ? "text-green-600" : status === "bad" ? "text-red-600" : status === "warn" ? "text-orange-600" : "text-foreground";
  const Icon = status === "good" ? CheckCircle : status === "bad" ? TrendingDown : status === "warn" ? AlertTriangle : DollarSign;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${color}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export default function BusinessHealthSnapshot({ metrics, contracts = [] }) {
   const m = metrics || {};
   const profitMargin = m.totalRevenue > 0 ? ((m.grossProfit / m.totalRevenue) * 100).toFixed(1) : 0;

   // Calculate outstanding from contracts only - unpaid contract balances
   const outstanding = (contracts || []).reduce((sum, c) => {
     const unpaid = Math.max(0, (c.contract_amount || 0) - (c.client_paid_amount || 0));
     return sum + unpaid;
   }, 0);

   return (
     <Card className="p-5">
       <div className="flex items-center gap-2 mb-4">
         <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
           <TrendingUp className="w-4 h-4 text-primary" />
         </div>
         <div>
           <h3 className="text-sm font-semibold">Business Health Snapshot</h3>
           <p className="text-xs text-muted-foreground">Live view of your financial position</p>
         </div>
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
         <div>
           <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Cash & Revenue</p>
           <HealthRow
             label="Cash on Hand"
             value={formatCurrency(m.totalCash)}
             status={m.totalCash < 0 ? "bad" : m.totalCash > 10000 ? "good" : m.totalCash > 0 ? "warn" : "bad"}
           />
           <HealthRow
             label="Active Job Revenue"
             value={formatCurrency(m.totalRevenue)}
             sub={`${m.activeJobsCount} active jobs`}
             status="neutral"
           />
           <HealthRow
             label="Deposits Collected"
             value={formatCurrency(m.totalDeposits)}
             status="neutral"
           />
           <HealthRow
             label="Outstanding Receivables"
             value={formatCurrency(outstanding)}
             status={outstanding > 0 ? "warn" : "good"}
             sub="Unpaid contract balances"
           />
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Obligations & Risk</p>
          <HealthRow
            label="Overdue Bills"
            value={m.overdueBillsCount > 0 ? formatCurrency(m.overdueBillsAmount) : "None"}
            sub={m.overdueBillsCount > 0 ? `${m.overdueBillsCount} bill(s) overdue` : null}
            status={m.overdueBillsCount > 0 ? "bad" : "good"}
          />
          <HealthRow
            label="Bills Due This Week"
            value={formatCurrency(m.billsThisWeekAmount)}
            sub={`${m.billsThisWeekCount} bill(s)`}
            status={m.billsThisWeekCount > 0 ? "warn" : "good"}
          />
          <HealthRow
            label="Pending Sub Payments"
            value={formatCurrency(m.pendingSubAmount)}
            sub={`${m.pendingSubCount} payment(s)`}
            status={m.pendingSubCount > 0 ? "warn" : "good"}
          />
          <HealthRow
            label="Jobs Over Budget"
            value={m.jobsOverBudgetCount > 0 ? `${m.jobsOverBudgetCount} job(s)` : "None"}
            status={m.jobsOverBudgetCount > 0 ? "bad" : "good"}
          />
        </div>
      </div>

      {/* Profit summary */}
      <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">Gross Profit</p>
          <p className={`text-base font-bold ${(m.grossProfit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(m.grossProfit || 0)}</p>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">Profit Margin</p>
          <p className={`text-base font-bold ${(m.profitMargin || 0) >= 15 ? "text-green-600" : (m.profitMargin || 0) >= 5 ? "text-orange-600" : "text-red-600"}`}>{(m.profitMargin || 0).toFixed(1)}%</p>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">Est. Tax Reserve</p>
          <p className="text-base font-bold text-foreground">{formatCurrency(m.taxReserveEstimate || 0)}</p>
        </div>
      </div>
    </Card>
  );
}