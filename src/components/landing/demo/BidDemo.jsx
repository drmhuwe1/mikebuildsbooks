import React, { useState } from "react";

export default function BidDemo() {
  const [margin, setMargin] = useState(22);
  const materials = 8400;
  const labor = 5200;
  const subs = 3100;
  const overhead = Math.round((materials + labor + subs) * 0.1);
  const total = materials + labor + subs + overhead;
  const bidAmount = Math.round(total / (1 - margin / 100));
  const profit = bidAmount - total;

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700">
        <p className="text-sm font-semibold text-white">Bid Builder — Kitchen Remodel</p>
        <p className="text-xs text-gray-400">Auto-calculates bid price from your cost inputs</p>
      </div>
      <div className="p-4 space-y-3">
        {[
          { label: "Materials", value: materials, color: "bg-blue-500" },
          { label: "Labor (116 hrs @ $45)", value: labor, color: "bg-yellow-500" },
          { label: "Subcontractors", value: subs, color: "bg-purple-500" },
          { label: "Overhead (10%)", value: overhead, color: "bg-gray-500" },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${row.color}`} />
              <span className="text-gray-300">{row.label}</span>
            </div>
            <span className="text-white font-medium">${row.value.toLocaleString()}</span>
          </div>
        ))}
        <div className="border-t border-gray-600 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Profit Margin</span>
            <div className="flex items-center gap-2">
              <input
                type="range" min="10" max="40" value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-24 accent-yellow-400"
              />
              <span className="text-yellow-400 font-bold text-sm w-10 text-right">{margin}%</span>
            </div>
          </div>
          <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400">Bid Amount</p>
              <p className="text-2xl font-extrabold text-yellow-400">${bidAmount.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Net Profit</p>
              <p className="text-xl font-bold text-green-400">${profit.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}