import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, CheckCircle, TrendingUp, Lightbulb } from "lucide-react";
import { getRiskLevel } from "@/lib/bidIntelligence";
import { formatCurrency } from "@/lib/formatters";

export default function BidIntelligencePanel({ intelligence, onSuggestionsAccept }) {
  if (!intelligence) return null;

  const riskLevel = getRiskLevel(intelligence.riskScore);

  return (
    <div className="space-y-4">
      {/* Risk Score */}
      <Card className={`p-4 ${riskLevel.bg}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Bid Risk Assessment</h3>
          <div className="text-right">
            <p className={`text-3xl font-bold ${riskLevel.color}`}>{intelligence.riskScore}</p>
            <p className={`text-sm ${riskLevel.color}`}>{riskLevel.label}</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${intelligence.riskScore < 35 ? "bg-green-600" : intelligence.riskScore < 60 ? "bg-yellow-600" : "bg-red-600"}`}
            style={{ width: `${intelligence.riskScore}%` }}
          />
        </div>
      </Card>

      {/* Warnings */}
      {intelligence.warnings.length > 0 && (
        <Card className="p-4 space-y-2">
          <p className="font-semibold text-sm">Alerts</p>
          {intelligence.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              {w.type === "high" && <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
              {w.type === "medium" && <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />}
              {w.type === "low" && <Lightbulb className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
              <span className="text-gray-700">{w.message}</span>
            </div>
          ))}
        </Card>
      )}

      {/* Good Signals */}
      {intelligence.insights.filter(i => i.type === "good").length > 0 && (
        <Card className="p-4 space-y-2 bg-green-50">
          <p className="font-semibold text-sm text-green-700">✓ Positive Signals</p>
          {intelligence.insights
            .filter(i => i.type === "good")
            .map((i, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span className="text-green-700">{i.message}</span>
              </div>
            ))}
        </Card>
      )}

      {/* Historical Data Insights */}
      {intelligence.jobStats.jobCount > 0 && (
        <Card className="p-4 space-y-3 bg-blue-50">
          <p className="font-semibold text-sm text-blue-700">📊 Historical Benchmarks</p>
          <div className="space-y-2 text-sm text-blue-700">
            {intelligence.insights
              .filter(i => i.type === "data")
              .map((i, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{i.message}</span>
                  <span className="font-bold">{i.value}</span>
                </div>
              ))}
            <div className="flex justify-between text-xs text-blue-600 pt-2 border-t border-blue-200">
              <span>Based on {intelligence.jobStats.jobCount} similar completed jobs</span>
            </div>
          </div>
        </Card>
      )}

      {/* Suggestions */}
      {Object.keys(intelligence.suggestions).length > 0 && (
        <Card className="p-4 space-y-3 bg-purple-50">
          <p className="font-semibold text-sm text-purple-700">💡 AI Suggestions</p>
          <div className="space-y-2 text-sm text-purple-700">
            {intelligence.suggestions.bidRange && (
              <div>
                <p className="font-semibold mb-1">Recommended Bid Range:</p>
                <div className="ml-2 space-y-1 text-xs">
                  <div>Conservative: {formatCurrency(intelligence.suggestions.bidRange.conservative)}</div>
                  <div className="font-bold">Recommended: {formatCurrency(intelligence.suggestions.bidRange.recommended)}</div>
                  <div>Aggressive: {formatCurrency(intelligence.suggestions.bidRange.aggressive)}</div>
                </div>
              </div>
            )}
            {intelligence.suggestions.materialCost && (
              <div>
                <p>Suggested Material Cost: {formatCurrency(intelligence.suggestions.materialCost)}</p>
              </div>
            )}
            {intelligence.suggestions.laborCost && (
              <div>
                <p>Suggested Labor Cost: {formatCurrency(intelligence.suggestions.laborCost)}</p>
              </div>
            )}
            {intelligence.suggestions.contingency && (
              <div>
                <p>Suggested Contingency: {intelligence.suggestions.contingency.toFixed(1)}%</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Similar Jobs */}
      {intelligence.similarJobs.length > 0 && (
        <Card className="p-4 space-y-3">
          <p className="font-semibold text-sm">Similar Past Projects</p>
          <div className="space-y-2">
            {intelligence.similarJobs.map((job, i) => {
              const revenue = (job.contract_amount || 0) + (job.change_orders_total || 0);
              const cost = (job.material_costs || 0) + (job.labor_costs || 0) + (job.subcontractor_costs || 0);
              const profit = revenue - cost;
              const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;
              return (
                <div key={i} className="p-2 bg-gray-50 rounded-lg text-xs">
                  <p className="font-semibold">{job.title}</p>
                  <div className="flex justify-between text-muted-foreground mt-1">
                    <span>Bid: {formatCurrency(revenue)}</span>
                    <span>Profit: {formatCurrency(profit)} ({margin}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}