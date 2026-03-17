import React from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function GoalsDashboardSummary({ goals }) {
  const active = goals.filter(g => g.status !== "completed");
  const completed = goals.filter(g => g.status === "completed" || (g.target_amount > 0 && g.current_amount >= g.target_amount));
  const business = goals.filter(g => g.goal_type === "business");
  const personal = goals.filter(g => g.goal_type === "personal");

  const totalTarget = goals.reduce((s, g) => s + (g.target_amount || 0), 0);
  const totalCurrent = goals.reduce((s, g) => s + (g.current_amount || 0), 0);
  const overallPct = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

  const bizPct = business.length > 0 ? Math.round(
    business.reduce((s, g) => s + Math.min(100, g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0), 0) / business.length
  ) : 0;

  const persPct = personal.length > 0 ? Math.round(
    personal.reduce((s, g) => s + Math.min(100, g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0), 0) / personal.length
  ) : 0;

  const stats = [
    { label: "Active Goals", value: active.length, icon: Target, color: "text-yellow-600" },
    { label: "Completed", value: completed.length, icon: CheckCircle, color: "text-green-600" },
    { label: "Total Saved", value: formatCurrency(totalCurrent), icon: TrendingUp, color: "text-blue-600" },
    { label: "Remaining", value: formatCurrency(Math.max(0, totalTarget - totalCurrent)), icon: Clock, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <Card key={s.label} className="p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-sm font-bold">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 space-y-3">
        <p className="text-sm font-semibold">Overall Goal Progress</p>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>All Goals Combined</span><span>{overallPct}%</span>
          </div>
          <Progress value={overallPct} className="h-2.5" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Business Goals</span><span>{bizPct}%</span>
            </div>
            <Progress value={bizPct} className="h-1.5" />
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Personal Goals</span><span>{persPct}%</span>
            </div>
            <Progress value={persPct} className="h-1.5" />
          </div>
        </div>
      </Card>
    </div>
  );
}