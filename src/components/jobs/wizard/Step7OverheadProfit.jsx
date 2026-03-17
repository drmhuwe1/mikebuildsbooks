import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/formatters";

export default function Step7OverheadProfit({ data, onChange, totals }) {
  const set = (k, v) => onChange({ ...data, [k]: v });
  const overhead = parseFloat(data.overhead_percent) || 0;
  const margin = parseFloat(data.target_profit_margin) || 0;

  const { directCost } = totals;
  const overheadAmount = directCost * (overhead / 100);
  const totalCost = directCost + overheadAmount;
  const bidAmount = margin > 0 ? totalCost / (1 - margin / 100) : totalCost;
  const grossProfit = bidAmount - totalCost;
  const netProfit = grossProfit - overheadAmount;

  const rows = [
    { label: "Direct Job Costs", value: directCost },
    { label: `Overhead (${overhead}%)`, value: overheadAmount },
    { label: "Total Estimated Cost", value: totalCost, bold: true },
    { label: `Bid Amount (${margin}% margin)`, value: bidAmount, bold: true, highlight: true },
    { label: "Projected Gross Profit", value: grossProfit },
    { label: "Projected Net Profit", value: netProfit },
  ];

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">Set your overhead percentage and target profit margin to calculate the final bid amount.</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Overhead Percentage (%)</Label>
          <Input type="number" min="0" max="100" step="0.5" value={data.overhead_percent || ""} onChange={e => set("overhead_percent", e.target.value)} placeholder="e.g. 10" />
          <p className="text-xs text-muted-foreground mt-1">General business overhead (office, insurance, vehicles)</p>
        </div>
        <div>
          <Label>Target Profit Margin (%)</Label>
          <Input type="number" min="0" max="100" step="0.5" value={data.target_profit_margin || ""} onChange={e => set("target_profit_margin", e.target.value)} placeholder="e.g. 20" />
          <p className="text-xs text-muted-foreground mt-1">Desired profit as a percentage of the bid</p>
        </div>
      </div>

      <div className="bg-muted/40 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Financial Breakdown</p>
        {rows.map(row => (
          <div key={row.label} className={`flex justify-between items-center py-1 ${row.bold ? "border-t mt-2 pt-2" : ""}`}>
            <span className={`text-sm ${row.bold ? "font-semibold" : "text-muted-foreground"}`}>{row.label}</span>
            <span className={`text-sm font-semibold ${row.highlight ? "text-primary text-base" : ""}`}>{formatCurrency(row.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}