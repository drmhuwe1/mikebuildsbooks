import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";

export default function PayoutSummaryCards({ subPayments = [], settings = {} }) {
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const currentYear = today.getFullYear();

  // Calculate subcontractor payouts (all payment types)
  const subMonthly = useMemo(() => {
    return subPayments
      .filter(p => p.status === "paid" && p.payment_date?.startsWith(currentMonth))
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [subPayments, currentMonth]);

  const subYTD = useMemo(() => {
    return subPayments
      .filter(p => p.status === "paid" && p.payment_date?.startsWith(currentYear.toString()))
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [subPayments, currentYear]);

  // Calculate business manager payouts (from settings)
  const managerPct = settings.manager_pay_percent ?? 10;
  const managerName = settings.manager_name || "Business Manager";

  // Estimate manager pay based on YTD gross profit (simplified)
  // In a real scenario, this would come from closed job records
  const managerMonthly = 0; // Would need payout records to calculate
  const managerYTD = 0;     // Would need payout records to calculate

  const totalMonthly = subMonthly + managerMonthly;
  const totalYTD = subYTD + managerYTD;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Subcontractors Monthly */}
      <Card className="p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Subcontractors</p>
        <p className="text-xs text-muted-foreground mb-2">This Month</p>
        <p className="text-2xl font-bold text-foreground">{formatCurrency(subMonthly)}</p>
      </Card>

      {/* Subcontractors YTD */}
      <Card className="p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Subcontractors</p>
        <p className="text-xs text-muted-foreground mb-2">Year to Date</p>
        <p className="text-2xl font-bold text-foreground">{formatCurrency(subYTD)}</p>
      </Card>

      {/* Business Manager Monthly */}
      <Card className="p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{managerName}</p>
        <p className="text-xs text-muted-foreground mb-2">This Month</p>
        <p className="text-2xl font-bold text-foreground">{formatCurrency(managerMonthly)}</p>
        <p className="text-xs text-muted-foreground mt-1">({managerPct}% of profit)</p>
      </Card>

      {/* Business Manager YTD */}
      <Card className="p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{managerName}</p>
        <p className="text-xs text-muted-foreground mb-2">Year to Date</p>
        <p className="text-2xl font-bold text-foreground">{formatCurrency(managerYTD)}</p>
        <p className="text-xs text-muted-foreground mt-1">({managerPct}% of profit)</p>
      </Card>

      {/* Total Payouts YTD */}
      <Card className="p-4 bg-accent/50">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">Total Payouts</p>
        <p className="text-xs text-muted-foreground mb-2">Year to Date</p>
        <p className="text-2xl font-bold text-foreground">{formatCurrency(totalYTD)}</p>
      </Card>
    </div>
  );
}