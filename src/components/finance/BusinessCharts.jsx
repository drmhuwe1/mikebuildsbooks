import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/formatters";

const COLORS = ["#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444","#f97316","#06b6d4","#84cc16"];

function fmt(v) { return "$" + (v >= 1000 ? (v/1000).toFixed(1) + "k" : Math.round(v)); }

export default function BusinessCharts({ jobs = [], bills = [], txns = [] }) {
  // Monthly revenue/expense from jobs grouped by start_date
  const monthlyData = useMemo(() => {
    const map = {};
    jobs.forEach(j => {
      const m = (j.start_date || j.created_date || "").slice(0, 7);
      if (!m) return;
      if (!map[m]) map[m] = { month: m, revenue: 0, expenses: 0, profit: 0 };
      map[m].revenue += (j.contract_amount || 0) + (j.change_orders_total || 0);
      map[m].expenses += (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0);
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-12).map(d => ({
      ...d,
      profit: d.revenue - d.expenses,
      month: new Date(d.month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    }));
  }, [jobs]);

  // Expense category breakdown from jobs
  const expenseBreakdown = useMemo(() => {
    const cats = { Materials: 0, Labor: 0, Subcontractors: 0, Permits: 0, Equipment: 0, Overhead: 0, Other: 0 };
    jobs.forEach(j => {
      cats.Materials += j.material_costs || 0;
      cats.Labor += j.labor_costs || 0;
      cats.Subcontractors += j.subcontractor_costs || 0;
      cats.Permits += j.permit_costs || 0;
      cats.Equipment += j.equipment_costs || 0;
      cats.Overhead += j.overhead_costs || 0;
      cats.Other += j.other_costs || 0;
    });
    return Object.entries(cats).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [jobs]);

  // Job profitability
  const jobProfit = useMemo(() =>
    jobs.slice(0, 10).map(j => {
      const rev = (j.contract_amount || 0) + (j.change_orders_total || 0);
      const exp = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0);
      return { name: j.title?.slice(0, 14) || "Job", profit: rev - exp, revenue: rev };
    }), [jobs]);

  // Inflow vs outflow
  const cashFlow = useMemo(() => {
    const map = {};
    txns.forEach(t => {
      const m = (t.date || "").slice(0, 7);
      if (!m) return;
      if (!map[m]) map[m] = { month: m, inflow: 0, outflow: 0 };
      if (t.type === "inflow") map[m].inflow += t.amount || 0;
      else map[m].outflow += t.amount || 0;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-6).map(d => ({
      ...d, month: new Date(d.month + "-01").toLocaleDateString("en-US", { month: "short" })
    }));
  }, [txns]);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Monthly Revenue & Expenses */}
      <Card className="p-4">
        <p className="text-sm font-semibold mb-3">Monthly Revenue vs Expenses</p>
        {monthlyData.length === 0 ? <p className="text-xs text-muted-foreground py-8 text-center">No job data yet</p> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[3,3,0,0]} />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Monthly Profit */}
      <Card className="p-4">
        <p className="text-sm font-semibold mb-3">Monthly Profit Trend</p>
        {monthlyData.length === 0 ? <p className="text-xs text-muted-foreground py-8 text-center">No job data yet</p> : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Line type="monotone" dataKey="profit" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Expense Breakdown */}
      <Card className="p-4">
        <p className="text-sm font-semibold mb-3">Expense Category Breakdown</p>
        {expenseBreakdown.length === 0 ? <p className="text-xs text-muted-foreground py-8 text-center">No expense data yet</p> : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {expenseBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Job Profitability */}
      <Card className="p-4">
        <p className="text-sm font-semibold mb-3">Job Profitability (Top 10)</p>
        {jobProfit.length === 0 ? <p className="text-xs text-muted-foreground py-8 text-center">No jobs yet</p> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={jobProfit} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={80} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Bar dataKey="profit" fill="#f59e0b" name="Profit" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Cash Inflow vs Outflow */}
      <Card className="p-4 md:col-span-2">
        <p className="text-sm font-semibold mb-3">Cash Inflow vs Outflow (Last 6 Months)</p>
        {cashFlow.length === 0 ? <p className="text-xs text-muted-foreground py-8 text-center">No transaction data yet</p> : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={cashFlow}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="inflow" fill="#10b981" name="Inflow" radius={[3,3,0,0]} />
              <Bar dataKey="outflow" fill="#ef4444" name="Outflow" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Itemized Expense Details Table */}
      <Card className="p-4 md:col-span-2">
        <p className="text-sm font-semibold mb-3">Itemized Job Expenses</p>
        {jobs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">No job data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="text-left p-2 font-semibold">Job</th>
                  <th className="text-right p-2 font-semibold">Materials</th>
                  <th className="text-right p-2 font-semibold">Labor</th>
                  <th className="text-right p-2 font-semibold">Subcontractors</th>
                  <th className="text-right p-2 font-semibold">Permits</th>
                  <th className="text-right p-2 font-semibold">Equipment</th>
                  <th className="text-right p-2 font-semibold">Overhead</th>
                  <th className="text-right p-2 font-semibold">Other</th>
                  <th className="text-right p-2 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j, i) => {
                  const total = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0);
                  return (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-2">{j.title?.slice(0, 20)}</td>
                      <td className="text-right p-2">${(j.material_costs || 0).toLocaleString()}</td>
                      <td className="text-right p-2">${(j.labor_costs || 0).toLocaleString()}</td>
                      <td className="text-right p-2">${(j.subcontractor_costs || 0).toLocaleString()}</td>
                      <td className="text-right p-2">${(j.permit_costs || 0).toLocaleString()}</td>
                      <td className="text-right p-2">${(j.equipment_costs || 0).toLocaleString()}</td>
                      <td className="text-right p-2">${(j.overhead_costs || 0).toLocaleString()}</td>
                      <td className="text-right p-2">${(j.other_costs || 0).toLocaleString()}</td>
                      <td className="text-right p-2 font-semibold text-red-600">${total.toLocaleString()}</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-gray-300 bg-red-50 font-bold">
                  <td className="p-2">Total Expenses</td>
                  <td className="text-right p-2">${jobs.reduce((s, j) => s + (j.material_costs || 0), 0).toLocaleString()}</td>
                  <td className="text-right p-2">${jobs.reduce((s, j) => s + (j.labor_costs || 0), 0).toLocaleString()}</td>
                  <td className="text-right p-2">${jobs.reduce((s, j) => s + (j.subcontractor_costs || 0), 0).toLocaleString()}</td>
                  <td className="text-right p-2">${jobs.reduce((s, j) => s + (j.permit_costs || 0), 0).toLocaleString()}</td>
                  <td className="text-right p-2">${jobs.reduce((s, j) => s + (j.equipment_costs || 0), 0).toLocaleString()}</td>
                  <td className="text-right p-2">${jobs.reduce((s, j) => s + (j.overhead_costs || 0), 0).toLocaleString()}</td>
                  <td className="text-right p-2">${jobs.reduce((s, j) => s + (j.other_costs || 0), 0).toLocaleString()}</td>
                  <td className="text-right p-2 text-red-700">${jobs.reduce((s, j) => s + ((j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0)), 0).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}