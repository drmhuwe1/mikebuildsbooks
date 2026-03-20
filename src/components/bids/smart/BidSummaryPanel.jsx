import React from "react";
import { formatCurrency } from "@/lib/formatters";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

export default function BidSummaryPanel({ lineItems, profitMargin, onProfitMarginChange }) {
  const byCategory = (cat) => lineItems.filter(r => r.category === cat).reduce((s, r) => s + (r.estimatedCost || 0), 0);

  const materialsTotal = byCategory("materials");
  const laborTotal = byCategory("labor");
  const subTotal = byCategory("subcontractor");
  const permitTotal = byCategory("permit");
  const equipmentTotal = byCategory("equipment");
  const overheadTotal = byCategory("overhead");
  const contingencyTotal = byCategory("contingency");

  const subtotal = lineItems.reduce((s, r) => s + (r.estimatedCost || 0), 0);
  const grandTotal = subtotal > 0 ? subtotal / (1 - (profitMargin / 100)) : 0;
  const estimatedProfit = grandTotal - subtotal;

  const marginColor = profitMargin < 10 ? "text-red-600" : profitMargin < 20 ? "text-yellow-600" : "text-green-600";
  const marginBg = profitMargin < 10 ? "bg-red-50 border-red-200" : profitMargin < 20 ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200";

  const rows = [
    { label: "Materials", value: materialsTotal },
    { label: "Labor", value: laborTotal },
    { label: "Subcontractors", value: subTotal },
    { label: "Permits", value: permitTotal },
    { label: "Equipment", value: equipmentTotal },
    { label: "Overhead", value: overheadTotal },
    { label: "Contingency", value: contingencyTotal },
  ].filter(r => r.value > 0);

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-foreground">Bid Summary</p>

      {/* Cost Breakdown */}
      <div className="space-y-1.5">
        {rows.map(r => (
          <div key={r.label} className="flex justify-between text-xs">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="font-medium">{formatCurrency(r.value)}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-semibold border-t pt-2 mt-1">
          <span>Total Cost</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
      </div>

      {/* Profit Margin */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Profit Margin</span>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={profitMargin}
              onChange={e => onProfitMarginChange(parseFloat(e.target.value) || 0)}
              className="w-14 h-6 text-xs text-right p-1"
            />
            <span className="text-xs">%</span>
          </div>
        </div>
        <Slider
          value={[profitMargin]}
          onValueChange={([v]) => onProfitMarginChange(v)}
          min={0}
          max={60}
          step={1}
          className="w-full"
        />
      </div>

      {/* Grand Total */}
      <div className={`rounded-lg border p-3 space-y-1 ${marginBg}`}>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Est. Profit</span>
          <span className={`font-semibold ${marginColor}`}>{formatCurrency(estimatedProfit)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold">Grand Total</span>
          <span className="text-xl font-bold">{formatCurrency(grandTotal)}</span>
        </div>
        <div className={`text-xs font-semibold text-right ${marginColor}`}>{profitMargin}% margin</div>
      </div>
    </div>
  );
}