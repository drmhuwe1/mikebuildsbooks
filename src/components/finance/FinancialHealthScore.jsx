import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Building2, User, BarChart2 } from "lucide-react";

function scoreBar(score) {
  const color = score >= 75 ? "bg-green-500" : score >= 50 ? "bg-yellow-400" : "bg-red-500";
  return (
    <div className="w-full bg-muted rounded-full h-2 mt-1">
      <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
}

function label(score) {
  if (score >= 80) return { text: "Excellent", color: "text-green-600" };
  if (score >= 65) return { text: "Good", color: "text-green-500" };
  if (score >= 45) return { text: "Fair", color: "text-yellow-600" };
  return { text: "Needs Attention", color: "text-red-600" };
}

export default function FinancialHealthScore({ type, compact,
  jobs = [], bills = [], txns = [], personalBills = [],
  cashOnHand = 0, netProfit = 0, ownerIncome = 0, surplus = 0, savingsTotal = 0
}) {
  const score = useMemo(() => {
    if (type === "business") {
      let s = 50;
      if (netProfit > 0) s += 20;
      if (cashOnHand > 5000) s += 10;
      const overdue = bills.filter(b => b.status !== "paid" && b.due_date < new Date().toISOString().split("T")[0]);
      if (overdue.length === 0) s += 10; else s -= overdue.length * 5;
      const activeJobs = jobs.filter(j => j.status === "in_progress").length;
      if (activeJobs > 0) s += 10;
      return Math.min(100, Math.max(0, s));
    }
    if (type === "personal") {
      let s = 50;
      if (surplus > 0) s += 20;
      if (savingsTotal > 0) s += 10;
      const overdueP = personalBills.filter(b => b.status !== "paid" && b.due_date < new Date().toISOString().split("T")[0]);
      if (overdueP.length === 0) s += 15; else s -= overdueP.length * 8;
      if (ownerIncome > 0) s += 5;
      return Math.min(100, Math.max(0, s));
    }
    if (type === "combined") {
      let s = 50;
      if (netProfit > 0) s += 10;
      if (cashOnHand > 3000) s += 10;
      if (surplus > 0) s += 15;
      if (savingsTotal > 0) s += 5;
      const overdue = bills.filter(b => b.status !== "paid" && b.due_date < new Date().toISOString().split("T")[0]);
      const overdueP = personalBills.filter(b => b.status !== "paid" && b.due_date < new Date().toISOString().split("T")[0]);
      s -= (overdue.length + overdueP.length) * 5;
      return Math.min(100, Math.max(0, s));
    }
    return 50;
  }, [type, jobs, bills, personalBills, txns, cashOnHand, netProfit, ownerIncome, surplus, savingsTotal]);

  const lbl = label(score);
  const icons = { business: Building2, personal: User, combined: BarChart2 };
  const titles = { business: "Business Health", personal: "Personal Health", combined: "Combined Health" };
  const Icon = icons[type] || BarChart2;

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{titles[type]}</p>
        </div>
        <p className={`text-2xl font-bold ${lbl.color}`}>{score}</p>
        <p className={`text-xs font-medium ${lbl.color}`}>{lbl.text}</p>
        {scoreBar(score)}
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <p className="text-sm font-semibold">{titles[type]} Score</p>
      </div>
      <div className="flex items-end gap-3">
        <p className={`text-4xl font-bold ${lbl.color}`}>{score}</p>
        <p className={`text-sm font-medium pb-1 ${lbl.color}`}>{lbl.text}</p>
      </div>
      {scoreBar(score)}
      <p className="text-xs text-muted-foreground mt-2">Score out of 100 based on cash flow, bills, profitability, and trends.</p>
    </Card>
  );
}