import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/formatters";

export default function Step4Labor({ data, onChange }) {
  const set = (k, v) => onChange({ ...data, [k]: v });

  const crewSize = parseFloat(data.crew_size) || 0;
  const hoursPerDay = parseFloat(data.hours_per_day) || 0;
  const days = parseFloat(data.labor_days) || 0;
  const rate = parseFloat(data.labor_rate) || 0;

  const totalHours = crewSize * hoursPerDay * days;
  const laborCost = totalHours * rate;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">Enter your labor estimates. The total cost is calculated automatically.</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Crew Size (number of workers)</Label>
          <Input type="number" min="0" value={data.crew_size || ""} onChange={e => set("crew_size", e.target.value)} placeholder="e.g. 3" />
        </div>
        <div>
          <Label>Estimated Hours Per Day</Label>
          <Input type="number" min="0" value={data.hours_per_day || ""} onChange={e => set("hours_per_day", e.target.value)} placeholder="e.g. 8" />
        </div>
        <div>
          <Label>Estimated Work Days</Label>
          <Input type="number" min="0" value={data.labor_days || ""} onChange={e => set("labor_days", e.target.value)} placeholder="e.g. 10" />
        </div>
        <div>
          <Label>Hourly Labor Rate ($ per worker/hr)</Label>
          <Input type="number" min="0" step="0.01" value={data.labor_rate || ""} onChange={e => set("labor_rate", e.target.value)} placeholder="e.g. 45" />
        </div>
      </div>

      {crewSize > 0 && days > 0 && rate > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider">Labor Calculation</p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Total Hours</p>
              <p className="font-semibold">{totalHours.toFixed(0)} hrs</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Rate</p>
              <p className="font-semibold">{formatCurrency(rate)}/hr</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Estimated Labor Cost</p>
              <p className="font-bold text-primary text-base">{formatCurrency(laborCost)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}