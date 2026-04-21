import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/formatters";

export default function PayoutSummaryCards({ subPayments = [], subLaborEntries = [], managerPayments = [], settings = {} }) {
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const currentYear = today.getFullYear().toString();
  const [showPayoutsModal, setShowPayoutsModal] = useState(false);

  // Subcontractor totals from ledger payments + all sub labor entries with calculated_pay
  const subMonthly = useMemo(() => {
    const ledger = subPayments
      .filter(p => p.payment_date?.startsWith(currentMonth))
      .reduce((sum, p) => sum + (p.amount_paid || 0), 0);
    const labor = subLaborEntries
      .filter(s => s.work_date?.startsWith(currentMonth) && (s.calculated_pay || 0) > 0)
      .reduce((sum, s) => sum + (s.calculated_pay || 0), 0);
    return ledger + labor;
  }, [subPayments, subLaborEntries, currentMonth]);

  const subYTD = useMemo(() => {
    const ledger = subPayments
      .filter(p => p.payment_date?.startsWith(currentYear))
      .reduce((sum, p) => sum + (p.amount_paid || 0), 0);
    const labor = subLaborEntries
      .filter(s => s.work_date?.startsWith(currentYear) && (s.calculated_pay || 0) > 0)
      .reduce((sum, s) => sum + (s.calculated_pay || 0), 0);
    return ledger + labor;
  }, [subPayments, subLaborEntries, currentYear]);

  const allPayouts = useMemo(() => {
    const items = [];
    subPayments
      .filter(p => p.payment_date?.startsWith(currentYear))
      .forEach(p => items.push({ type: "Ledger", name: p.subcontractor_name || "Subcontractor", date: p.payment_date, amount: p.amount_paid || 0 }));
    subLaborEntries
      .filter(s => s.work_date?.startsWith(currentYear) && (s.calculated_pay || 0) > 0)
      .forEach(s => items.push({ type: "Work Entry", name: s.subcontractor_name || "Subcontractor", date: s.work_date, amount: s.calculated_pay || 0 }));
    managerPayments
      .filter(p => p.payment_date?.startsWith(currentYear))
      .forEach(p => items.push({ type: "Manager", name: "Manager", date: p.payment_date, amount: p.amount_paid || 0 }));
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [subPayments, subLaborEntries, managerPayments, currentYear]);

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
    <>
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
        <Card
          onClick={() => setShowPayoutsModal(true)}
          className="p-4 bg-accent/50 cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">Total Payouts</p>
          <p className="text-xs text-muted-foreground mb-2">Year to Date</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(totalYTD)}</p>
          <p className="text-xs text-primary mt-1 font-medium">Click to see details →</p>
        </Card>
      </div>

      <Dialog open={showPayoutsModal} onOpenChange={setShowPayoutsModal}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Payouts — {currentYear}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {allPayouts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No payouts recorded this year.</p>
            ) : (
              <>
                {allPayouts.map((payout, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{payout.name}</p>
                      <p className="text-xs text-muted-foreground">{payout.type} · {payout.date}</p>
                    </div>
                    <p className="text-sm font-bold text-right shrink-0">{formatCurrency(payout.amount)}</p>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t mt-3">
                  <p className="font-semibold text-sm">Total</p>
                  <p className="font-bold text-base">{formatCurrency(totalYTD)}</p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}