import React, { useState, Suspense, lazy } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart2, FileText, DollarSign, Briefcase, CheckCircle } from "lucide-react";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart2 },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "bid", label: "Bid Builder", icon: FileText },
  { id: "payout", label: "Payout Engine", icon: DollarSign },
];

// Lazy-load chart components only when demo tab is clicked
const DashboardDemo = lazy(() => import("./demo/DashboardDemo"));
const JobsDemo = lazy(() => import("./demo/JobsDemo"));
const BidDemo = lazy(() => import("./demo/BidDemo"));
const PayoutDemo = lazy(() => import("./demo/PayoutDemo"));

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
        <div className="flex gap-2 mb-4 bg-gray-900 p-1.5 rounded-xl border border-gray-800 overflow-x-auto md:overflow-x-visible">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${
                activeTab === tab.id
                  ? "bg-yellow-400 text-black"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Demo content - lazy loaded per tab */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 min-h-[380px]">
          <Suspense fallback={<div className="text-center text-gray-400 py-10">Loading demo...</div>}>
            {DEMO_CONTENT[activeTab]}
          </Suspense>
        </div>

        <p className="text-center text-gray-500 text-xs mt-4">
          This is a live preview with sample data. Sign up to use it with your real business data.
        </p>
      </div>
    </section>
  );
}