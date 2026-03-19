import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

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

export default function JobsDemo() {
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