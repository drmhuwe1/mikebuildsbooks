import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/formatters";

export default function CloseoutStep2Materials({ job, closeoutData, update }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Step 2 — Final Material Costs</h2>
        <p className="text-sm text-muted-foreground mt-1">Review and finalize all material expenses for this job.</p>
      </div>

      <div className="rounded-lg border bg-muted/30 px-4 py-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Original estimate</span>
          <span className="font-medium">{formatCurrency(job.material_costs || 0)}</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Adjust the final amount below if actuals differ</span>
        </div>
      </div>

      <div>
        <Label>Final Material Cost ($)</Label>
        <Input
          type="number"
          value={closeoutData.material_costs}
          onChange={e => update({ material_costs: parseFloat(e.target.value) || 0 })}
        />
      </div>

      {closeoutData.material_costs !== (job.material_costs || 0) && (
        <div className={`text-sm px-4 py-2 rounded-lg border ${
          closeoutData.material_costs > (job.material_costs || 0)
            ? "bg-red-50 border-red-200 text-red-700"
            : "bg-green-50 border-green-200 text-green-700"
        }`}>
          {closeoutData.material_costs > (job.material_costs || 0) ? "▲" : "▼"} {" "}
          {formatCurrency(Math.abs(closeoutData.material_costs - (job.material_costs || 0)))} {" "}
          {closeoutData.material_costs > (job.material_costs || 0) ? "over estimate" : "under estimate"}
        </div>
      )}

      <div className="rounded-lg border px-4 py-3 bg-primary/5">
        <p className="text-sm font-semibold text-primary">Final Material Total: {formatCurrency(closeoutData.material_costs)}</p>
      </div>
    </div>
  );
}