import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function OperationsDashboardCards({ jobs, contracts = [], bills, personalBills, bankAccounts }) {
   const today = new Date().toISOString().split("T")[0];
   const monthStart = new Date(new Date().setDate(1)).toISOString().split("T")[0];

   // Job metrics
   const activeJobs = jobs.filter(j => ["bidding", "contracted", "in_progress"].includes(j.status));
   const completedThisMonth = jobs.filter(j => j.status === "completed" && j.actual_completion >= monthStart);
   const awaitingPayment = contracts.filter(c => c.status !== "completed" && c.status !== "cancelled" && (c.contract_amount || 0) > (c.client_paid_amount || 0));

   // Financial metrics - use actual received payments from contracts
   const monthlyRevenue = contracts.filter(c => c.created_date >= monthStart && (c.status === "active" || c.status === "signed" || c.status === "draft" || c.status === "sent"))
     .reduce((s, c) => s + (c.client_paid_amount || 0), 0);
   const monthlyExpenses = bills.filter(b => b.created_date >= monthStart)
     .reduce((s, b) => s + (b.amount || 0), 0);
   const monthlyProfit = monthlyRevenue - monthlyExpenses;

   // Cash
   const cashAvailable = bankAccounts.reduce((s, a) => s + (a.current_balance || 0), 0);

  // Overdue bills
  const overdueBills = bills.filter(b => b.status !== "paid" && b.due_date < today).length;

  const metricCard = (icon, label, value, subtext, color = "text-foreground") => (
    <Card className="p-4">
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
    </Card>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {metricCard(TrendingUp, "This Month Revenue", formatCurrency(monthlyRevenue), activeJobs.length + " active jobs")}
      {metricCard(TrendingDown, "This Month Expenses", formatCurrency(monthlyExpenses), overdueBills + " overdue")}
      {metricCard(CheckCircle, "Monthly Profit", formatCurrency(monthlyProfit), monthlyProfit > 0 ? "On track" : "Review needed", monthlyProfit > 0 ? "text-green-600" : "text-red-600")}
      {metricCard(Clock, "Cash Available", formatCurrency(cashAvailable), awaitingPayment.length + " unpaid invoices")}
    </div>
  );
}