import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/formatters";

export default function CloseoutStep3Labor({ job, closeoutData, update }) {
  const estimatedLabor = job.labor_costs || 0;
  const diff = closeoutData.labor_costs - estimatedLabor;

  const recalc = (hours, rate) => {
    update({ labor_hours: hours, labor_rate: rate, labor_costs: parseFloat((hours * rate).toFixed(2)) });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Step 3 — Final Labor Costs</h2>
        <p className="text-sm text-muted-foreground mt-1">Enter actual labor hours to calculate final labor cost, or override directly.</p>
      </div>

      <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Estimated labor cost</span>
          <span className="font-medium">{formatCurrency(estimatedLabor)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Total Labor Hours</Label>
          <Input
            type="number"
            value={closeoutData.labor_hours}
            onChange={e => recalc(parseFloat(e.target.value) || 0, closeoutData.labor_rate)}
          />
        </div>
        <div>
          <Label>Hourly Rate ($)</Label>
          <Input
            type="number"
            value={closeoutData.labor_rate}
            onChange={e => recalc(closeoutData.labor_hours, parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div>
        <Label>Final Labor Cost ($) — override if needed</Label>
        <Input
          type="number"
          value={closeoutData.labor_costs}
          onChange={e => update({ labor_costs: parseFloat(e.target.value) || 0 })}
        />
      </div>

      {diff !== 0 && (
        <div className={`text-sm px-4 py-2 rounded-lg border ${
          diff > 0 ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"
        }`}>
          {diff > 0 ? "▲" : "▼"} {formatCurrency(Math.abs(diff))} {diff > 0 ? "over estimate" : "under estimate"}
        </div>
      )}

      <div className="rounded-lg border px-4 py-3 bg-primary/5">
        <p className="text-sm font-semibold text-primary">Final Labor Total: {formatCurrency(closeoutData.labor_costs)}</p>
      </div>
    </div>
  );
}