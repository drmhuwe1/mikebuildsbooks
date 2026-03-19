import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const revenueData = [
  { month: "Oct", revenue: 38000, costs: 24000 },
  { month: "Nov", revenue: 52000, costs: 31000 },
  { month: "Dec", revenue: 29000, costs: 18000 },
  { month: "Jan", revenue: 61000, costs: 38000 },
  { month: "Feb", revenue: 74000, costs: 44000 },
  { month: "Mar", revenue: 58000, costs: 35000 },
];

export default function DashboardDemo() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Cash on Hand", value: "$47,320", sub: "Business checking", color: "text-green-400" },
          { label: "Tax Reserve", value: "$14,250", sub: "Set aside this year", color: "text-red-400" },
          { label: "Active Jobs", value: "4", sub: "2 in progress", color: "text-yellow-400" },
          { label: "Pending Bills", value: "$8,640", sub: "Due in 14 days", color: "text-orange-400" },
        ].map(s => (
          <div key={s.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <p className="text-xs text-gray-400 mb-3">Revenue vs. Costs (Last 6 Months)</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={revenueData} barGap={4}>
            <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
            <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, ""]} contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }} />
            <Bar dataKey="revenue" fill="#facc15" radius={[4, 4, 0, 0]} name="Revenue" />
            <Bar dataKey="costs" fill="#374151" radius={[4, 4, 0, 0]} name="Costs" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}