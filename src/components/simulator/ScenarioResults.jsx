import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function ScenarioResults({ results, baseline, insights }) {
  if (!results) return null;

  const businessProfitDiff = results.business_profit - (baseline?.gross_profit || 0);
  const ownerIncomeDiff = results.owner_income - (baseline?.owner_income || 0);
  const healthScoreDiff = results.financial_health_score - 50;

  const resultCard = (label, value, change, isCurrency = true) => (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-bold">{isCurrency ? formatCurrency(value) : `${value}%`}</p>
      {change !== undefined && (
        <div className={`text-xs mt-1 flex items-center gap-1 ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
          {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change >= 0 ? "+" : ""}{isCurrency ? formatCurrency(change) : `${change}%`}
        </div>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Business Impact</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {resultCard("Projected Revenue", results.business_revenue)}
          {resultCard("Projected Expenses", results.business_expenses)}
          {resultCard("Projected Profit", results.business_profit, businessProfitDiff)}
          {resultCard("Profit Margin", results.profit_margin_percent, null, false)}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Cash Flow & Reserves</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {resultCard("Cash Flow Impact", results.cash_flow_impact)}
          {resultCard("Tax Reserve", results.tax_reserve_amount)}
          {resultCard("Jobs Per Month", results.jobs_per_month, null, false)}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Owner Personal Impact</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {resultCard("Projected Owner Income", results.owner_income, ownerIncomeDiff)}
          {resultCard("Personal Cash Flow", results.personal_cash_flow)}
          {resultCard("Savings Rate", results.personal_savings_rate, null, false)}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Financial Health</h3>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Overall Financial Health Score</p>
              <div className="text-4xl font-bold text-primary">{results.financial_health_score}</div>
              <p className="text-xs text-muted-foreground mt-1">Out of 100</p>
            </div>
            <div className="flex-1">
              <div className="w-full bg-muted rounded-full h-3">
                <div className="bg-primary rounded-full h-3" style={{ width: `${Math.min(100, results.financial_health_score)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {results.financial_health_score >= 75 ? "✓ Excellent" : results.financial_health_score >= 50 ? "△ Good" : "⚠ Needs attention"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {insights && insights.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">AI Insights & Recommendations</h3>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${
                insight.type === "positive" ? "bg-green-50 border border-green-200" :
                insight.type === "warning" ? "bg-yellow-50 border border-yellow-200" :
                "bg-blue-50 border border-blue-200"
              }`}>
                {insight.type === "positive" ? <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> :
                 insight.type === "warning" ? <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" /> :
                 <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />}
                <p className="text-xs text-gray-700">{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}