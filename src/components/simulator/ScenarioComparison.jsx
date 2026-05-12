import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/formatters";

export default function ScenarioComparison({ scenarios, onDelete }) {
  if (!scenarios || scenarios.length < 2) {
    return (
      <Card className="p-8 text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Save at least 2 scenarios to compare them.</p>
      </Card>
    );
  }

  const comparisonData = scenarios.map(s => ({
    name: s.name?.substring(0, 12),
    profit: s.projection_results?.business_profit || 0,
    revenue: s.projection_results?.business_revenue || 0,
    owner_income: s.projection_results?.owner_income || 0,
    health_score: s.projection_results?.financial_health_score || 0,
  }));

  const metrics = [
    { key: "profit", label: "Profit", formatter: (v) => formatCurrency(v) },
    { key: "revenue", label: "Revenue", formatter: (v) => formatCurrency(v) },
    { key: "owner_income", label: "Owner Income", formatter: (v) => formatCurrency(v) },
    { key: "health_score", label: "Health Score", formatter: (v) => `${v}/100` },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map(m => (
          <Card key={m.key} className="p-4">
            <h3 className="text-sm font-semibold mb-4">{m.label} Comparison</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={v => m.formatter(v)} />
                <Bar dataKey={m.key} fill="#fbbf24" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Scenario Comparison Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Scenario</th>
                <th className="text-right p-2">Revenue</th>
                <th className="text-right p-2">Profit</th>
                <th className="text-right p-2">Owner Income</th>
                <th className="text-right p-2">Health Score</th>
                <th className="text-center p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map(s => (
                <tr key={s.id} className="border-b hover:bg-muted/50">
                  <td className="p-2 font-semibold">{s.name}</td>
                  <td className="text-right p-2">{formatCurrency(s.projection_results?.business_revenue || 0)}</td>
                  <td className="text-right p-2 text-green-600">{formatCurrency(s.projection_results?.business_profit || 0)}</td>
                  <td className="text-right p-2">{formatCurrency(s.projection_results?.owner_income || 0)}</td>
                  <td className="text-right p-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{s.projection_results?.financial_health_score || 0}</span>
                  </td>
                  <td className="text-center p-2">
                    <Button type="button" variant="ghost" size="icon" onClick={() => onDelete(s.id)} aria-label={s.name ? `Delete scenario: ${s.name}` : "Delete scenario"}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}