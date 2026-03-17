import React from "react";
import { formatCurrency } from "@/lib/formatters";

export default function CloseoutStep5FinancialSummary({ financials }) {
  const { revenue, materialCosts, laborCosts, subCosts, otherCosts, overhead, totalCosts, grossProfit, managerPay, netAfterManager, managerPct } = financials;
  const margin = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : "0.0";

  const rows = [
    { label: "Total Revenue", value: revenue, bold: true },
    { label: "Material Costs", value: -materialCosts },
    { label: "Labor Costs", value: -laborCosts },
    { label: "Subcontractor Costs", value: -subCosts },
    { label: "Other Expenses (permits, equip, other)", value: -otherCosts },
    { label: "Overhead Allocation", value: -overhead },
    { label: "Total Costs", value: -totalCosts, bold: true },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Step 5 — Final Job Financial Summary</h2>
        <p className="text-sm text-muted-foreground mt-1">Auto-calculated based on your final cost entries.</p>
      </div>

      <div className="rounded-lg border divide-y">
        {rows.map((r, i) => (
          <div key={i} className={`flex justify-between px-4 py-2.5 text-sm ${r.bold ? "bg-muted/40 font-semibold" : ""}`}>
            <span className={r.bold ? "" : "text-muted-foreground"}>{r.label}</span>
            <span className={r.value < 0 ? "text-red-600" : ""}>{formatCurrency(Math.abs(r.value))}{r.value < 0 ? " (cost)" : ""}</span>
          </div>
        ))}
        <div className="flex justify-between px-4 py-3 bg-primary/5 font-bold text-sm">
          <span>Gross Profit ({margin}% margin)</span>
          <span className={grossProfit >= 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(grossProfit)}</span>
        </div>
        <div className="flex justify-between px-4 py-2.5 text-sm text-muted-foreground">
          <span>Manager Pay ({managerPct}%)</span>
          <span className="text-primary font-medium">{formatCurrency(managerPay)}</span>
        </div>
        <div className="flex justify-between px-4 py-3 bg-green-50 font-bold text-sm">
          <span>Net Profit (after manager pay)</span>
          <span className={netAfterManager >= 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(netAfterManager)}</span>
        </div>
      </div>
    </div>
  );
}