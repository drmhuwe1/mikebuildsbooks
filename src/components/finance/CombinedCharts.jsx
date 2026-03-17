import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/formatters";

function fmt(v) { return "$" + (v >= 1000 ? (v/1000).toFixed(1) + "k" : Math.round(v)); }

export default function CombinedCharts({ jobs = [], txns = [], personalBills = [] }) {
  // Owner distributions by month
  const drawsByMonth = useMemo(() => {
    const map = {};
    txns.filter(t => t.category === "owner_draw").forEach(t => {
      const m = (t.date || "").slice(0, 7);
      if (!m) return;
      if (!map[m]) map[m] = { month: m, draws: 0, bizCash: 0 };
      map[m].draws += t.amount || 0;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-6).map(d => ({
      ...d, month: new Date(d.month + "-01").toLocaleDateString("en-US", { month: "short" })
    }));
  }, [txns]);

  // Combined net position trend
  const combinedTrend = useMemo(() => {
    const months = [...new Set([
      ...txns.map(t => (t.date || "").slice(0, 7)),
      ...personalBills.map(b => (b.due_date || "").slice(0, 7))
    ])].filter(Boolean).sort().slice(-6);

    return months.map(m => {
      const bizIn = txns.filter(t => t.type === "inflow" && (t.date || "").startsWith(m)).reduce((s, t) => s + (t.amount || 0), 0);
      const bizOut = txns.filter(t => t.type === "outflow" && (t.date || "").startsWith(m)).reduce((s, t) => s + (t.amount || 0), 0);
      const personalOut = personalBills.filter(b => (b.due_date || "").startsWith(m) && b.status === "paid").reduce((s, b) => s + (b.amount || 0), 0);
      return {
        month: new Date(m + "-01").toLocaleDateString("en-US", { month: "short" }),
        bizNet: bizIn - bizOut,
        personalNet: bizIn - bizOut - personalOut,
      };
    });
  }, [txns, personalBills]);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-4">
        <p className="text-sm font-semibold mb-3">Owner Distributions by Month</p>
        {drawsByMonth.length === 0 ? <p className="text-xs text-muted-foreground py-8 text-center">No draw data yet. Log transactions with category "owner_draw".</p> : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={drawsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Bar dataKey="draws" fill="#8b5cf6" name="Owner Draw" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="p-4">
        <p className="text-sm font-semibold mb-3">Combined Net Position Trend</p>
        {combinedTrend.length === 0 ? <p className="text-xs text-muted-foreground py-8 text-center">No data yet</p> : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={combinedTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="bizNet" stroke="#10b981" strokeWidth={2} name="Business Net" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="personalNet" stroke="#3b82f6" strokeWidth={2} name="After Personal" dot={{ r: 3 }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}