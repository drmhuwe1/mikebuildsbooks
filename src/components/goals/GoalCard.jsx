import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Pencil, Trash2, Target, TrendingUp, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { format, differenceInMonths, addMonths } from "date-fns";

const STATUS_COLORS = {
  on_track: "bg-green-100 text-green-700",
  behind: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-700",
  paused: "bg-gray-100 text-gray-600",
  active: "bg-yellow-100 text-yellow-700",
};

const TYPE_COLORS = {
  business: "bg-purple-100 text-purple-700",
  personal: "bg-blue-100 text-blue-700",
  combined: "bg-orange-100 text-orange-700",
};

export default function GoalCard({ goal, onEdit, onDelete }) {
  const pct = goal.target_amount > 0
    ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
    : 0;

  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  const monthlyNeeded = goal.monthly_contribution || 0;

  // Projected completion
  let projectedLabel = null;
  if (monthlyNeeded > 0 && remaining > 0) {
    const monthsLeft = Math.ceil(remaining / monthlyNeeded);
    const projDate = addMonths(new Date(), monthsLeft);
    projectedLabel = format(projDate, "MMM yyyy");
  }

  // On track vs behind
  let statusLabel = goal.status;
  if (goal.status !== "completed" && goal.status !== "paused" && goal.target_date && monthlyNeeded > 0) {
    const monthsToTarget = differenceInMonths(new Date(goal.target_date), new Date());
    const projectedMonths = remaining > 0 ? Math.ceil(remaining / monthlyNeeded) : 0;
    statusLabel = projectedMonths <= monthsToTarget ? "on_track" : "behind";
  }
  if (pct >= 100) statusLabel = "completed";

  const prompt = pct >= 100
    ? "Goal reached! Congratulations! 🎉"
    : pct >= 80
    ? `You are ${pct}% of the way to this goal — keep going!`
    : statusLabel === "on_track"
    ? "You are on track to reach this goal."
    : statusLabel === "behind"
    ? "You are slightly behind — consider increasing contributions."
    : null;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold truncate">{goal.title}</p>
            <Badge className={`text-xs ${TYPE_COLORS[goal.goal_type] || ""}`}>{goal.goal_type}</Badge>
            <Badge className={`text-xs ${STATUS_COLORS[statusLabel] || ""}`}>{statusLabel?.replace(/_/g, " ")}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{goal.category?.replace(/_/g, " ")}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => onEdit(goal)}><Pencil className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(goal.id)} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{formatCurrency(goal.current_amount)} saved</span>
          <span>{pct}% of {formatCurrency(goal.target_amount)}</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground flex items-center gap-1"><Target className="w-3 h-3" /> Remaining</span>
          <span className="font-semibold">{formatCurrency(remaining)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Monthly</span>
          <span className="font-semibold">{formatCurrency(monthlyNeeded)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Projected</span>
          <span className="font-semibold">{projectedLabel || (goal.target_date ? format(new Date(goal.target_date), "MMM yyyy") : "—")}</span>
        </div>
      </div>

      {prompt && (
        <p className="text-xs text-muted-foreground italic bg-muted/50 rounded px-2 py-1">{prompt}</p>
      )}
    </Card>
  );
}