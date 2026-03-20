import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { HardHat } from "lucide-react";

export default function SubWeeklyLaborWidget() {
  const { data: entries = [] } = useQuery({
    queryKey: ["workEntries"],
    queryFn: () => base44.entities.SubcontractorWorkEntry.filter({ payment_status: "Unpaid" }),
  });

  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const mondayStr = monday.toISOString().split("T")[0];
  const sundayStr = sunday.toISOString().split("T")[0];

  const weekEntries = useMemo(() =>
    entries.filter(e => e.work_date >= mondayStr && e.work_date <= sundayStr),
    [entries, mondayStr, sundayStr]
  );

  const totalHours = weekEntries.reduce((s, e) => s + (e.hours_worked || 0), 0);
  const totalCost = weekEntries.reduce((s, e) => s + (e.calculated_pay || 0), 0);

  // Per-job breakdown
  const byJob = {};
  weekEntries.forEach(e => {
    if (!byJob[e.job_id]) byJob[e.job_id] = { title: e.job_title || "Unknown", hours: 0, cost: 0 };
    byJob[e.job_id].hours += (e.hours_worked || 0);
    byJob[e.job_id].cost += (e.calculated_pay || 0);
  });

  if (weekEntries.length === 0) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <HardHat className="w-4 h-4 text-blue-500" />
        <h3 className="font-semibold text-sm">This Week's Sub Labor</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-blue-50 rounded-lg p-2 text-center">
          <p className="text-xs text-blue-700">Total Hours</p>
          <p className="font-bold text-blue-900">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="bg-green-50 rounded-lg p-2 text-center">
          <p className="text-xs text-green-700">Total Cost</p>
          <p className="font-bold text-green-900">{formatCurrency(totalCost)}</p>
        </div>
      </div>
      <div className="space-y-1">
        {Object.values(byJob).map((j, i) => (
          <div key={i} className="flex items-center justify-between text-xs p-1.5 bg-muted/20 rounded">
            <span className="font-medium truncate flex-1">{j.title}</span>
            <span className="text-muted-foreground mr-2">{j.hours.toFixed(1)}h</span>
            <span className="font-semibold">{formatCurrency(j.cost)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}