import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/formatters";

export default function CloseoutStep6Reserves({ closeoutData, update, defaultReserves, financials }) {
  const overrides = closeoutData.reserve_overrides || {};

  const getAmount = (key) =>
    overrides[key] !== undefined ? overrides[key] : defaultReserves[key]?.amount || 0;

  const setOverride = (key, val) => {
    update({ reserve_overrides: { ...overrides, [key]: parseFloat(val) || 0 } });
  };

  const total = Object.keys(defaultReserves).reduce((sum, k) => sum + getAmount(k), 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Step 6 — Reserve Allocations</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Suggested allocations based on net profit of {formatCurrency(financials.netAfterManager)}. Adjust as needed.
        </p>
      </div>

      <div className="space-y-3">
        {Object.entries(defaultReserves).map(([key, bucket]) => (
          <div key={key} className="flex items-center gap-3 rounded-lg border px-4 py-3 bg-muted/20">
            <div className="flex-1">
              <p className="text-sm font-medium">{bucket.label}</p>
              <p className="text-xs text-muted-foreground">{bucket.pct}% of net profit → suggested {formatCurrency(bucket.amount)}</p>
            </div>
            <div className="w-28">
              <Input
                type="number"
                value={getAmount(key)}
                onChange={e => setOverride(key, e.target.value)}
                className="text-sm h-8"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border px-4 py-3 bg-primary/5 flex justify-between items-center">
        <p className="text-sm font-semibold">Total Allocated</p>
        <p className={`text-sm font-bold ${total > financials.netAfterManager ? "text-red-600" : "text-green-600"}`}>
          {formatCurrency(total)}
          {total > financials.netAfterManager && " ⚠ Over net profit"}
        </p>
      </div>
    </div>
  );
}