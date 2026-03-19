import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/formatters";
import { TrendingUp, DollarSign, Users } from "lucide-react";
import PaymentBreakdownAnalyzer from "./PaymentBreakdownAnalyzer";

export default function PayoutComparisonSummary({ jobs = [], bids = [], transactions = [], subPayments = [], settings = {} }) {
  const currentYear = new Date().getFullYear();
  const managerPct = settings.manager_pay_percent ?? 10;
  const ownerPayoutPct = settings.owner_payout_percent ?? 30;
  const taxReservePct = settings.tax_reserve_percent ?? 25;
  const subReservePct = settings.subcontractor_reserve_percent ?? 10;
  const operatingReservePct = settings.operating_reserve_percent ?? 10;

  // ACTUAL YTD PAYOUTS
  const actualPayouts = useMemo(() => {
    // Owner draws (YTD)
    const ownerYTD = transactions
      .filter(t => t.category === "owner_draw" && t.date?.startsWith(currentYear.toString()))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Subcontractor payments (YTD, paid only)
    const subYTD = subPayments
      .filter(p => p.status === "paid" && p.payment_date?.startsWith(currentYear.toString()))
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Manager payments (YTD) - from transactions with payroll/owner_draw category or need to infer
    // For now, assume manager payments tracked separately or calculate from payout records
    const managerYTD = transactions
      .filter(t => t.category === "payroll" && t.date?.startsWith(currentYear.toString()))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return { ownerYTD, subYTD, managerYTD };
  }, [transactions, subPayments, currentYear]);

  // FORECASTED PAYOUTS from active/contracted jobs + approved bids
  const forecastedPayouts = useMemo(() => {
    const activeJobs = jobs.filter(j => ["in_progress", "contracted"].includes(j.status));
    const approvedBids = bids.filter(b => b.status === "approved" && !jobs.some(j => j.bid_id === b.id));

    let totalGrossProfit = 0;
    let totalSubEstimate = 0;

    // Calculate gross profit from active jobs
    activeJobs.forEach(j => {
      const revenue = j.contract_amount || 0;
      const costs = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0);
      const profit = Math.max(0, revenue - costs);
      totalGrossProfit += profit;
      totalSubEstimate += j.subcontractor_costs || 0;
    });

    // Estimate from approved bids
    approvedBids.forEach(b => {
      const revenue = b.bid_amount || 0;
      const laborCost = (b.labor_hours || 0) * (settings.default_labor_rate || 45);
      const costs = (b.material_cost || 0) + laborCost + (b.subcontractor_cost || 0) + (b.permit_cost || 0) + (b.equipment_cost || 0);
      const profit = Math.max(0, revenue - costs);
      totalGrossProfit += profit;
      totalSubEstimate += b.subcontractor_cost || 0;
    });

    // After tax reserve, we have net profit
    const afterTaxReserve = Math.max(0, totalGrossProfit * (1 - taxReservePct / 100));
    
    // Manager pay from gross profit
    const managerForecast = totalGrossProfit * (managerPct / 100);
    
    // After manager pay, distribute remaining
    const afterManagerPay = Math.max(0, totalGrossProfit - managerForecast - (totalGrossProfit * taxReservePct / 100));
    
    // Owner gets % of what remains
    const ownerForecast = afterManagerPay * (ownerPayoutPct / 100);

    return {
      managerForecast,
      ownerForecast,
      subForecast: totalSubEstimate,
      totalGrossProfit,
    };
  }, [jobs, bids, settings, managerPct, ownerPayoutPct, taxReservePct]);

  const payoutData = [
    {
      entity: "Owner",
      icon: DollarSign,
      actual: actualPayouts.ownerYTD,
      forecasted: forecastedPayouts.ownerForecast,
      color: "border-green-200 bg-green-50",
      textColor: "text-green-700",
    },
    {
      entity: "Business Manager",
      icon: Users,
      actual: actualPayouts.managerYTD,
      forecasted: forecastedPayouts.managerForecast,
      color: "border-blue-200 bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      entity: "Subcontractors",
      icon: Users,
      actual: actualPayouts.subYTD,
      forecasted: forecastedPayouts.subForecast,
      color: "border-purple-200 bg-purple-50",
      textColor: "text-purple-700",
    },
  ];

  const totalActual = actualPayouts.ownerYTD + actualPayouts.managerYTD + actualPayouts.subYTD;
  const totalForecast = forecastedPayouts.ownerForecast + forecastedPayouts.managerForecast + forecastedPayouts.subForecast;

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-amber-900 mb-1">📊 Payout Summary</p>
        <p className="text-xs text-amber-800">
          Shows YTD actual payouts vs. forecasted amounts for upcoming/current jobs. Forecasted owner payout is {ownerPayoutPct}% of net profit after manager pay and reserves.
        </p>
      </div>

      {/* Overall summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-gray-200">
          <p className="text-xs font-semibold text-muted-foreground uppercase">YTD Actual Total</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(totalActual)}</p>
          <p className="text-xs text-muted-foreground mt-1">All payouts this year</p>
        </Card>

        <Card className="p-4 border-gray-200">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Forecasted Total</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(totalForecast)}</p>
          <p className="text-xs text-muted-foreground mt-1">From active & approved bids</p>
        </Card>

        <Card className="p-4 border-gray-200">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Gross Profit (Forecast)</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(forecastedPayouts.totalGrossProfit)}</p>
          <p className="text-xs text-muted-foreground mt-1">Before reserves & distributions</p>
        </Card>
      </div>

      {/* Detailed breakdown */}
      <div className="space-y-3">
        {payoutData.map(item => {
          const Icon = item.icon;
          const combined = item.actual + item.forecasted;
          const forecastedPct = item.forecasted > 0 ? Math.round((item.forecasted / combined) * 100) : 0;
          
          return (
            <Card key={item.entity} className={`p-4 border-2 ${item.color}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded bg-white/50`}>
                    <Icon className={`w-5 h-5 ${item.textColor}`} />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${item.textColor}`}>{item.entity}</p>
                    <div className="text-xs text-muted-foreground mt-2 space-y-1">
                      <p>💰 YTD Actual: <span className="font-semibold text-foreground">{formatCurrency(item.actual)}</span></p>
                      <p>📈 Forecasted: <span className="font-semibold text-foreground">{formatCurrency(item.forecasted)}</span></p>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold">{formatCurrency(combined)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total</p>
                  {item.forecasted > 0 && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {forecastedPct}% forecast
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Note about allocations */}
      <Card className="p-4 bg-gray-50">
        <p className="text-xs font-semibold text-gray-900 mb-2">Payout Allocation Rules</p>
        <div className="text-xs text-gray-700 space-y-1">
          <p>• <strong>Manager Pay:</strong> {managerPct}% of gross profit (taken first)</p>
          <p>• <strong>Tax Reserve:</strong> {taxReservePct}% of gross profit (set aside)</p>
          <p>• <strong>Owner Payout:</strong> {ownerPayoutPct}% of net profit (after manager & reserves)</p>
          <p>• <strong>Subcontractors:</strong> Actual job costs + forecasted labor estimates</p>
        </div>
      </Card>
    </div>
  );
}