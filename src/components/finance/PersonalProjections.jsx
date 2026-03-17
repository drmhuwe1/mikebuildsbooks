import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";

function ProjectionCard({ period, projectedIncome, projectedExpenses, startSurplus }) {
  const net = projectedIncome - projectedExpenses;
  const endPos = startSurplus + net;
  const risk = endPos > 2000 ? "low" : endPos > 0 ? "medium" : "high";
  const riskColor = risk === "low" ? "border-green-200 bg-green-50" : risk === "medium" ? "border-yellow-200 bg-yellow-50" : "border-red-200 bg-red-50";
  const riskText = risk === "low" ? "text-green-700" : risk === "medium" ? "text-yellow-700" : "text-red-700";
  return (
    <Card className={`p-4 border-2 ${riskColor}`}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{period}</p>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Expected Income</span><span className="font-medium text-green-600">{formatCurrency(projectedIncome)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Expected Expenses</span><span className="font-medium text-red-500">{formatCurrency(projectedExpenses)}</span></div>
        <div className="flex justify-between border-t pt-1.5"><span className="font-semibold">Net Position</span><span className={`font-bold ${net >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(net)}</span></div>
      </div>
      <p className={`text-xs font-semibold mt-2 ${riskText}`}>
        {risk === "low" ? "✓ Comfortable" : risk === "medium" ? "⚠ Watch Spending" : "⚠ Shortfall Risk"}
      </p>
    </Card>
  );
}

export default function PersonalProjections({ personalBills = [], ownerIncome = 0, surplus = 0 }) {
  const projections = useMemo(() => {
    const monthlyBills = personalBills.filter(b => b.is_recurring && b.status !== "cancelled").reduce((s, b) => s + (b.amount || 0), 0);
    const monthlyIncome = ownerIncome > 0 ? ownerIncome / 12 : 0;
    const project = (months) => ({
      projectedIncome: monthlyIncome * months,
      projectedExpenses: monthlyBills * months,
      startSurplus: surplus,
    });
    return [
      { period: "Next 30 Days", ...project(1) },
      { period: "Next 60 Days", ...project(2) },
      { period: "Next 90 Days", ...project(3) },
      { period: "6-Month Forecast", ...project(6) },
      { period: "12-Month Forecast", ...project(12) },
    ];
  }, [personalBills, ownerIncome, surplus]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Personal projections are based on recurring bills and current owner income. Adjust as needed.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projections.map(p => <ProjectionCard key={p.period} {...p} />)}
      </div>
    </div>
  );
}