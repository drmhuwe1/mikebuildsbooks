import React from "react";
import { Card } from "@/components/ui/card";
import { Lightbulb, TrendingUp, TrendingDown, DollarSign, Shield } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function StrategyInsightsPanel({ goals, jobs, bills, personalBills, transactions }) {
  const insights = [];

  // Business cash analysis
  const totalRevenue = jobs.reduce((s, j) => s + (j.contract_amount || 0) + (j.change_orders_total || 0), 0);
  const totalCosts = jobs.reduce((s, j) => s + (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0), 0);
  const netProfit = totalRevenue - totalCosts;

  const today = new Date().toISOString().split("T")[0];
  const pendingBills = bills.filter(b => b.status !== "paid");
  const overdueBills = bills.filter(b => b.status !== "paid" && b.due_date < today);
  const monthlyBizExpenses = pendingBills.reduce((s, b) => s + (b.amount || 0), 0);

  const pendingPersonal = personalBills.filter(b => b.status !== "paid");
  const monthlyPersonalExpenses = pendingPersonal.reduce((s, b) => s + (b.amount || 0), 0);

  // Behind goals
  const behindGoals = goals.filter(g => {
    if (!g.target_date || !g.monthly_contribution || g.status === "completed") return false;
    const remaining = Math.max(0, g.target_amount - g.current_amount);
    if (remaining === 0) return false;
    const { differenceInMonths } = require("date-fns");
    const monthsLeft = Math.max(1, differenceInMonths(new Date(g.target_date), new Date()));
    const projectedMonths = Math.ceil(remaining / g.monthly_contribution);
    return projectedMonths > monthsLeft;
  });

  if (netProfit > 0 && netProfit > monthlyBizExpenses * 2) {
    insights.push({ icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", text: `Your business is generating strong profit (${formatCurrency(netProfit)}). Consider increasing your savings rate toward your goals.` });
  }

  if (overdueBills.length > 0) {
    insights.push({ icon: TrendingDown, color: "text-red-600", bg: "bg-red-50", text: `You have ${overdueBills.length} overdue business bill(s). Clearing these will improve your financial health score.` });
  }

  if (behindGoals.length > 0) {
    insights.push({ icon: Shield, color: "text-yellow-600", bg: "bg-yellow-50", text: `${behindGoals.length} goal(s) are behind schedule. Increasing monthly contributions by even 10% could get you back on track.` });
  }

  const taxGoal = goals.find(g => g.category === "save_for_taxes");
  if (!taxGoal && netProfit > 0) {
    insights.push({ icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50", text: `Consider creating a "Save for Taxes" goal. At your current profit level, you may owe ${formatCurrency(netProfit * 0.25)} in taxes.` });
  }

  if (monthlyPersonalExpenses > 0 && monthlyBizExpenses > 0) {
    const ratio = monthlyPersonalExpenses / monthlyBizExpenses;
    if (ratio > 0.8) {
      insights.push({ icon: TrendingDown, color: "text-orange-600", bg: "bg-orange-50", text: "Your personal expenses are approaching your business expenses. Review personal spending for opportunities to increase savings." });
    }
  }

  const emergencyGoal = goals.find(g => g.category === "business_emergency_fund" || g.category === "personal_emergency_fund");
  if (!emergencyGoal) {
    insights.push({ icon: Shield, color: "text-blue-600", bg: "bg-blue-50", text: "No emergency fund goal detected. Financial experts recommend 3-6 months of expenses in an emergency fund." });
  }

  if (insights.length === 0) {
    insights.push({ icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", text: "Your finances look healthy! Keep up the consistent contributions toward your goals." });
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold">Strategy Insights</p>
      </div>
      <div className="space-y-2">
        {insights.map((ins, i) => (
          <div key={i} className={`flex items-start gap-2.5 p-3 rounded-lg ${ins.bg}`}>
            <ins.icon className={`w-4 h-4 ${ins.color} mt-0.5 shrink-0`} />
            <p className="text-xs text-gray-700">{ins.text}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}