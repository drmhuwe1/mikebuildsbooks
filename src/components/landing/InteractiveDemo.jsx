import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart2, FileText, DollarSign, Briefcase } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart2 },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "bid", label: "Bid Builder", icon: FileText },
  { id: "payout", label: "Payout Engine", icon: DollarSign },
];

const revenueData = [
  { month: "Oct", revenue: 38000, costs: 24000 },
  { month: "Nov", revenue: 52000, costs: 31000 },
  { month: "Dec", revenue: 29000, costs: 18000 },
  { month: "Jan", revenue: 61000, costs: 38000 },
  { month: "Feb", revenue: 74000, costs: 44000 },
  { month: "Mar", revenue: 58000, costs: 35000 },
];

const jobs = [
  { name: "Kitchen Remodel – 123 Main St", client: "Roberts Family", revenue: 28500, cost: 17200, profit: 11300, status: "In Progress", margin: "39.6%" },
  { name: "Deck Build – 44 Oak Ave", client: "Hobie Minick", revenue: 12200, cost: 7800, profit: 4400, status: "Contracted", margin: "36.1%" },
  { name: "Basement Finish – 8 Maple Ln", client: "Andy Huwe", revenue: 41000, cost: 24600, profit: 16400, status: "Completed", margin: "40.0%" },
  { name: "Roof Replacement – 77 Pine Dr", client: "Darlene Eves", revenue: 19800, cost: 12300, profit: 7500, status: "Bidding", margin: "37.9%" },
];

const statusColors = {
  "In Progress": "bg-yellow-100 text-yellow-700",
  "Contracted": "bg-blue-100 text-blue-700",
  "Completed": "bg-green-100 text-green-700",
  "Bidding": "bg-purple-100 text-purple-700",
};

function DashboardDemo() {
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

function JobsDemo() {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Active Jobs (4)</p>
        <Button size="sm" className="bg-yellow-400 text-black text-xs h-7 font-bold">+ New Job</Button>
      </div>
      <div className="divide-y divide-gray-700">
        {jobs.map((job, i) => (
          <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-gray-700/50 transition-colors">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{job.name}</p>
              <p className="text-xs text-gray-400">{job.client}</p>
            </div>
            <div className="flex items-center gap-4 ml-4 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-green-400">${job.profit.toLocaleString()}</p>
                <p className="text-xs text-gray-500">profit ({job.margin})</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[job.status]}`}>{job.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BidDemo() {
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

function PayoutDemo() {
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

const DEMO_CONTENT = {
  dashboard: <DashboardDemo />,
  jobs: <JobsDemo />,
  bid: <BidDemo />,
  payout: <PayoutDemo />,
};

export default function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <section id="demo" className="px-6 py-20 bg-gray-950">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <Badge className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 mb-4">Interactive Demo</Badge>
          <h2 className="text-3xl font-bold mb-3">See It In Action</h2>
          <p className="text-gray-400 max-w-xl mx-auto">Click through the tabs below to explore real features. This is exactly what you'll see inside the app.</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-4 bg-gray-900 p-1.5 rounded-xl border border-gray-800 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? "bg-yellow-400 text-black"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Demo content */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 min-h-[380px]">
          {DEMO_CONTENT[activeTab]}
        </div>

        <p className="text-center text-gray-500 text-xs mt-4">
          This is a live preview with sample data. Sign up to use it with your real business data.
        </p>
      </div>
    </section>
  );
}