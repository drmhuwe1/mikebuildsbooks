import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, TrendingUp } from "lucide-react";

export default function JobRiskIndicator({ job, allJobs }) {
  const analysis = useMemo(() => {
    if (!job || !allJobs) return null;

    const revenue = (job.contract_amount || 0) + (job.change_orders_total || 0);
    const costs = (job.material_costs || 0) + (job.labor_costs || 0) + 
                  (job.subcontractor_costs || 0) + (job.permit_costs || 0) + 
                  (job.equipment_costs || 0) + (job.overhead_costs || 0);
    const profit = revenue - costs;
    const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;

    let issues = [];
    let score = 0;

    // Missing costs
    const missingCosts = [
      !job.labor_costs && "labor",
      !job.material_costs && "materials",
      !job.overhead_costs && "overhead"
    ].filter(Boolean);

    if (missingCosts.length > 0) {
      issues.push(`Missing: ${missingCosts.join(", ")}`);
      score += missingCosts.length * 20;
    }

    // Low margin
    if (margin < 10) {
      issues.push(`Low margin: ${margin}% (target: 20%)`);
      score += 30;
    } else if (margin < 15) {
      issues.push(`Below-target margin: ${margin}%`);
      score += 15;
    }

    // Historical comparison
    const similarJobs = allJobs.filter(j => 
      j.status === 'completed' && j.id !== job.id &&
      Math.abs((j.contract_amount || 0) - revenue) / Math.max(1, revenue) < 0.5
    );

    if (similarJobs.length > 0) {
      const avgMargin = similarJobs.reduce((sum, j) => {
        const rev = (j.contract_amount || 0) + (j.change_orders_total || 0);
        const c = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0);
        return rev > 0 ? sum + ((rev - c) / rev * 100) : sum;
      }, 0) / similarJobs.length;

      if (margin < avgMargin - 5) {
        issues.push(`Below historical avg: ${avgMargin.toFixed(1)}%`);
        score += 10;
      }
    }

    const level = score > 50 ? "high" : score > 25 ? "moderate" : "low";
    const riskColors = {
      low: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", badge: "bg-green-100 text-green-800" },
      moderate: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-800" },
      high: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-800" }
    };

    const colors = riskColors[level];

    return { level, score, issues, colors, margin, revenue, costs, profit };
  }, [job, allJobs]);

  if (!analysis) return null;

  const riskIcons = {
    low: <TrendingUp className="w-4 h-4" />,
    moderate: <AlertCircle className="w-4 h-4" />,
    high: <AlertTriangle className="w-4 h-4" />
  };

  return (
    <Card className={`p-3 border-l-4 ${analysis.colors.bg} border-l-current ${analysis.colors.border}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={analysis.colors.text}>{riskIcons[analysis.level]}</span>
            <h4 className="font-medium text-sm">
              Profitability Risk: <Badge className={analysis.colors.badge}>{analysis.level.charAt(0).toUpperCase() + analysis.level.slice(1)}</Badge>
            </h4>
          </div>
          
          {analysis.issues.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs">
              {analysis.issues.map((issue, i) => (
                <li key={i} className={analysis.colors.text}>• {issue}</li>
              ))}
            </ul>
          )}

          {analysis.issues.length === 0 && (
            <p className="text-xs mt-1 text-green-700">Solid financial foundation for this job.</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">Margin</p>
          <p className={`text-lg font-bold ${analysis.margin >= 20 ? 'text-green-700' : analysis.margin >= 15 ? 'text-yellow-700' : 'text-red-700'}`}>
            {analysis.margin}%
          </p>
        </div>
      </div>
    </Card>
  );
}