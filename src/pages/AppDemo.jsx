import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart2, Briefcase, DollarSign, FileText, HardHat, Calculator,
  ChevronDown, ChevronUp, ArrowRight, CheckCircle, Receipt, Camera,
  CalendarDays, RefreshCw, Shield, Wand2, Clock, TrendingUp, AlertTriangle,
  Users, Home, Layers, PieChart, ClipboardList
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockJobs = [
  { id: 1, title: "Kitchen Renovation – 123 Main St", client: "Roberts Family", status: "In Progress", contract: 28500, collected: 14250, costs: 11200, profit: 3050, margin: "10.7%", completion: "Jun 15, 2026" },
  { id: 2, title: "Deck Build – 44 Oak Ave", client: "Thompson LLC", status: "Contracted", contract: 12200, collected: 6100, costs: 4800, profit: 1300, margin: "10.7%", completion: "May 30, 2026" },
  { id: 3, title: "Basement Finish – 8 Maple Ln", client: "Garcia, Maria", status: "Completed", contract: 41000, collected: 41000, costs: 29500, profit: 11500, margin: "28.0%", completion: "Mar 1, 2026" },
  { id: 4, title: "Fence Install – 9 Birch Rd", client: "Nguyen, Thomas", status: "Bidding", contract: 6800, collected: 0, costs: 0, profit: 0, margin: "—", completion: "TBD" },
];

const mockBid = {
  title: "20x30 Concrete Slab – Backyard",
  client: "Johnson, Paul",
  materials: 4200,
  labor: 2800,
  equipment: 600,
  overhead: 760,
  contingency: 380,
  profit: 1710,
  total: 10450,
  margin: "16.4%",
  items: [
    { desc: "Concrete (40 bags @ $6.80)", qty: 40, unit: "$6.80", total: 272 },
    { desc: "Rebar (20 sticks @ $12)", qty: 20, unit: "$12.00", total: 240 },
    { desc: "Form boards (12 @ $8)", qty: 12, unit: "$8.00", total: 96 },
    { desc: "Wire mesh (4 rolls @ $45)", qty: 4, unit: "$45.00", total: 180 },
    { desc: "Gravel base (3 tons @ $85)", qty: 3, unit: "$85.00", total: 255 },
  ],
};

const mockPayout = {
  revenue: 81700,
  costs: 45500,
  gross: 36200,
  taxReserve: 9050,
  operatingReserve: 1810,
  managerPay: 3620,
  ownerDraw: 21720,
};

const mockSubs = [
  { name: "Carlos M.", specialty: "Concrete", ytd: 18400, w9: "Received", jobs: 4, status: "Active" },
  { name: "James T.", specialty: "Framing", ytd: 9200, w9: "Received", jobs: 2, status: "Active" },
  { name: "Mike R.", specialty: "Electrical", ytd: 4100, w9: "Pending", jobs: 1, status: "Active" },
];

const mockReceipts = [
  { desc: "Home Depot — Lumber", category: "Materials", job: "Deck Build – 44 Oak Ave", amount: 842, date: "Apr 10" },
  { desc: "Sunbelt Rentals — Excavator", category: "Equipment", job: "Basement Finish – 8 Maple Ln", amount: 375, date: "Mar 22" },
  { desc: "ABC Supply — Concrete", category: "Materials", job: "Kitchen Renovation – 123 Main St", amount: 512, date: "Apr 18" },
];

const mockChangeOrder = {
  number: "CO-003",
  job: "Kitchen Renovation – 123 Main St",
  title: "Add kitchen island with electrical outlet",
  amount: 2400,
  status: "Pending Approval",
  sentTo: "roberts@email.com",
};

const mockFinancials = {
  cashOnHand: 21450,
  totalRevenue: 81700,
  totalExpenses: 45500,
  netProfit: 36200,
  taxReserve: 9050,
  receivables: 28750,
  overdueBills: 1200,
};

