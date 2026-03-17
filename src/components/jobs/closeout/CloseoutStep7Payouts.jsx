import React from "react";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/formatters";

export default function CloseoutStep7Payouts({ closeoutData, update, defaultReserves, financials }) {
  const overrides = closeoutData.reserve_overrides || {};
  const getAmount = (key) => overrides[key] !== undefined ? overrides[key] : defaultReserves[key]?.amount || 0;

  const ownerPayout = getAmount("owner_payout");
  const adminComp = getAmount("admin_compensation");
  const remaining = financials.netAfterManager - Object.keys(defaultReserves).reduce((sum, k) => sum + getAmount(k), 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Step 7 — Final Payout Calculation</h2>
        <p className="text-sm text-muted-foreground mt-1">Review distributions before confirming. These will be recorded as part of the job closeout.</p>
      </div>

      <div className="space-y-3">
        <div className="rounded-lg border px-4 py-3 bg-primary/10 flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold text-primary">Business Manager Pay</p>
            <p className="text-xs text-muted-foreground">{financials.managerPct}% of gross profit</p>
          </div>
          <p className="text-lg font-bold text-primary">{formatCurrency(financials.managerPay)}</p>
        </div>

        <div className="rounded-lg border px-4 py-3 flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold">Owner Payout</p>
            <p className="text-xs text-muted-foreground">From reserve allocations</p>
          </div>
          <p className="text-sm font-bold">{formatCurrency(ownerPayout)}</p>
        </div>

        <div className="rounded-lg border px-4 py-3 flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold">Admin Compensation</p>
            <p className="text-xs text-muted-foreground">From reserve allocations</p>
          </div>
          <p className="text-sm font-bold">{formatCurrency(adminComp)}</p>
        </div>

        <div className="rounded-lg border px-4 py-3 flex justify-between items-center bg-muted/30">
          <div>
            <p className="text-sm font-semibold">Remaining Company Profit</p>
            <p className="text-xs text-muted-foreground">After all distributions and reserves</p>
          </div>
          <p className={`text-sm font-bold ${remaining >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(remaining)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-primary/30 bg-primary/5">
        <div>
          <p className="text-sm font-medium">Confirm Distributions</p>
          <p className="text-xs text-muted-foreground">Toggle to approve the payout breakdown above</p>
        </div>
        <Switch
          checked={closeoutData.payouts_confirmed}
          onCheckedChange={v => update({ payouts_confirmed: v })}
        />
      </div>
    </div>
  );
}