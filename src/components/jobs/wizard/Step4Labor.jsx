import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/formatters";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

export default function Step4Labor({ data, onChange }) {
  const { data: subcontractors = [] } = useQuery({ queryKey: ["subcontractors"], queryFn: () => base44.entities.Subcontractor.list("-created_date", 200) });

  const set = (k, v) => onChange({ ...data, [k]: v });
  const selectedSubs = data.sub_items || [];

  const addSubcontractor = (subId) => {
    const selected = subcontractors.find(s => s.id === subId);
    if (selected && !selectedSubs.some(s => s.subcontractor_id === subId)) {
      const newSub = {
        subcontractor_id: subId,
        name: selected.name,
        trade: selected.specialty || "",
        payment_type: "hourly",
        value: selected.hourly_rate || 0,
      };
      set("sub_items", [...selectedSubs, newSub]);
    }
  };

  const removeSub = (idx) => {
    set("sub_items", selectedSubs.filter((_, i) => i !== idx));
  };

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

      {/* Subcontractor selection */}
      <div className="pt-4 border-t">
        <Label className="block mb-2">Add Subcontractors (Optional)</Label>
        <div className="mb-3">
          <select onChange={(e) => addSubcontractor(e.target.value)} value="" className="w-full px-3 py-2 border border-input rounded-md text-sm bg-white">
            <option value="">Select a subcontractor to add...</option>
            {subcontractors.filter(s => s.status === "active").map(s => (
              <option key={s.id} value={s.id}>
                {s.name} {s.specialty ? `(${s.specialty})` : ""} - ${s.hourly_rate || "N/A"}/hr
              </option>
            ))}
          </select>
        </div>

        {selectedSubs.length > 0 && (
          <div className="space-y-2">
            {selectedSubs.map((sub, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded border border-muted">
                <div className="flex-1">
                  <p className="text-sm font-medium">{sub.name}</p>
                  <p className="text-xs text-muted-foreground">{sub.trade || "General"} • {formatCurrency(sub.value)}/hr</p>
                </div>
                <button onClick={() => removeSub(idx)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}