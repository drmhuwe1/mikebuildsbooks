import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";

/**
 * Job-based payout engine:
 * - Step 1: Record total contract value and estimated job costs
 * - Step 2: Calculate estimated gross profit and profit margin
 * - Step 3: When payment received, determine profit portion using job margin
 * - Step 4: Distribute profit: tax reserve, manager pay, business reserve, rest to owner
 */
export default function PayoutProjection({ bid = {}, settings = {}, totalCostOverride = null }) {
  const projection = useMemo(() => {
    const bidAmount = bid.bid_amount || 0;
    
    let totalCost;
    if (totalCostOverride !== null) {
      totalCost = totalCostOverride;
    } else {
      // Step 1 & 2: Calculate gross profit from bid
      const directCosts = 
        (bid.material_cost || 0) + 
        (bid.labor_hours || 0) * (bid.labor_rate || 0) + 
        (bid.subcontractor_cost || 0) + 
        (bid.permit_cost || 0) + 
        (bid.equipment_cost || 0);
      
      const overhead = directCosts * ((bid.overhead_percent || 10) / 100);
      const contingency = directCosts * ((bid.contingency_percent || 5) / 100);
      totalCost = directCosts + overhead + contingency;
    }
    const grossProfit = Math.max(0, bidAmount - totalCost);
    
    // Step 3 & 4: Distribute profit according to settings
    const taxReservePct = settings.tax_reserve_percent ?? 25;
    const managerPayPct = settings.manager_pay_percent ?? 10;
    const businessReservePct = settings.business_reserve_percent ?? 5;
    
    const taxReserve = grossProfit * (taxReservePct / 100);
    const managerPay = grossProfit * (managerPayPct / 100);
    const businessBuffer = grossProfit * (businessReservePct / 100);
    const ownerPayout = Math.max(0, grossProfit - taxReserve - managerPay - businessBuffer);
    
    return {
      bidAmount,
      totalCost,
      grossProfit,
      breakdown: {
        taxReserve,
        managerPay,
        businessBuffer,
        ownerPayout,
      },
      profitMargin: bidAmount > 0 ? ((grossProfit / bidAmount) * 100).toFixed(1) : 0,
      taxReservePct,
      managerPayPct,
      businessReservePct,
    };
  }, [bid, settings]);

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-green-900 mb-3">💰 Expected Owner Income Projection</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-800">Total Bid Amount:</span>
            <span className="font-bold text-green-900">{formatCurrency(projection.bidAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-800">Total Job Costs:</span>
            <span className="font-bold text-green-900">{formatCurrency(projection.totalCost)}</span>
          </div>
          <div className="flex items-center justify-between text-sm border-t border-green-200 pt-2 mb-2">
            <span className="font-semibold text-green-900">Gross Profit ({projection.profitMargin}%):</span>
            <span className="text-lg font-bold text-green-900">{formatCurrency(projection.grossProfit)}</span>
          </div>
          <div className="text-xs text-green-700 bg-white/50 p-1.5 rounded">
            This gross profit will be distributed as:
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-blue-900 mb-4">📊 Profit Distribution Breakdown</p>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between bg-white p-2 rounded border border-blue-100">
            <div>
              <p className="text-sm font-semibold text-blue-900">Owner Income (yours)</p>
              <p className="text-xs text-blue-700">Remaining after reserves & compensation</p>
            </div>
            <p className="text-lg font-bold text-blue-900">{formatCurrency(projection.breakdown.ownerPayout)}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-amber-50 p-2.5 rounded border border-amber-200">
              <p className="text-xs font-semibold text-amber-900">Tax Reserve</p>
              <p className="text-xs text-amber-700 mb-1">{projection.taxReservePct}% of profit</p>
              <p className="text-sm font-bold text-amber-900">{formatCurrency(projection.breakdown.taxReserve)}</p>
            </div>

            <div className="bg-purple-50 p-2.5 rounded border border-purple-200">
              <p className="text-xs font-semibold text-purple-900">Manager Pay</p>
              <p className="text-xs text-purple-700 mb-1">{projection.managerPayPct}% of profit</p>
              <p className="text-sm font-bold text-purple-900">{formatCurrency(projection.breakdown.managerPay)}</p>
            </div>

            <div className="bg-orange-50 p-2.5 rounded border border-orange-200">
              <p className="text-xs font-semibold text-orange-900">Bus. Reserve</p>
              <p className="text-xs text-orange-700 mb-1">{projection.businessReservePct}% of profit</p>
              <p className="text-sm font-bold text-orange-900">{formatCurrency(projection.breakdown.businessBuffer)}</p>
            </div>
          </div>

          <div className="bg-green-50 p-2.5 rounded border border-green-200">
            <p className="text-xs font-semibold text-green-900">Expected Owner Payout</p>
            <p className="text-lg font-bold text-green-900">{formatCurrency(projection.breakdown.ownerPayout)}</p>
            <p className="text-xs text-green-700 mt-1">Distributed at job completion or on schedule</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700 space-y-1.5">
        <p className="font-semibold text-gray-900">How This Works:</p>
        <ul className="space-y-1 ml-3">
          <li>• <strong>Tax Reserve</strong> ({projection.taxReservePct}%): Held for owner's personal income tax at year-end</li>
          <li>• <strong>Manager Compensation</strong> ({projection.managerPayPct}%): Business manager's 1099 payment</li>
          <li>• <strong>Business Reserve</strong> ({projection.businessReservePct}%): Operating cash reserves for business account</li>
          <li>• <strong>Owner Payout</strong> (remainder): Your profit after reserves & compensation</li>
        </ul>
      </div>
    </div>
  );
}