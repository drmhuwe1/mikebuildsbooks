import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { AlertCircle, TrendingDown } from "lucide-react";

export default function PaymentBreakdownAnalyzer({ jobs = [], settings = {} }) {
  const managerPct = settings.manager_pay_percent ?? 10;
  const taxReservePct = settings.tax_reserve_percent ?? 25;
  const businessBufferPct = 5; // Fixed 5% business reserve

  const paymentBreakdowns = useMemo(() => {
    const breakdowns = [];

    jobs.forEach(job => {
      const totalPaymentReceived = job.deposits_received || 0;
      if (totalPaymentReceived === 0) return;

      // Total actual expenses for the job
      const totalExpenses =
        (job.material_costs || 0) +
        (job.labor_costs || 0) +
        (job.subcontractor_costs || 0) +
        (job.permit_costs || 0) +
        (job.equipment_costs || 0) +
        (job.overhead_costs || 0) +
        (job.other_costs || 0);

      // Gross profit from this payment
      const grossProfitOnPayment = Math.max(0, totalPaymentReceived - totalExpenses);

      // Step 1: Set aside tax reserve (25% of gross profit)
      const taxReserveAmount = grossProfitOnPayment * (taxReservePct / 100);

      // Step 2: Set aside business cash buffer (10% of gross profit)
      const businessBufferAmount = grossProfitOnPayment * (businessBufferPct / 100);

      // Remaining after reserves
      const afterReserves = Math.max(0, grossProfitOnPayment - taxReserveAmount - businessBufferAmount);

      // Step 3: Business manager pay (10% of gross profit, taken from after-reserve amount)
      const managerPayAmount = Math.min(afterReserves, grossProfitOnPayment * (managerPct / 100));

      // Step 4: Subcontractor costs
      const subcontractorPaymentAmount = Math.min(job.subcontractor_costs || 0, afterReserves - managerPayAmount);

      // Step 5: Owner payout (what remains)
      const ownerPayoutAmount = Math.max(0, afterReserves - managerPayAmount - subcontractorPaymentAmount);

      // Verify allocation equals after-reserves
      const totalAllocated = managerPayAmount + subcontractorPaymentAmount + ownerPayoutAmount;

      breakdowns.push({
        job,
        paymentReceived: totalPaymentReceived,
        totalExpenses,
        grossProfitOnPayment,
        reserves: {
          taxReserve: taxReserveAmount,
          businessBuffer: businessBufferAmount,
          totalReserves: taxReserveAmount + businessBufferAmount,
        },
        afterReserves,
        distributions: {
          managerPay: managerPayAmount,
          subcontractorPay: subcontractorPaymentAmount,
          ownerPayout: ownerPayoutAmount,
        },
        totalAllocated,
        allocatedCorrectly: Math.abs(totalAllocated - afterReserves) < 0.01,
      });
    });

    return breakdowns;
  }, [jobs, managerPct, taxReservePct]);

  const totals = useMemo(() => {
    return {
      totalPayments: paymentBreakdowns.reduce((s, b) => s + b.paymentReceived, 0),
      totalExpenses: paymentBreakdowns.reduce((s, b) => s + b.totalExpenses, 0),
      totalGrossProfit: paymentBreakdowns.reduce((s, b) => s + b.grossProfitOnPayment, 0),
      totalTaxReserve: paymentBreakdowns.reduce((s, b) => s + b.reserves.taxReserve, 0),
      totalBusinessBuffer: paymentBreakdowns.reduce((s, b) => s + b.reserves.businessBuffer, 0),
      totalManagerPay: paymentBreakdowns.reduce((s, b) => s + b.distributions.managerPay, 0),
      totalSubPay: paymentBreakdowns.reduce((s, b) => s + b.distributions.subcontractorPay, 0),
      totalOwnerPayout: paymentBreakdowns.reduce((s, b) => s + b.distributions.ownerPayout, 0),
    };
  }, [paymentBreakdowns]);

  if (paymentBreakdowns.length === 0) {
    return (
      <Card className="p-6 bg-gray-50 border-gray-200">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4" />
          No client payments received yet.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall summary */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <p className="text-sm font-semibold text-amber-900 mb-3">💰 Payment Processing Summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-amber-700">Total Payments</span>
            <p className="font-bold text-amber-900">{formatCurrency(totals.totalPayments)}</p>
          </div>
          <div>
            <span className="text-amber-700">Total Expenses</span>
            <p className="font-bold text-amber-900">{formatCurrency(totals.totalExpenses)}</p>
          </div>
          <div>
            <span className="text-amber-700">Gross Profit</span>
            <p className="font-bold text-amber-900">{formatCurrency(totals.totalGrossProfit)}</p>
          </div>
          <div>
            <span className="text-amber-700">Kept in Business (Reserves)</span>
            <p className="font-bold text-amber-900">{formatCurrency(totals.totalTaxReserve + totals.totalBusinessBuffer)}</p>
          </div>
        </div>
      </Card>

      {/* Allocation waterfall */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm font-semibold text-blue-900 mb-4">📊 Allocation Waterfall (All Payments Combined)</p>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-blue-200">
            <span className="text-blue-800">Total Client Payments</span>
            <span className="font-bold text-blue-900">{formatCurrency(totals.totalPayments)}</span>
          </div>

          <div className="flex items-center justify-between text-red-600 py-1">
            <span>– Expenses (Materials, Labor, Permits, etc.)</span>
            <span className="font-semibold">({formatCurrency(totals.totalExpenses)})</span>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-b border-blue-200 bg-white px-2 rounded">
            <span className="font-semibold text-blue-900">= Gross Profit</span>
            <span className="text-lg font-bold text-blue-900">{formatCurrency(totals.totalGrossProfit)}</span>
          </div>

          <div className="mt-3 space-y-2 bg-white p-2 rounded border border-amber-100">
            <p className="font-semibold text-xs text-amber-900 mb-2">💼 Held in Business Account (Overhead):</p>
            <div className="flex items-center justify-between text-amber-700 py-1">
              <span>• Owner Income Tax Reserve ({taxReservePct}% of gross profit)</span>
              <span className="font-semibold">{formatCurrency(totals.totalTaxReserve)}</span>
            </div>
            <div className="text-xs text-amber-600 ml-4">For owner's personal tax liability at year-end (not 1099 contractor taxes)</div>
            <div className="flex items-center justify-between text-amber-700 py-1 mt-2">
              <span>• Business Reserve ({businessBufferPct}% of gross profit)</span>
              <span className="font-semibold">{formatCurrency(totals.totalBusinessBuffer)}</span>
            </div>
            <div className="text-xs text-amber-600 ml-4">Operating reserve to maintain cash flow</div>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-blue-200 font-semibold text-blue-900">
            <span>Remaining for Distributions</span>
            <span>{formatCurrency(totals.totalGrossProfit - totals.totalTaxReserve - totals.totalBusinessBuffer)}</span>
          </div>

          <div className="mt-3 space-y-2 bg-white p-2 rounded border border-green-100">
            <p className="font-semibold text-xs text-green-900 mb-2">Paid Out:</p>
            <div className="flex items-center justify-between text-green-700 py-1">
              <span>• Business Manager ({managerPct}% of gross profit)</span>
              <span className="font-semibold">{formatCurrency(totals.totalManagerPay)}</span>
            </div>
            <div className="flex items-center justify-between text-green-700 py-1">
              <span>• Subcontractors</span>
              <span className="font-semibold">{formatCurrency(totals.totalSubPay)}</span>
            </div>
            <div className="flex items-center justify-between text-green-700 py-1">
              <span>• Owner Payout</span>
              <span className="font-semibold">{formatCurrency(totals.totalOwnerPayout)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Per-payment breakdown */}
      <div>
        <p className="text-sm font-semibold mb-3">Per-Payment Breakdown</p>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {paymentBreakdowns.map((breakdown, idx) => (
            <Card key={idx} className="p-4 border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-sm">{breakdown.job.title}</p>
                  <p className="text-xs text-muted-foreground">{breakdown.job.client_name || "—"}</p>
                </div>
                {!breakdown.allocatedCorrectly && (
                  <Badge variant="destructive" className="text-xs">
                    Allocation error
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs mb-3 pb-3 border-b">
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-muted-foreground">Payment</p>
                  <p className="font-bold">{formatCurrency(breakdown.paymentReceived)}</p>
                </div>
                <div className="bg-red-50 p-2 rounded">
                  <p className="text-muted-foreground">Expenses</p>
                  <p className="font-bold text-red-700">{formatCurrency(breakdown.totalExpenses)}</p>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <p className="text-muted-foreground">Profit</p>
                  <p className="font-bold text-green-700">{formatCurrency(breakdown.grossProfitOnPayment)}</p>
                </div>
                <div className="bg-amber-50 p-2 rounded">
                    <p className="text-muted-foreground">Owner Tax</p>
                    <p className="font-bold text-amber-700">{formatCurrency(breakdown.reserves.taxReserve)}</p>
                  </div>
                  <div className="bg-orange-50 p-2 rounded">
                    <p className="text-muted-foreground">Bus. Res. (5%)</p>
                    <p className="font-bold text-orange-700">{formatCurrency(breakdown.reserves.businessBuffer)}</p>
                  </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-muted-foreground text-xs">Manager</p>
                  <p className="font-bold text-blue-700">{formatCurrency(breakdown.distributions.managerPay)}</p>
                </div>
                <div className="bg-purple-50 p-2 rounded">
                  <p className="text-muted-foreground text-xs">Subcontractors</p>
                  <p className="font-bold text-purple-700">{formatCurrency(breakdown.distributions.subcontractorPay)}</p>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <p className="text-muted-foreground text-xs">Owner</p>
                  <p className="font-bold text-green-700">{formatCurrency(breakdown.distributions.ownerPayout)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}