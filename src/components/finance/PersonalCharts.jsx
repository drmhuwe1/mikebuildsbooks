import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/formatters";

const COLORS = ["#3b82f6","#f59e0b","#10b981","#ef4444","#8b5cf6","#f97316","#06b6d4","#ec4899"];
function fmt(v) { return "$" + (v >= 1000 ? (v/1000).toFixed(1) + "k" : Math.round(v)); }

export default function PersonalCharts({ personalBills = [], txns = [] }) {
  // Spending by category
  const categorySpend = useMemo(() => {
    const map = {};
    personalBills.filter(b => b.status === "paid").forEach(b => {
      const cat = b.category || "other";
      map[cat] = (map[cat] || 0) + (b.amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [personalBills]);

  // Monthly income vs spending
  const monthlyFlow = useMemo(() => {
    const map = {};
    txns.filter(t => t.category === "owner_draw").forEach(t => {
      const m = (t.date || "").slice(0, 7);
      if (!m) return;
      if (!map[m]) map[m] = { month: m, income: 0, spending: 0 };
      if (t.type === "inflow") map[m].income += t.amount || 0;
    });
    personalBills.filter(b => b.status === "paid").forEach(b => {
      const m = (b.paid_date || b.due_date || "").slice(0, 7);
      if (!m) return;
      if (!map[m]) map[m] = { month: m, income: 0, spending: 0 };
      map[m].spending += b.amount || 0;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-6).map(d => ({
      ...d, month: new Date(d.month + "-01").toLocaleDateString("en-US", { month: "short" })
    }));
  }, [txns, personalBills]);

  // Savings growth
  const savingsData = useMemo(() => {
    let running = 0;
    return personalBills.filter(b => b.category === "savings" && b.status === "paid")
      .sort((a, b) => (a.paid_date || a.due_date || "").localeCompare(b.paid_date || b.due_date || ""))
      .map(b => {
        running += b.amount || 0;
        return { date: (b.paid_date || b.due_date || "").slice(0, 7), savings: running };
      });
  }, [personalBills]);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-4">
        <p className="text-sm font-semibold mb-3">Personal Income vs Spending</p>
        {monthlyFlow.length === 0 ? <p className="text-xs text-muted-foreground py-8 text-center">No data yet</p> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyFlow}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="income" fill="#10b981" name="Income" radius={[3,3,0,0]} />
              <Bar dataKey="spending" fill="#ef4444" name="Spending" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="p-4">
        <p className="text-sm font-semibold mb-3">Personal Spending by Category</p>
        {categorySpend.length === 0 ? <p className="text-xs text-muted-foreground py-8 text-center">No paid bills yet</p> : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categorySpend} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                {categorySpend.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="p-4 md:col-span-2">
        <p className="text-sm font-semibold mb-3">Savings Growth Over Time</p>
        {savingsData.length === 0 ? <p className="text-xs text-muted-foreground py-8 text-center">No savings recorded yet</p> : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={savingsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Savings" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}