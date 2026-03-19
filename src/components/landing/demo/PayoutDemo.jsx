import React from "react";
import { Button } from "@/components/ui/button";

export default function PayoutDemo() {
  const jobRevenue = 41000;
  const jobCosts = 24600;
  const netProfit = jobRevenue - jobCosts;

  const splits = [
    { label: "Tax Reserve", pct: 25, color: "bg-red-400", textColor: "text-red-400" },
    { label: "Owner Payout", pct: 30, color: "bg-green-400", textColor: "text-green-400" },
    { label: "Operating Reserve", pct: 10, color: "bg-blue-400", textColor: "text-blue-400" },
    { label: "Manager Pay", pct: 10, color: "bg-purple-400", textColor: "text-purple-400" },
    { label: "Retained Earnings", pct: 10, color: "bg-yellow-400", textColor: "text-yellow-400" },
  ];

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700">
        <p className="text-sm font-semibold text-white">Payout Engine — Basement Finish Closeout</p>
        <p className="text-xs text-gray-400">Net Profit: <span className="text-green-400 font-bold">${netProfit.toLocaleString()}</span> automatically distributed</p>
      </div>
      <div className="p-4 space-y-3">
        {splits.map(s => {
          const amount = Math.round(netProfit * s.pct / 100);
          return (
            <div key={s.label} className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.color}`} />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{s.label} ({s.pct}%)</span>
                  <span className={`font-bold ${s.textColor}`}>${amount.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct * 2.5}%` }} />
                </div>
              </div>
            </div>
          );
        })}
        <div className="mt-3 pt-3 border-t border-gray-600 text-center">
          <Button className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-sm">
            ✓ Confirm Payout Distribution
          </Button>
        </div>
      </div>
    </div>
  );
}