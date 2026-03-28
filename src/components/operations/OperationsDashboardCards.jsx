import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, CheckCircle, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import MetricDrillDownModal from "@/components/operations/MetricDrillDownModal";

export default function OperationsDashboardCards({ jobs, contracts = [], bills, personalBills, bankAccounts, payments = [] }) {
  const [modal, setModal] = useState(null);

  const today = new Date().toISOString().split("T")[0];
  const monthStart = new Date(new Date().setDate(1)).toISOString().split("T")[0];

  const activeJobs = jobs.filter(j => ["bidding", "contracted", "in_progress"].includes(j.status));
  const awaitingPayment = contracts.filter(c => c.status !== "completed" && c.status !== "cancelled" && (c.contract_amount || 0) > (c.client_paid_amount || 0));

  // Jobs are single source of truth for revenue — sum all total_paid_by_customer
  const monthlyRevenue = jobs.reduce((s, j) => s + (j.total_paid_by_customer || 0), 0);

  const monthlyJobs = jobs.filter(j => j.created_date >= monthStart);
  const monthlyBills = bills.filter(b => b.created_date >= monthStart);

  const jobExpenses = monthlyJobs.reduce((s, j) =>
    s + ((j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0)), 0);
  const businessBillsTotal = monthlyBills.reduce((s, b) => s + (b.amount || 0), 0);
  const monthlyExpenses = jobExpenses + businessBillsTotal;
  const monthlyProfit = monthlyRevenue - monthlyExpenses;

  const totalBankBalance = bankAccounts.reduce((s, a) => s + (a.current_balance || 0), 0);
  const overdueBills = (bills || []).filter(b => b.status !== "paid" && b.due_date < today).length;

  const buildRevenueItems = () => {
    const items = jobs
      .filter(j => (j.total_paid_by_customer || 0) > 0)
      .map(j => ({
        label: j.title || `Job #${j.id?.slice(-6)}`,
        sublabel: `Client: ${j.client_name || "—"} · Status: ${j.status}`,
        amount: j.total_paid_by_customer || 0,
        amountColor: "text-green-600",
      }));
    return { title: "Total Revenue Collected — Breakdown", items, total: monthlyRevenue };
  };

  const buildExpenseItems = () => {
    const items = [];
    monthlyJobs.forEach(j => {
      const costs = [
        { name: "Materials", val: j.material_costs },
        { name: "Labor", val: j.labor_costs },
        { name: "Subcontractors", val: j.subcontractor_costs },
        { name: "Permits", val: j.permit_costs },
        { name: "Equipment", val: j.equipment_costs },
        { name: "Overhead", val: j.overhead_costs },
        { name: "Other", val: j.other_costs },
      ].filter(c => (c.val || 0) > 0);
      costs.forEach(c => items.push({
        label: `${j.title} — ${c.name}`,
        sublabel: `Job cost · from Job record`,
        amount: c.val,
        amountColor: "text-red-600",
      }));
    });
    monthlyBills.forEach(b => items.push({
      label: b.title || "Business Bill",
      sublabel: `Business bill · Due: ${b.due_date || "—"}`,
      amount: b.amount || 0,
      amountColor: "text-red-600",
    }));
    return { title: "This Month Business Expenses — Breakdown", items, total: monthlyExpenses };
  };

  const buildProfitItems = () => {
    const revenueItems = jobs
      .filter(j => (j.total_paid_by_customer || 0) > 0)
      .map(j => ({
        label: j.title || `Job #${j.id?.slice(-6)}`,
        sublabel: "Revenue collected",
        amount: j.total_paid_by_customer || 0,
        amountColor: "text-green-600",
        badge: "Revenue",
      }));
    const expenseItems = monthlyJobs.map(j => {
      const total = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0);
      return total > 0 ? { label: j.title, sublabel: "Job costs", amount: -total, amountColor: "text-red-600", badge: "Cost" } : null;
    }).filter(Boolean);
    return { title: "Monthly Profit — Revenue vs. Costs", items: [...revenueItems, ...expenseItems], total: monthlyProfit };
  };

  const buildCashItems = () => {
    const items = bankAccounts.map(a => ({
      label: a.name,
      sublabel: `${a.institution || ""}${a.account_type ? ` · ${a.account_type}` : ""} · ${a.account_category || ""}`,
      amount: a.current_balance || 0,
      amountColor: (a.current_balance || 0) >= 0 ? "text-green-600" : "text-red-600",
      badge: a.account_category,
    }));
    return { title: "Cash Available — Bank Accounts", items, total: totalBankBalance };
  };

  const metricCard = (icon, label, value, subtext, color, onClick) => (
    <Card className="p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
        </div>
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          {React.createElement(icon, { className: "w-5 h-5 text-primary" })}
        </div>
      </div>
      <p className="text-xs text-primary mt-2 font-medium">Click to see details →</p>
    </Card>
  );

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {metricCard(TrendingUp, "This Month Revenue", formatCurrency(monthlyRevenue), activeJobs.length + " active jobs", "", () => setModal(buildRevenueItems()))}
        {metricCard(TrendingDown, "This Month Expenses", formatCurrency(monthlyExpenses), overdueBills + " overdue", "", () => setModal(buildExpenseItems()))}
        {metricCard(CheckCircle, "Monthly Profit", formatCurrency(monthlyProfit), monthlyProfit > 0 ? "On track" : "Review needed", monthlyProfit > 0 ? "text-green-600" : "text-red-600", () => setModal(buildProfitItems()))}
        {metricCard(Clock, "Cash Available", formatCurrency(totalBankBalance), awaitingPayment.length + " unpaid invoices", "", () => setModal(buildCashItems()))}
      </div>
      {modal && (
        <MetricDrillDownModal
          open={!!modal}
          onClose={() => setModal(null)}
          title={modal.title}
          items={modal.items}
          total={modal.total}
          emptyMessage="No data available for this period."
        />
      )}
    </>
  );
}