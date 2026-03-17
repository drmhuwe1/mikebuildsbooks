import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

function ProjectionCard({ period, projectedCash, projectedRevenue, projectedExpenses, risk }) {
  const net = projectedRevenue - projectedExpenses;
  const endCash = projectedCash + net;
  const riskColor = risk === "low" ? "border-green-200 bg-green-50" : risk === "medium" ? "border-yellow-200 bg-yellow-50" : "border-red-200 bg-red-50";
  const riskText = risk === "low" ? "text-green-700" : risk === "medium" ? "text-yellow-700" : "text-red-700";
  return (
    <Card className={`p-4 border-2 ${riskColor}`}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{period}</p>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Expected Revenue</span><span className="font-medium text-green-600">{formatCurrency(projectedRevenue)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Expected Expenses</span><span className="font-medium text-red-500">{formatCurrency(projectedExpenses)}</span></div>
        <div className="flex justify-between border-t pt-1.5"><span className="font-semibold">Projected Net</span><span className={`font-bold ${net >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(net)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Est. End Cash</span><span className="font-semibold">{formatCurrency(endCash)}</span></div>
      </div>
      <p className={`text-xs font-semibold mt-2 ${riskText}`}>
        {risk === "low" ? "✓ Low Risk" : risk === "medium" ? "⚠ Monitor" : "⚠ High Risk"}
      </p>
    </Card>
  );
}

export default function BusinessProjections({ jobs = [], bills = [], cashOnHand = 0, netProfit = 0 }) {
  const projections = useMemo(() => {
    const activeRevenue = jobs.filter(j => j.status === "in_progress").reduce((s, j) => s + Math.max(0, (j.contract_amount || 0) - (j.deposits_received || 0)), 0);
    const avgMonthlyProfit = netProfit / Math.max(1, new Set(jobs.map(j => (j.start_date || "").slice(0, 7)).filter(Boolean)).size);
    const avgMonthlyBills = bills.filter(b => b.is_recurring).reduce((s, b) => s + (b.amount || 0), 0);

    const project = (months) => {
      const rev = avgMonthlyProfit > 0 ? avgMonthlyProfit * months + activeRevenue * (months / 6) : activeRevenue * (months / 12);
      const exp = avgMonthlyBills * months;
      const endCash = cashOnHand + rev - exp;
      const risk = endCash > 10000 ? "low" : endCash > 2000 ? "medium" : "high";
      return { projectedRevenue: rev, projectedExpenses: exp, projectedCash: cashOnHand, risk };
    };

    return [
      { period: "Next 30 Days", ...project(1) },
      { period: "Next 60 Days", ...project(2) },
      { period: "Next 90 Days", ...project(3) },
      { period: "6-Month Forecast", ...project(6) },
      { period: "12-Month Forecast", ...project(12) },
    ];
  }, [jobs, bills, cashOnHand, netProfit]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Projections are estimates based on current jobs, recurring bills, and historical averages. Actual results may vary.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projections.map(p => <ProjectionCard key={p.period} {...p} />)}
      </div>
    </div>
  );
}