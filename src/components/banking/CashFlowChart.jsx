import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts";
import { formatCurrency } from "@/lib/formatters";

export default function CashFlowChart({ transactions = [] }) {
  const data = useMemo(() => {
    const grouped = {};

    transactions.forEach(t => {
      const date = t.date ? t.date.slice(0, 7) : "unknown"; // YYYY-MM
      if (!grouped[date]) {
        grouped[date] = { month: date, income: 0, expense: 0 };
      }
      if (t.type === "inflow") {
        grouped[date].income += t.amount || 0;
      } else {
        grouped[date].expense += t.amount || 0;
      }
    });

    return Object.values(grouped)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(item => ({
        ...item,
        netFlow: item.income - item.expense,
      }));
  }, [transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Monthly Cash Flow</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
              <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="netFlow"
                stroke="#3b82f6"
                name="Net Flow"
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}