const statusColors = {
  "In Progress": "bg-blue-500/10 text-blue-400 border-blue-400/20",
  "Contracted": "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  "Completed": "bg-green-500/10 text-green-400 border-green-400/20",
  "Bidding": "bg-purple-500/10 text-purple-400 border-purple-400/20",
};

// ─── Section Components ───────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, description, color = "text-yellow-400" }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center shrink-0">
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-sm text-gray-400 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function DemoSection({ id, children }) {
  return (
    <section id={id} className="bg-gray-900 border border-yellow-500/10 rounded-2xl p-6 mb-8">
      {children}
    </section>
  );
}

// ─── Main Demo Page ───────────────────────────────────────────────────────────
export default function AppDemo() {
  const [activeTab, setActiveTab] = useState("jobs");

  const tabs = [
    { id: "jobs", label: "Jobs", icon: Briefcase },
    { id: "bid", label: "Bid Builder", icon: Calculator },
    { id: "payout", label: "Payout Engine", icon: DollarSign },
    { id: "subs", label: "Subcontractors", icon: HardHat },
    { id: "receipts", label: "Expenses", icon: Receipt },
    { id: "changeorders", label: "Change Orders", icon: RefreshCw },
    { id: "financials", label: "Financials", icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-inter">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-3 border-b border-yellow-500/20 bg-black sticky top-0 z-50" style={{ backdropFilter: "blur(8px)" }}>
        <div className="flex items-center gap-3">
          <img
            src="https://media.base44.com/images/public/69b9774720c1d890b1162f57/77973bc53_MikeBuildsBooksLogo.png"
            alt="MikeBuildsBooks"
            className="h-7 w-auto object-contain"
          />
          <span className="text-xs font-medium text-yellow-400 border border-yellow-400/30 px-2 py-0.5 rounded-full">Interactive Demo</span>
        </div>
        <Link to="/Landing">
          <Button size="sm" className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs">
            Get Started <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </nav>

      <main id="main-content" tabIndex={-1} className="outline-none">
      {/* Hero */}
      <div className="text-center px-6 py-12 bg-gradient-to-b from-yellow-500/10 to-transparent">
        <span className="inline-block bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-bold px-4 py-1.5 rounded-full mb-4">
          No login required — explore freely
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">
          See MikeBuildsBooks <span className="text-yellow-400">In Action</span>
        </h1>
        <p className="text-gray-300 max-w-2xl mx-auto text-base mb-8">
          This is a live walkthrough of every major feature — using sample data. Click through the tabs below to explore Jobs, Bids, Financials, Subcontractors, and more.
        </p>

        {/* KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { label: "Total Revenue (YTD)", value: "$81,700", color: "text-green-400" },
            { label: "Net Profit", value: "$36,200", color: "text-yellow-400" },
            { label: "Cash on Hand", value: "$21,450", color: "text-blue-400" },
            { label: "Active Jobs", value: "3", color: "text-purple-400" },
          ].map(k => (
            <div key={k.label} className="bg-gray-900 border border-yellow-500/10 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-gray-400 mt-1">{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Nav */}
      <div className="px-4 sticky top-[57px] z-40 bg-black border-b border-yellow-500/10 overflow-x-auto">
        <div className="flex gap-1 max-w-5xl mx-auto py-2" style={{ minWidth: "max-content" }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === t.id
                  ? "bg-yellow-400 text-black"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── JOBS ── */}
        {activeTab === "jobs" && (
          <div>
            <SectionHeader icon={Briefcase} title="Job Management" description="Track every job from bid to closeout — real-time profit, costs, payments, and status." />
            <div className="space-y-4">
              {mockJobs.map(job => (
                <div key={job.id} className="bg-gray-900 border border-yellow-500/10 rounded-xl p-5 hover:border-yellow-400/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="font-semibold text-white">{job.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{job.client} · Due: {job.completion}</p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusColors[job.status]}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Contract</p>
                      <p className="font-bold text-white">${job.contract.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Collected</p>
                      <p className="font-bold text-yellow-400">${job.collected.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Total Costs</p>
                      <p className="font-bold text-red-400">${job.costs.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Profit</p>
                      <p className={`font-bold ${job.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {job.profit > 0 ? `$${job.profit.toLocaleString()}` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4 text-sm text-gray-300">
              💡 <strong className="text-white">What you can do here:</strong> Create jobs, link clients, upload signed contracts, track receipts, log daily notes, attach photos, and run a full financial closeout when the job is done.
            </div>
          </div>
        )}

        {/* ── BID BUILDER ── */}
        {activeTab === "bid" && (
          <div>
            <SectionHeader icon={Calculator} title="Bid Builder" description="Build accurate, professional bids and convert approved ones to contracts in one click." />
            <div className="bg-gray-900 border border-yellow-500/10 rounded-xl overflow-hidden mb-6">
              <div className="px-5 py-4 border-b border-yellow-500/10 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{mockBid.title}</p>
                  <p className="text-xs text-gray-400">Client: {mockBid.client}</p>
                </div>
                <span className="text-xs font-bold bg-green-500/10 text-green-400 border border-green-400/20 px-3 py-1 rounded-full">Approved</span>
              </div>
              {/* Line Items */}
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Material Line Items</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-800">
                      <th className="text-left pb-2">Description</th>
                      <th className="text-right pb-2">Qty</th>
                      <th className="text-right pb-2">Unit</th>
                      <th className="text-right pb-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockBid.items.map((item, i) => (
                      <tr key={i} className="border-b border-gray-800/50 last:border-0">
                        <td className="py-2 text-gray-300">{item.desc}</td>
                        <td className="py-2 text-right text-gray-400">{item.qty}</td>
                        <td className="py-2 text-right text-gray-400">{item.unit}</td>
                        <td className="py-2 text-right font-medium text-white">${item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Cost Summary */}
              <div className="px-5 py-4 bg-gray-800/50 border-t border-yellow-500/10">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                  {[
                    { label: "Materials", val: mockBid.materials, color: "text-red-400" },
                    { label: "Labor", val: mockBid.labor, color: "text-orange-400" },
                    { label: "Equipment", val: mockBid.equipment, color: "text-blue-400" },
                    { label: "Overhead", val: mockBid.overhead, color: "text-purple-400" },
                  ].map(c => (
                    <div key={c.label} className="bg-gray-900 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-400 mb-1">{c.label}</p>
                      <p className={`font-bold ${c.color}`}>${c.val.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Profit Margin</p>
                    <p className="text-lg font-bold text-green-400">{mockBid.margin}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Total Bid Amount</p>
                    <p className="text-3xl font-extrabold text-yellow-400">${mockBid.total.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 bg-green-500/10 border border-green-400/20 rounded-xl p-4 text-center">
                <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">Convert to Contract</p>
                <p className="text-xs text-gray-400 mt-1">One click — bid becomes a signed contract</p>
              </div>
              <div className="flex-1 bg-blue-500/10 border border-blue-400/20 rounded-xl p-4 text-center">
                <FileText className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">Export as PDF</p>
                <p className="text-xs text-gray-400 mt-1">Branded, professional bid document</p>
              </div>
              <div className="flex-1 bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-4 text-center">
                <Camera className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">Photo-to-Bid AI</p>
                <p className="text-xs text-gray-400 mt-1">Snap a photo, get a full bid</p>
              </div>
            </div>
          </div>
        )}

        {/* ── PAYOUT ENGINE ── */}
        {activeTab === "payout" && (
          <div>
            <SectionHeader icon={DollarSign} title="Payout Engine" description="After every job, automatically calculate where every dollar goes — taxes, owner draw, reserves, manager pay." />
            <div className="bg-gray-900 border border-yellow-500/10 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Gross Profit (YTD)</p>
                  <p className="text-4xl font-extrabold text-white">${mockPayout.gross.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Revenue</p>
                  <p className="text-lg font-bold text-green-400">${mockPayout.revenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">Total Costs</p>
                  <p className="text-lg font-bold text-red-400">${mockPayout.costs.toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Tax Reserve (25%)", val: mockPayout.taxReserve, color: "text-red-400", bg: "bg-red-500/10 border-red-400/20" },
                  { label: "Operating Reserve (5%)", val: mockPayout.operatingReserve, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-400/20" },
                  { label: "Manager Pay (10%)", val: mockPayout.managerPay, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-400/20" },
                  { label: "Owner Draw (60%)", val: mockPayout.ownerDraw, color: "text-green-400", bg: "bg-green-500/10 border-green-400/20" },
                ].map(p => (
                  <div key={p.label} className={`border rounded-xl p-4 text-center ${p.bg}`}>
                    <p className="text-xs text-gray-400 mb-2 leading-tight">{p.label}</p>
                    <p className={`text-2xl font-bold ${p.color}`}>${p.val.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4 text-sm text-gray-300">
              💡 <strong className="text-white">All percentages are configurable</strong> in your Settings. The payout engine calculates automatically based on collected revenue and actual job receipts — no manual math needed.
            </div>
          </div>
        )}

        {/* ── SUBCONTRACTORS ── */}
        {activeTab === "subs" && (
          <div>
            <SectionHeader icon={HardHat} title="Subcontractor Management" description="Track 1099 subs, collect W-9s digitally, and monitor payments and thresholds." />
            <div className="space-y-4 mb-6">
              {mockSubs.map((sub, i) => (
                <div key={i} className="bg-gray-900 border border-yellow-500/10 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-400 font-bold text-sm">
                      {sub.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{sub.name}</p>
                      <p className="text-xs text-gray-400">{sub.specialty} · {sub.jobs} jobs</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">YTD Paid</p>
                      <p className="font-bold text-white">${sub.ytd.toLocaleString()}</p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${sub.w9 === "Received" ? "bg-green-500/10 text-green-400 border-green-400/20" : "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"}`}>
                      W-9: {sub.w9}
                    </span>
                    {sub.ytd >= 600 && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-400/20">
                        1099 Required
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-900 border border-yellow-500/10 rounded-xl p-4">
                <p className="text-sm font-semibold text-white mb-2">W-9 Collection</p>
                <p className="text-xs text-gray-400">Send a digital W-9 link to any subcontractor. They fill it out and sign from any device — no paper, no chasing.</p>
              </div>
              <div className="bg-gray-900 border border-yellow-500/10 rounded-xl p-4">
                <p className="text-sm font-semibold text-white mb-2">1099 Tracking</p>
                <p className="text-xs text-gray-400">Automatically flagged when a sub hits $600 YTD. Export a full 1099 report at year-end for your accountant.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── EXPENSES / RECEIPTS ── */}
        {activeTab === "receipts" && (
          <div>
            <SectionHeader icon={Receipt} title="Expense Receipts" description="Photo receipts tied to specific jobs. Every dollar spent is tracked and counted against job profit." />
            <div className="space-y-3 mb-6">
              {mockReceipts.map((r, i) => (
                <div key={i} className="bg-gray-900 border border-yellow-500/10 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-red-400/10 flex items-center justify-center shrink-0">
                      <Receipt className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{r.desc}</p>
                      <p className="text-xs text-gray-400">{r.job} · {r.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">${r.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{r.category}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-900 border border-yellow-500/10 rounded-xl p-5">
              <p className="text-sm font-semibold text-white mb-3">Expense Summary by Category</p>
              <div className="space-y-2">
                {[
                  { cat: "Materials", amount: 1354, pct: 72 },
                  { cat: "Equipment", amount: 375, pct: 20 },
                  { cat: "Fuel & Tools", amount: 150, pct: 8 },
                ].map(c => (
                  <div key={c.cat} className="flex items-center gap-3">
                    <p className="text-xs text-gray-400 w-20">{c.cat}</p>
                    <div className="flex-1 bg-gray-800 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${c.pct}%` }} />
                    </div>
                    <p className="text-xs font-medium text-white w-14 text-right">${c.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CHANGE ORDERS ── */}
        {activeTab === "changeorders" && (
          <div>
            <SectionHeader icon={RefreshCw} title="Change Orders" description="When scope changes mid-job, create a professional change order and send it for digital client approval." />
            <div className="bg-gray-900 border border-yellow-500/10 rounded-xl overflow-hidden mb-6">
              <div className="px-5 py-4 border-b border-yellow-500/10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white">{mockChangeOrder.number}</p>
                    <span className="text-xs font-bold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-0.5 rounded-full">
                      {mockChangeOrder.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{mockChangeOrder.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Job: {mockChangeOrder.job}</p>
                </div>
                <p className="text-3xl font-extrabold text-green-400">${mockChangeOrder.amount.toLocaleString()}</p>
              </div>
              <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Sent To</p>
                  <p className="text-white font-medium">{mockChangeOrder.sentTo}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Method</p>
                  <p className="text-white font-medium">Email Link</p>
                </div>
                <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">When Approved</p>
                  <p className="text-green-400 font-medium">Auto-added to contract</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4 text-sm text-gray-300">
              💡 Client receives an email with a link. They read the change order, type their name to sign, and click Approve. The dollar amount is automatically added to the original contract total — no paper, no back-and-forth.
            </div>
          </div>
        )}

        {/* ── FINANCIALS ── */}
        {activeTab === "financials" && (
          <div>
            <SectionHeader icon={BarChart2} title="Business Financial Dashboard" description="Full picture of revenue, expenses, profit, reserves, and cash flow — in real time." />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {[
                { label: "Total Revenue (YTD)", val: `$${mockFinancials.totalRevenue.toLocaleString()}`, color: "text-green-400" },
                { label: "Total Expenses", val: `$${mockFinancials.totalExpenses.toLocaleString()}`, color: "text-red-400" },
                { label: "Net Profit", val: `$${mockFinancials.netProfit.toLocaleString()}`, color: "text-yellow-400" },
                { label: "Cash on Hand", val: `$${mockFinancials.cashOnHand.toLocaleString()}`, color: "text-blue-400" },
                { label: "Outstanding Receivables", val: `$${mockFinancials.receivables.toLocaleString()}`, color: "text-orange-400" },
                { label: "Overdue Bills", val: `$${mockFinancials.overdueBills.toLocaleString()}`, color: "text-red-500" },
              ].map(k => (
                <div key={k.label} className="bg-gray-900 border border-yellow-500/10 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">{k.label}</p>
                  <p className={`text-2xl font-bold ${k.color}`}>{k.val}</p>
                </div>
              ))}
            </div>

            {/* Health Score */}
            <div className="bg-gray-900 border border-yellow-500/10 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white">Financial Health Score</p>
                <p className="text-2xl font-extrabold text-green-400">82 / 100</p>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3 mb-3">
                <div className="bg-green-400 h-3 rounded-full" style={{ width: "82%" }} />
              </div>
              <p className="text-xs text-green-400 font-semibold">✅ Healthy — business is profitable, cash is sufficient, no critical alerts.</p>
            </div>

            {/* Alerts */}
            <div className="bg-gray-900 border border-yellow-500/10 rounded-xl p-5">
              <p className="text-sm font-semibold text-white mb-3">Financial Alerts</p>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-400/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">$1,200 in overdue bills — pay these to protect vendor relationships.</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-300">Mike R. (Electrical sub) W-9 is still pending. Request before next payment.</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-400/20 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-green-300">Tax reserve is funded. You have $9,050 set aside — you're on track for year-end.</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Bottom CTA */}
      <div className="bg-yellow-400 text-black text-center px-6 py-14 mt-8">
        <h2 className="text-3xl font-extrabold mb-3">Ready to Run Your Business This Way?</h2>
        <p className="text-black/75 mb-6 max-w-xl mx-auto">Everything you just saw is fully functional in your account. Start free — no credit card required.</p>
        <Link to="/Landing">
          <Button size="lg" className="bg-black hover:bg-gray-900 text-yellow-400 font-bold px-10 py-4 h-auto text-base">
            Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
      </main>
    </div>
  );
}