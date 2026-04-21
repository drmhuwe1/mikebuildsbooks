import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/formatters";

export default function Step7OverheadProfit({ data, onChange, totals, overheadMode = "direct", defaultOverheadPct = 10, contractAmount = 0 }) {
  const set = (k, v) => onChange({ ...data, [k]: v });
  const [useBidEstimate, setUseBidEstimate] = useState(!!data.bid_amount_estimate);

  const isPercentageMode = overheadMode === "percentage";
  const overhead = parseFloat(data.overhead_percent) || 0;
  const margin = parseFloat(data.target_profit_margin) || 0;
  const managerPayPct = parseFloat(data.manager_pay_percent) || 10;

  const { directCost } = totals;
  // In percentage mode: overhead is % of contract amount; in direct mode: % of direct costs
  const overheadAmount = isPercentageMode
    ? contractAmount * (defaultOverheadPct / 100)
    : directCost * (overhead / 100);
  const totalCost = directCost + overheadAmount;
  const bidAmount = useBidEstimate && data.bid_amount_estimate 
    ? parseFloat(data.bid_amount_estimate) 
    : (margin > 0 ? totalCost / (1 - margin / 100) : totalCost);
  const grossProfit = bidAmount - totalCost;
  const managerPay = grossProfit * (managerPayPct / 100);
  const netProfit = grossProfit - managerPay;

  const rows = [
    { label: "Direct Job Costs", value: directCost },
    { label: `Overhead (${overhead}%)`, value: overheadAmount },
    { label: "Total Estimated Cost", value: totalCost, bold: true },
    { label: `Bid Amount (${margin}% margin)`, value: bidAmount, bold: true, highlight: true },
    { label: "Projected Gross Profit", value: grossProfit },
    { label: `Manager Pay (${managerPayPct}%)`, value: managerPay },
    { label: "Projected Net Profit", value: netProfit, bold: true },
  ];

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">Set your overhead percentage, profit margin, and manager compensation to calculate net profit.</p>

      {isPercentageMode ? (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
          <p className="font-medium">Overhead: Auto-calculated at {defaultOverheadPct}% of contract</p>
          <p className="text-xs text-blue-700 mt-0.5">= {formatCurrency(overheadAmount)} — Change the percentage in Settings.</p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        {!isPercentageMode && <div>
          <Label>Overhead Percentage (%)</Label>
          <Input type="number" min="0" max="100" step="0.5" value={data.overhead_percent || ""} onChange={e => set("overhead_percent", e.target.value)} placeholder="e.g. 10" />
          <p className="text-xs text-muted-foreground mt-1">General business overhead (office, insurance, vehicles)</p>
        </div>}
        <div>
          <Label>Target Profit Margin (%)</Label>
          <Input type="number" min="0" max="100" step="0.5" value={data.target_profit_margin || ""} onChange={e => set("target_profit_margin", e.target.value)} placeholder="e.g. 20" />
          <p className="text-xs text-muted-foreground mt-1">Desired profit as a percentage of the bid</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Switch checked={useBidEstimate} onCheckedChange={v => setUseBidEstimate(v)} />
        <div>
          <p className="text-sm font-medium text-blue-900">Use Bid Estimate Amount</p>
          <p className="text-xs text-blue-800">Use the bid amount to override margin calculation</p>
        </div>
      </div>

      {useBidEstimate && (
        <div>
          <Label>Bid Amount ($)</Label>
          <Input type="number" value={data.bid_amount_estimate || ""} onChange={e => set("bid_amount_estimate", e.target.value)} placeholder="Enter bid amount" />
        </div>
      )}

      <div>
        <Label>Business Manager Pay %</Label>
        <Input type="number" min="0" max="100" step="0.5" value={data.manager_pay_percent || ""} onChange={e => set("manager_pay_percent", e.target.value)} placeholder="e.g. 10" />
        <p className="text-xs text-muted-foreground mt-1">Percentage of gross profit for manager 1099 compensation</p>
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