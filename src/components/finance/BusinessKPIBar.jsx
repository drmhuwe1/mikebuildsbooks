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
  revenue, expenses, grossProfit, projectedGrossProfit, netProfit, projectedNetProfit,
  cashOnHand, taxReserve, receivables, overdueAmount, dueSoon, ownerDraws,
  subPaid = 0, managerPaid = 0, projectedSubPay = 0, projectedManagerPay = 0, currentSubPayouts = 0, jobExpenses = 0,
  // breakdown data passed from parent
  jobs = [], contracts = [], bills = [], txns = [], subPayments = [], jobReceipts = [], ledgerPayments = [], subLaborEntries = [], settings = {}
}) {
  const [modal, setModal] = useState(null);

  const today = new Date().toISOString().split("T")[0];
  const currentYear = new Date().getFullYear().toString();

  const SIGNED_STATUSES = ["signed", "active", "completed"];
  const buildRevenueItems = () => {
    const items = [];
    const contractJobIds = new Set(contracts.map(c => c.job_id).filter(Boolean));
    contracts.forEach(c => {
      const linkedJob = jobs.find(j => j.id === c.job_id);
      const paid = (SIGNED_STATUSES.includes(c.status) && linkedJob)
        ? (linkedJob.total_paid_by_customer || c.client_paid_amount || 0)
        : (c.client_paid_amount || 0);
      if (paid > 0)
        items.push({ label: c.title || "Contract", sublabel: `Client: ${c.client_name || "—"}${SIGNED_STATUSES.includes(c.status) ? " · (from Job)" : ""}`, amount: paid, amountColor: "text-green-600" });
    });
    jobs.filter(j => !contractJobIds.has(j.id) && (j.total_paid_by_customer || 0) > 0).forEach(j =>
      items.push({ label: j.title || "Job", sublabel: `Client: ${j.client_name || "—"} · No contract`, amount: j.total_paid_by_customer, amountColor: "text-green-600" })
    );
    return { title: "Total Revenue — Breakdown", items, total: revenue };
  };

  const buildExpenseItems = () => {
    const items = [];
    // Only show what's actually in actualExpenses: receipts + paid ledger sub payments
    jobReceipts.forEach(r =>
      items.push({ label: r.description || "Receipt", sublabel: `${r.vendor || ""} · ${r.date || ""}`, amount: r.amount || 0, amountColor: "text-red-600" })
    );
    ledgerPayments.filter(p => p.is_paid).forEach(p =>
      items.push({ label: `Sub: ${p.subcontractor_name || "Subcontractor"}`, sublabel: `Job: ${p.job_title || "—"} · ${p.payment_date || ""}`, amount: p.amount_paid || 0, amountColor: "text-red-600" })
    );
    return { title: "Total Expenses — Breakdown", items, total: expenses };
  };

  const buildGrossProfitItems = () => {
    const items = [];
    // Revenue from jobs (deposits_received — same source as totalRevenue KPI)
    jobs.filter(j => (j.deposits_received || 0) > 0).forEach(j =>
      items.push({ label: j.title || "Job", sublabel: `Client: ${j.client_name || "—"} · Deposits received`, amount: j.deposits_received, amountColor: "text-green-600" })
    );
    // Job field expenses
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
        items.push({ label: `${j.title} — ${c.name}`, sublabel: "Job expense", amount: -(c.val), amountColor: "text-red-600" })
      );
    });
    // Receipts
    jobReceipts.filter(r => (r.amount || 0) > 0).forEach(r =>
      items.push({ label: r.description || "Receipt", sublabel: `${r.vendor || ""} · ${r.date || ""}`, amount: -(r.amount), amountColor: "text-red-600" })
    );
    // Paid sub labor (ledger)
    ledgerPayments.filter(p => p.is_paid).forEach(p =>
      items.push({ label: `Sub: ${p.subcontractor_name || "Subcontractor"}`, sublabel: `Job: ${p.job_title || "—"} · ${p.payment_date || ""}`, amount: -(p.amount_paid || 0), amountColor: "text-red-600" })
    );
    return { title: "Gross Profit = Revenue Collected − All Expenses", items, total: grossProfit };
  };

  const buildReceivablesItems = () => {
    const items = [];
    // Per contract: outstanding = contract_amount - client_paid_amount
    contracts.forEach(c => {
      const paid = c.client_paid_amount || 0;
      const outstanding = Math.max(0, (c.contract_amount || 0) - paid);
      if (outstanding > 0) {
        items.push({
          label: c.title || "Contract",
          sublabel: `Client: ${c.client_name || "—"} · Paid: ${formatCurrency(paid)} of ${formatCurrency(c.contract_amount || 0)}`,
          amount: outstanding,
          amountColor: "text-blue-600",
        });
      }
    });
    // Unlinked jobs with a contract_amount
    const linkedJobIds = new Set([...contracts.map(c => c.job_id).filter(Boolean), ...jobs.filter(j => j.contract_id).map(j => j.id)]);
    jobs.filter(j => !linkedJobIds.has(j.id) && (j.contract_amount || 0) > 0).forEach(j => {
      const paid = (j.total_paid_by_customer || 0) + (j.change_orders_total || 0);
      const outstanding = Math.max(0, (j.contract_amount || 0) - paid);
      if (outstanding > 0) {
        items.push({
          label: j.title || "Job",
          sublabel: `Client: ${j.client_name || "—"} · Paid: ${formatCurrency(paid)} of ${formatCurrency(j.contract_amount || 0)}`,
          amount: outstanding,
          amountColor: "text-blue-600",
        });
      }
    });
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
    const items = [];
    // Use deposits_received from jobs (the source of truth for collected revenue)
    jobs.forEach(j => {
      const paid = j.deposits_received || 0;
      if (paid > 0) items.push({
        label: j.title || "Job",
        sublabel: `Client: ${j.client_name || "—"} · ${pct}% of ${formatCurrency(paid)} collected`,
        amount: paid * (pct / 100),
        amountColor: "text-yellow-600",
      });
    });
    return { title: `Tax Reserve Needed — ${pct}% of All Revenue Collected`, items, total: taxReserve };
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
    const receiptTotal = jobReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);
    const jobCostsTotal = jobs.reduce((sum, j) => sum + (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0), 0);
    const subLaborPaid = ledgerPayments.filter(p => p.is_paid).reduce((sum, p) => sum + (p.amount_paid || 0), 0)
      + subLaborEntries.filter(s => s.payment_status === "Paid").reduce((sum, s) => sum + (s.calculated_pay || 0), 0);
    const totalRevenue = jobs.reduce((sum, j) => sum + (j.deposits_received || 0), 0);
    const managerBase = Math.max(0, totalRevenue - jobs.reduce((sum, j) => sum + (j.material_costs || 0) + (j.equipment_costs || 0), 0) - jobReceipts.filter(r => r.category !== "subcontractor").reduce((sum, r) => sum + (r.amount || 0), 0));
    const managerPayAmt = managerBase * (managerPct / 100);
    const items = [
      { label: "Total Revenue Collected", sublabel: "Deposits received from all jobs", amount: totalRevenue, amountColor: "text-green-600" },
      { label: "Job Expenses (Fields)", sublabel: "Materials, labor, subs, permits, equipment, overhead, other", amount: -jobCostsTotal, amountColor: "text-red-600" },
      { label: "Receipts / Purchases", sublabel: "Actual expense receipts logged", amount: -receiptTotal, amountColor: "text-red-600" },
      { label: "Sub Labor Paid (Ledger)", sublabel: "Paid subcontractor work entries", amount: -subLaborPaid, amountColor: "text-red-600" },
      { label: `Manager Pay (${managerPct}%)`, sublabel: `${managerPct}% of revenue minus materials & receipts (prior to sub labor)`, amount: -managerPayAmt, amountColor: "text-red-600" },
    ];
    return { title: "Net Profit — Full Breakdown", items, total: netProfit };
  };

  const buildManagerProjectedItems = () => {
    const managerPct = settings.manager_pay_percent || 10;
    // Get actual revenue collected from jobs
    const actualRevenue = jobs.reduce((sum, j) => sum + (j.deposits_received || 0), 0);
    // Get manager expenses: materials + equipment only (NOT labor, subs, permits, overhead, other)
    const managerExpenses = jobs.reduce((sum, j) => sum + (j.material_costs || 0) + (j.equipment_costs || 0), 0);
    const receiptsTotal = jobReceipts.filter(r => r.category !== "subcontractor").reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalDeductions = managerExpenses + receiptsTotal;
    const base = Math.max(0, actualRevenue - totalDeductions);
    const items = [
      { label: "Total Revenue Collected", sublabel: "Sum of deposits received from jobs", amount: actualRevenue, amountColor: "text-green-600" },
      { label: "Materials + Equipment Costs", sublabel: "Deducted from manager pay basis", amount: -managerExpenses, amountColor: "text-red-600" },
      { label: "Receipts / Purchases (non-sub)", sublabel: "Material/supply purchases only — sub labor excluded", amount: -receiptsTotal, amountColor: "text-red-600" },
      { label: `Manager Pay (${managerPct}% of above profit)`, sublabel: `${formatCurrency(base)} × ${managerPct}%`, amount: base * (managerPct / 100), amountColor: "text-purple-600" },
    ];
    return { title: `Manager Pay — ${managerPct}% of Revenue minus Materials & Receipts (prior to sub labor)`, items, total: projectedManagerPay };
  };

  const buildSubProjectedItems = () => {
    const unlinkedJobIds = new Set(contracts.map(c => c.job_id).filter(Boolean));
    const items = jobs
      .filter(j => !unlinkedJobIds.has(j.id) && ["in_progress", "contracted"].includes(j.status) && (j.subcontractor_costs || 0) > 0)
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

  const buildProjectedNetProfitItems = () => {
    const items = [
      { label: "Projected Gross Profit", sublabel: "Total bid amounts − All expenses", amount: projectedGrossProfit, amountColor: projectedGrossProfit >= 0 ? "text-green-600" : "text-red-600" },
      { label: `Manager Pay (${settings.manager_pay_percent || 10}%)`, sublabel: "Deducted from projected gross profit", amount: -projectedManagerPay, amountColor: "text-red-600" },
    ];
    return { title: "Projected Net Profit — Breakdown", items, total: projectedNetProfit };
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPI label="Total Revenue" value={formatCurrency(revenue)} icon={TrendingUp} color="text-green-600" onClick={() => setModal(buildRevenueItems())} />
        <KPI label="Total Expenses" value={formatCurrency(expenses)} icon={TrendingDown} color="text-red-500" onClick={() => setModal(buildExpenseItems())} />
        <KPI label="Projected Job Expenses" value={formatCurrency(jobExpenses)} icon={TrendingDown} color="text-orange-600" onClick={() => setModal({ title: "Projected Job Expenses", items: [], total: jobExpenses })} />
        <KPI label="Projected Total Expenses" value={formatCurrency(expenses + jobExpenses)} icon={TrendingDown} color="text-red-600" onClick={() => {
          const ptItems = [];
          // Actual expenses breakdown
          jobReceipts.forEach(r => ptItems.push({ label: r.description || "Receipt", sublabel: `${r.vendor || ""} · ${r.date || ""} · Actual`, amount: r.amount || 0, amountColor: "text-red-600" }));
          // Actual sub payments (ledger)
          // (summarized)
          if (expenses > 0) {
            ptItems.push({ label: "Subcontractors Paid (Ledger)", sublabel: "Actual paid entries", amount: expenses - jobReceipts.reduce((s,r) => s+(r.amount||0),0), amountColor: "text-red-600" });
          }
          // Projected job expenses
          jobs.forEach(j => {
            const total = (j.material_costs||0)+(j.labor_costs||0)+(j.subcontractor_costs||0)+(j.permit_costs||0)+(j.equipment_costs||0)+(j.overhead_costs||0)+(j.other_costs||0);
            if (total > 0) ptItems.push({ label: j.title || "Job", sublabel: `Projected job costs · ${j.status}`, amount: total, amountColor: "text-orange-600" });
          });
          setModal({ title: "Projected Total Expenses — Actual + Projected Job Costs", items: ptItems.filter(i => i.amount > 0), total: expenses + jobExpenses });
        }} />
        <KPI label="Gross Profit" value={formatCurrency(grossProfit)} icon={TrendingUp} color={grossProfit >= 0 ? "text-green-500" : "text-red-500"} onClick={() => setModal(buildGrossProfitItems())} />
        <KPI label="Projected Gross Profit" value={formatCurrency(projectedGrossProfit)} icon={TrendingUp} color={projectedGrossProfit >= 0 ? "text-green-500" : "text-red-500"} onClick={() => setModal(buildProjectedGrossProfitItems())} />
        <KPI label="Net Profit" value={formatCurrency(netProfit)} icon={DollarSign} color={netProfit >= 0 ? "text-green-600" : "text-red-600"} onClick={() => setModal(buildNetProfitItems())} />
        <KPI label="Projected Net Profit" value={formatCurrency(projectedNetProfit)} icon={DollarSign} color={projectedNetProfit >= 0 ? "text-green-600" : "text-red-600"} onClick={() => setModal(buildProjectedNetProfitItems())} />
        <KPI label="Cash on Hand" value={formatCurrency(cashOnHand)} icon={PiggyBank} color="text-blue-600" onClick={() => setModal(buildCashOnHandItems())} />
        <KPI label="Tax Reserve Needed" value={formatCurrency(taxReserve)} icon={AlertCircle} color="text-yellow-600" onClick={() => setModal(buildTaxReserveItems())} />
        <KPI label="Outstanding Receivables" value={formatCurrency(receivables)} icon={Clock} color="text-blue-500" onClick={() => setModal(buildReceivablesItems())} />
        <KPI label="Overdue Bills" value={formatCurrency(overdueAmount)} icon={AlertCircle} color={overdueAmount > 0 ? "text-red-600" : "text-muted-foreground"} onClick={() => setModal(buildOverdueBillsItems())} />
        <KPI label="Bills Due (30 Days)" value={formatCurrency(dueSoon)} icon={Clock} color="text-orange-500" onClick={() => setModal(buildDueSoonItems())} />
        <KPI label="Subcontractors Paid (YTD)" value={formatCurrency(subPaid)} icon={DollarSign} color="text-blue-600" onClick={() => setModal(buildSubPaidItems())} />
        <KPI label="Subcontractors Paid (Current Jobs)" value={formatCurrency(currentSubPayouts)} icon={DollarSign} color="text-blue-700" onClick={() => setModal({ title: "Subcontractors Paid - Current Jobs Only", items: [], total: currentSubPayouts })} />
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