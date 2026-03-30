import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";

export default function PayoutSummaryCards({ subPayments = [], subLaborEntries = [], managerPayments = [], settings = {} }) {
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const currentYear = today.getFullYear().toString();

  // Subcontractor totals from ledger payments (is_paid + amount_paid)
  const subMonthly = useMemo(() => {
    const ledger = subPayments
      .filter(p => p.is_paid && p.payment_date?.startsWith(currentMonth))
      .reduce((sum, p) => sum + (p.amount_paid || 0), 0);
    const labor = subLaborEntries
      .filter(s => s.payment_status === "Paid" && s.work_date?.startsWith(currentMonth))
      .reduce((sum, s) => sum + (s.calculated_pay || 0), 0);
    return ledger + labor;
  }, [subPayments, subLaborEntries, currentMonth]);

  const subYTD = useMemo(() => {
    const ledger = subPayments
      .filter(p => p.is_paid && p.payment_date?.startsWith(currentYear))
      .reduce((sum, p) => sum + (p.amount_paid || 0), 0);
    const labor = subLaborEntries
      .filter(s => s.payment_status === "Paid" && s.work_date?.startsWith(currentYear))
      .reduce((sum, s) => sum + (s.calculated_pay || 0), 0);
    return ledger + labor;
  }, [subPayments, subLaborEntries, currentYear]);

  // Manager totals from ManagerPayment records
  const managerPct = settings.manager_pay_percent ?? 10;
  const managerName = settings.manager_name || "Business Manager";

  const managerMonthly = useMemo(() =>
    managerPayments.filter(p => p.payment_date?.startsWith(currentMonth)).reduce((sum, p) => sum + (p.amount_paid || 0), 0),
    [managerPayments, currentMonth]
  );

  const managerYTD = useMemo(() =>
    managerPayments.filter(p => p.payment_date?.startsWith(currentYear)).reduce((sum, p) => sum + (p.amount_paid || 0), 0),
    [managerPayments, currentYear]
  );

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