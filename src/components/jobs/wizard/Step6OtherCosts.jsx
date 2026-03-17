import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/formatters";

const COST_FIELDS = [
  { key: "permit_costs", label: "Permit Fees", placeholder: "0.00" },
  { key: "equipment_costs", label: "Equipment Rentals", placeholder: "0.00" },
  { key: "dumpster_costs", label: "Dumpster / Waste Removal", placeholder: "0.00" },
  { key: "inspection_costs", label: "Inspections / Testing", placeholder: "0.00" },
  { key: "contingency_costs", label: "Contingency Allowance", placeholder: "0.00" },
  { key: "other_costs", label: "Other Miscellaneous Costs", placeholder: "0.00" },
];

export default function Step6OtherCosts({ data, onChange }) {
  const set = (k, v) => onChange({ ...data, [k]: v });

  const total = COST_FIELDS.reduce((sum, f) => sum + (parseFloat(data[f.key]) || 0), 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Enter any additional project costs. Leave blank if not applicable.</p>

      <div className="grid grid-cols-2 gap-4">
        {COST_FIELDS.map(f => (
          <div key={f.key}>
            <Label>{f.label}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                className="pl-6"
                value={data[f.key] || ""}
                onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
              />
            </div>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="flex justify-end pt-3 border-t">
          <p className="text-sm font-semibold">Total Additional Costs: <span className="text-primary">{formatCurrency(total)}</span></p>
        </div>
      )}
    </div>
  );
}