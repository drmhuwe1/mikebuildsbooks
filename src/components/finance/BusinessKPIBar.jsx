import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, AlertCircle, Clock } from "lucide-react";
import MetricDrillDownModal from "@/components/operations/MetricDrillDownModal";

function KPI({ label, value, icon: IconComp, color = "text-foreground", sub, onClick }) {
  return (
    <Card
      className={`p-4 flex flex-col gap-1 ${onClick ? "cursor-pointer hover:shadow-md hover:border-primary/40 transition-all" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5">
        {IconComp && <IconComp className={`w-3.5 h-3.5 ${color}`} />}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      {onClick && <p className="text-xs text-primary mt-1 font-medium">Click to see details →</p>}
    </Card>
  );
}

export default function BusinessKPIBar({
  revenue, expenses, grossProfit, projectedGrossProfit, netProfit,
  cashOnHand, taxReserve, receivables, overdueAmount, dueSoon, ownerDraws,
  subPaid = 0, managerPaid = 0, projectedSubPay = 0, projectedManagerPay = 0,
  // breakdown data passed from parent
  jobs = [], contracts = [], bills = [], txns = [], subPayments = [], jobReceipts = [], settings = {}
}) {
  const [modal, setModal] = useState(null);

  const today = new Date().toISOString().split("T")[0];
  const currentYear = new Date().getFullYear().toString();

  const buildRevenueItems = () => {
    const items = [];
    jobs.forEach(j => {
      if ((j.total_paid_by_customer || 0) > 0)
        items.push({ label: j.title || "Job", sublabel: "Total paid by customer", amount: j.total_paid_by_customer, amountColor: "text-green-600" });
      if ((j.change_orders_total || 0) > 0)
        items.push({ label: j.title || "Job", sublabel: "Change orders total", amount: j.change_orders_total, amountColor: "text-green-600" });
    });
    contracts.forEach(c => {
      if ((c.client_paid_amount || 0) > 0)
        items.push({ label: c.title || `Contract`, sublabel: `Client: ${c.client_name || "—"}`, amount: c.client_paid_amount, amountColor: "text-green-600" });
    });
    return { title: "Total Revenue — Breakdown", items, total: revenue };
  };

  const buildExpenseItems = () => {
    const items = [];
    jobs.forEach(j => {
      [
        { name: "Materials", val: j.material_costs },
        { name: "Labor", val: j.labor_costs },
        { name: "Subcontractors", val: j.subcontractor_costs },
        { name: "Permits", val: j.permit_costs },
        { name: "Equipment", val: j.equipment_costs },
        { name: "Overhead", val: j.overhead_costs },
        { name: "Other", val: j.other_costs },
      ].filter(c => (c.val || 0) > 0).forEach(c =>
        items.push({ label: `${j.title} — ${c.name}`, sublabel: "Job cost", amount: c.val, amountColor: "text-red-600" })
      );
    });
    jobReceipts.forEach(r =>
      items.push({ label: r.description || "Receipt", sublabel: `${r.vendor || ""} · ${r.date || ""}`, amount: r.amount || 0, amountColor: "text-red-600" })
    );
    return { title: "Total Expenses — Breakdown", items, total: expenses };
  };

  const buildGrossProfitItems = () => {
    const revenueItems = contracts
      .filter(c => (c.client_paid_amount || 0) > 0)
      .map(c => ({ label: c.title || "Contract", sublabel: "Revenue", amount: c.client_paid_amount, amountColor: "text-green-600", badge: "Revenue" }));
    const expenseItems = jobs.map(j => {
      const total = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0);
      return total > 0 ? { label: j.title, sublabel: "Job costs", amount: -total, amountColor: "text-red-600", badge: "Cost" } : null;
    }).filter(Boolean);
    return { title: "Gross Profit — Revenue vs. Costs", items: [...revenueItems, ...expenseItems], total: grossProfit };
  };

  const buildReceivablesItems = () => {
    const items = contracts
      .map(c => {
        const linkedJob = jobs.find(j => j.id === c.job_id);
        const paidAmount = Math.max(c.client_paid_amount || 0, linkedJob?.total_paid_by_customer || 0);
        const outstanding = Math.max(0, (c.contract_amount || 0) - paidAmount);
        return outstanding > 0 ? {
          label: c.title || "Contract",
          sublabel: `Client: ${c.client_name || "—"} · Paid: ${formatCurrency(paidAmount)} of ${formatCurrency(c.contract_amount || 0)}`,
          amount: outstanding,
          amountColor: "text-blue-600",
        } : null;
      })
      .filter(Boolean);
    return { title: "Outstanding Receivables — Breakdown", items, total: receivables };
  };

  const buildOverdueBillsItems = () => {
    const items = bills
      .filter(b => b.status !== "paid" && b.due_date < today)
      .map(b => ({ label: b.title || "Bill", sublabel: `Due: ${b.due_date}`, amount: b.amount || 0, amountColor: "text-red-600" }));
    return { title: "Overdue Bills — Breakdown", items, total: overdueAmount };
  };

  const buildDueSoonItems = () => {
    const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    const items = bills
      .filter(b => b.status !== "paid" && b.due_date >= today && b.due_date <= thirtyDays)
      .map(b => ({ label: b.title || "Bill", sublabel: `Due: ${b.due_date}`, amount: b.amount || 0, amountColor: "text-orange-600" }));
    return { title: "Bills Due in 30 Days — Breakdown", items, total: dueSoon };
  };

  const buildTaxReserveItems = () => {
    const pct = settings.tax_reserve_percent || 25;
    const collected = contracts.reduce((sum, c) => sum + (c.client_paid_amount || 0), 0);
    const items = contracts
      .filter(c => (c.client_paid_amount || 0) > 0)
      .map(c => ({
        label: c.title || "Contract",
        sublabel: `${pct}% of ${formatCurrency(c.client_paid_amount || 0)} collected`,
        amount: (c.client_paid_amount || 0) * (pct / 100),
        amountColor: "text-yellow-600",
      }));
    return { title: `Tax Reserve Needed (${pct}% of collected)`, items, total: taxReserve };
  };

  const buildSubPaidItems = () => {
    const items = subPayments
      .filter(p => p.status === "paid" && p.payment_date?.startsWith(currentYear))
      .map(p => ({
        label: p.subcontractor_name || "Subcontractor",
        sublabel: `Job: ${p.job_title || "—"} · ${p.payment_date}`,
        amount: p.amount || 0,
        amountColor: "text-blue-600",
      }));
    return { title: "Subcontractors Paid YTD — Breakdown", items, total: subPaid };
  };

  const buildManagerPaidItems = () => {
    const items = txns
      .filter(t => t.category === "payroll" && t.type === "outflow" && t.date?.startsWith(currentYear))
      .map(t => ({
        label: t.description || "Payroll Payment",
        sublabel: `Date: ${t.date} · ${t.bank_account_name || ""}`,
        amount: t.amount || 0,
        amountColor: "text-purple-600",
      }));
    return { title: "Manager Paid YTD — Breakdown", items, total: managerPaid };
  };

  const buildOwnerDrawsItems = () => {
    const items = txns
      .filter(t => t.category === "owner_draw" && t.type === "outflow")
      .map(t => ({
        label: t.description || "Owner Draw",
        sublabel: `Date: ${t.date} · ${t.bank_account_name || ""}`,
        amount: t.amount || 0,
        amountColor: "text-green-600",
      }));
    return { title: "Owner Draws Paid — Breakdown", items, total: ownerDraws };
  };

  const buildProjectedGrossProfitItems = () => {
    const items = contracts
      .filter(c => c.status !== "completed" && c.status !== "cancelled")
      .map(c => {
        const linkedJob = jobs.find(j => j.id === c.job_id);
        const costs = linkedJob ? (linkedJob.material_costs || 0) + (linkedJob.labor_costs || 0) + (linkedJob.subcontractor_costs || 0) + (linkedJob.permit_costs || 0) + (linkedJob.equipment_costs || 0) + (linkedJob.overhead_costs || 0) + (linkedJob.other_costs || 0) : 0;
        return {
          label: c.title || "Contract",
          sublabel: `Contract: ${formatCurrency(c.contract_amount || 0)} − Costs: ${formatCurrency(costs)}`,
          amount: (c.contract_amount || 0) - costs,
          amountColor: "text-green-600",
        };
      });
    return { title: "Projected Gross Profit — Active Contracts", items, total: projectedGrossProfit };
  };

  const buildNetProfitItems = () => {
    const managerPct = settings.manager_pay_percent || 10;
    const items = [
      { label: "Gross Profit", sublabel: "Revenue collected − Job costs", amount: grossProfit, amountColor: grossProfit >= 0 ? "text-green-600" : "text-red-600" },
      { label: `Manager Pay (${managerPct}%)`, sublabel: "Deducted from gross profit", amount: -Math.max(0, grossProfit * (managerPct / 100)), amountColor: "text-red-600" },
    ];
    return { title: "Net Profit — Breakdown", items, total: netProfit };
  };

  const buildManagerProjectedItems = () => {
    const managerPct = settings.manager_pay_percent || 10;
    const items = contracts
      .filter(c => c.status !== "completed" && c.status !== "cancelled")
      .map(c => {
        const linkedJob = jobs.find(j => j.id === c.job_id);
        const costs = linkedJob ? (linkedJob.material_costs || 0) + (linkedJob.labor_costs || 0) + (linkedJob.subcontractor_costs || 0) + (linkedJob.permit_costs || 0) + (linkedJob.equipment_costs || 0) + (linkedJob.overhead_costs || 0) + (linkedJob.other_costs || 0) : 0;
        const profit = (c.contract_amount || 0) - costs;
        return {
          label: c.title || "Contract",
          sublabel: `${managerPct}% of projected profit ${formatCurrency(profit)}`,
          amount: Math.max(0, profit * (managerPct / 100)),
          amountColor: "text-purple-600",
        };
      });
    return { title: `Manager Projected Pay (${managerPct}% of projected profit)`, items, total: projectedManagerPay };
  };

  const buildSubProjectedItems = () => {
    const items = jobs
      .filter(j => ["in_progress", "contracted"].includes(j.status) && (j.subcontractor_costs || 0) > 0)
      .map(j => ({ label: j.title, sublabel: `Status: ${j.status}`, amount: j.subcontractor_costs, amountColor: "text-blue-600" }));
    return { title: "Projected Subcontractor Costs — Active Jobs", items, total: projectedSubPay };
  };

  const buildCashOnHandItems = () => {
    const inflow = txns.filter(t => t.type === "inflow").reduce((s, t) => s + (t.amount || 0), 0);
    const outflow = txns.filter(t => t.type === "outflow").reduce((s, t) => s + (t.amount || 0), 0);
    const items = [
      { label: "Total Inflows (all transactions)", sublabel: "Bank transactions", amount: inflow, amountColor: "text-green-600", badge: "Inflow" },
      { label: "Total Outflows (all transactions)", sublabel: "Bank transactions", amount: -outflow, amountColor: "text-red-600", badge: "Outflow" },
    ];
    return { title: "Cash on Hand — Transaction Summary", items, total: cashOnHand };
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPI label="Total Revenue" value={formatCurrency(revenue)} icon={TrendingUp} color="text-green-600" onClick={() => setModal(buildRevenueItems())} />
        <KPI label="Total Expenses" value={formatCurrency(expenses)} icon={TrendingDown} color="text-red-500" onClick={() => setModal(buildExpenseItems())} />
        <KPI label="Gross Profit" value={formatCurrency(grossProfit)} icon={TrendingUp} color={grossProfit >= 0 ? "text-green-500" : "text-red-500"} onClick={() => setModal(buildGrossProfitItems())} />
        <KPI label="Projected Gross Profit" value={formatCurrency(projectedGrossProfit)} icon={TrendingUp} color={projectedGrossProfit >= 0 ? "text-green-500" : "text-red-500"} onClick={() => setModal(buildProjectedGrossProfitItems())} />
        <KPI label="Net Profit" value={formatCurrency(netProfit)} icon={DollarSign} color={netProfit >= 0 ? "text-green-600" : "text-red-600"} onClick={() => setModal(buildNetProfitItems())} />
        <KPI label="Cash on Hand" value={formatCurrency(cashOnHand)} icon={PiggyBank} color="text-blue-600" onClick={() => setModal(buildCashOnHandItems())} />
        <KPI label="Tax Reserve Needed" value={formatCurrency(taxReserve)} icon={AlertCircle} color="text-yellow-600" onClick={() => setModal(buildTaxReserveItems())} />
        <KPI label="Outstanding Receivables" value={formatCurrency(receivables)} icon={Clock} color="text-blue-500" onClick={() => setModal(buildReceivablesItems())} />
        <KPI label="Overdue Bills" value={formatCurrency(overdueAmount)} icon={AlertCircle} color={overdueAmount > 0 ? "text-red-600" : "text-muted-foreground"} onClick={() => setModal(buildOverdueBillsItems())} />
        <KPI label="Bills Due (30 Days)" value={formatCurrency(dueSoon)} icon={Clock} color="text-orange-500" onClick={() => setModal(buildDueSoonItems())} />
        <KPI label="Subcontractors Paid (YTD)" value={formatCurrency(subPaid)} icon={DollarSign} color="text-blue-600" onClick={() => setModal(buildSubPaidItems())} />
        <KPI label="Subcontractors Projected" value={formatCurrency(projectedSubPay)} icon={DollarSign} color="text-blue-500" onClick={() => setModal(buildSubProjectedItems())} />
        <KPI label="Manager Paid (YTD)" value={formatCurrency(managerPaid)} icon={DollarSign} color="text-purple-600" onClick={() => setModal(buildManagerPaidItems())} />
        <KPI label="Manager Projected" value={formatCurrency(projectedManagerPay)} icon={DollarSign} color="text-purple-500" onClick={() => setModal(buildManagerProjectedItems())} />
        <KPI label="Owner Draws Paid" value={formatCurrency(ownerDraws)} icon={DollarSign} color="text-green-600" onClick={() => setModal(buildOwnerDrawsItems())} />
      </div>

      {modal && (
        <MetricDrillDownModal
          open={!!modal}
          onClose={() => setModal(null)}
          title={modal.title}
          items={modal.items}
          total={modal.total}
          emptyMessage="No data available for this metric."
        />
      )}
    </>
  );
}