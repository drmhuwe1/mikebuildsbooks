import React from "react";
import { Card } from "@/components/ui/card";
import { calculateBusinessHealthScore, getBusinessHealthStatus } from "@/lib/businessHealthCalculations";

export default function BusinessHealthScoreCard({ jobs, bills, personalBills, bankAccounts, settings }) {
  const score = calculateBusinessHealthScore(jobs, bills, personalBills, bankAccounts, settings);
  const status = getBusinessHealthStatus(score);

  return (
    <Card className={`p-6 ${status.bg}`}>
      <p className="text-sm text-gray-600 mb-2">Business Health Score</p>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-5xl font-bold ${status.color}`}>{score}</p>
          <p className={`text-sm font-medium ${status.color} mt-1`}>{status.label}</p>
        </div>
        <div className="w-24 h-24 rounded-full bg-white/50 flex items-center justify-center relative">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" stroke="#e5e7eb" strokeWidth="3" fill="none" />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeDasharray={`${(score / 100) * 282.7} 282.7`}
              className={status.color}
            />
          </svg>
        </div>
      </div>
    </Card>
  );
}