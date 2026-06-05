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
  ownerProjectedDraw = 0,
  managerPayTotal = 0,
  jobProjections = [],
  // breakdown data passed from parent
  jobs = [], contracts = [], bills = [], txns = [], subPayments = [], jobReceipts = [], ledgerPayments = [], subLaborEntries = [], settings = {}, managerPayments = []
}) {
  const [modal, setModal] = useState(null);

  const today = new Date().toISOString().split("T")[0];
  const currentYear = new Date().getFullYear().toString();

  const buildRevenueItems = () => {
    const items = jobs
      .filter(j => (j.deposits_received || 0) > 0)
      .map(j => ({
        label: j.title || "Job",
        sublabel: `Client: ${j.client_name || "—"} · Status: ${j.status}`,
        amount: j.deposits_received,
        amountColor: "text-green-600",
      }));
    return { title: "Total Revenue — Breakdown", items, total: revenue };
  };

  const buildExpenseItems = () => {
    // Expenses = receipts ONLY (sub labor is tracked separately)
    const items = jobReceipts
      .filter(r => r.is_estimated !== true)
      .map(r => ({
        label: r.description || "Receipt",
        sublabel: `Job: ${r.job_title || "—"} · Vendor: ${r.vendor || "—"} · ${r.date || ""}`,
        amount: r.amount || 0,
        amountColor: "text-red-600",
      }));
    return { title: "Total Expenses — Actual Receipts Only", items, total: expenses };
  };

  const buildGrossProfitItems = () => {
    const totalRevenue = jobs.reduce((sum, j) => sum + (j.deposits_received || 0), 0);
    const items = [
      { label: "Total Revenue Collected", sublabel: "Deposits received from all jobs", amount: totalRevenue, amountColor: "text-green-600" },
      { label: "Total Expenses (Receipts Paid)", sublabel: "Actual expense receipts logged", amount: -expenses, amountColor: "text-red-600" },
    ];
    return { title: "Gross Profit — Revenue minus Receipt Expenses", items, total: grossProfit };
  };

  const buildReceivablesItems = () => {
    // Only contracted/in_progress jobs with a contract amount (matches the receivables calc)
    const items = jobs
      .filter(j => ['contracted', 'in_progress'].includes(j.status) && (j.contract_amount || 0) > 0)
      .map(j => {
        const adjusted = (j.contract_amount || 0) + (j.change_orders_total || 0);
        const collected = j.deposits_received || 0;
        const writeOff = j.write_off_amount || 0;
        const outstanding = Math.max(0, adjusted - collected - writeOff);
        return outstanding > 0 ? {
          label: j.title || "Job",
          sublabel: `Client: ${j.client_name || "—"} · Contract: ${formatCurrency(adjusted)} · Collected: −${formatCurrency(collected)}${writeOff > 0 ? ` · Written off: −${formatCurrency(writeOff)}` : ""}`,
          amount: outstanding,
          amountColor: "text-blue-600",
        } : null;
      })
      .filter(Boolean);
    return { title: "Outstanding Receivables — Contracted & In-Progress Jobs Only", items, total: receivables };
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
    const items = [];
    // Ledger payments (is_paid = true)
    ledgerPayments.filter(p => p.is_paid).forEach(p =>
      items.push({
        label: p.subcontractor_name || "Subcontractor",
        sublabel: `Job: ${p.job_title || "—"} · ${p.payment_date} (Ledger)`,
        amount: p.amount_paid || 0,
        amountColor: "text-blue-600",
      })
    );
    // Work entry payments (payment_status = "Paid")
    subLaborEntries.filter(s => s.payment_status === "Paid").forEach(s =>
      items.push({
        label: s.subcontractor_name || "Subcontractor",
        sublabel: `Job: ${s.job_title || "—"} · ${s.work_date} (Work Entry)`,
        amount: s.calculated_pay || 0,
        amountColor: "text-blue-600",
      })
    );
    // Direct subcontractor payments
    subPayments.forEach(p =>
      items.push({
        label: p.subcontractor_name || "Subcontractor",
        sublabel: `Job: ${p.job_title || "—"}${p.payment_date ? ` · ${p.payment_date}` : ""} (Direct Payment)`,
        amount: p.amount || 0,
        amountColor: "text-blue-600",
      })
    );
    // Recalculate total from items
    const recalculatedTotal = items.reduce((sum, item) => sum + item.amount, 0);
    return { title: "Subcontractors Paid YTD — Breakdown", items, total: recalculatedTotal };
  };

  const buildManagerPaidItems = () => {
    const items = managerPayments.map(p => ({
      label: `${p.job_title ? `📌 ${p.job_title}` : "General"} · ${p.payment_method || ""}`,
      sublabel: `Date: ${p.payment_date}${p.check_number ? ` · Check #${p.check_number}` : ""}${p.notes ? ` · ${p.notes}` : ""}`,
      amount: p.amount_paid || 0,
      amountColor: "text-purple-600",
    }));
    return { title: "Manager Paid — Breakdown by Job", items, total: managerPaid };
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
    const activeStatuses = ["contracted", "in_progress", "on_hold"];
    const projIncome = jobs
      .filter(j => activeStatuses.includes(j.status))
      .reduce((sum, j) => {
        const adjusted = (j.contract_amount || 0) + (j.change_orders_total || 0);
        const writeOff = j.write_off_amount || 0;
        return sum + (adjusted - writeOff);
      }, 0);
    const jobItems = jobs
      .filter(j => ["contracted", "in_progress", "on_hold"].includes(j.status))
      .map(j => {
        const adjusted = (j.contract_amount || 0) + (j.change_orders_total || 0);
        const writeOff = j.write_off_amount || 0;
        const income = adjusted - writeOff;
        return income > 0 ? {
          label: j.title || "Job",
          sublabel: `Client: ${j.client_name || "—"} · Status: ${j.status} · Contract: ${formatCurrency(adjusted)} · Collected: ${formatCurrency(j.deposits_received || 0)}`,
          amount: income,
          amountColor: "text-green-600",
        } : null;
      }).filter(Boolean);
    const summaryItems = [
      ...jobItems,
      { label: "− Actual Expenses (Receipts)", sublabel: "Actual paid receipts", amount: -expenses, amountColor: "text-red-600" },
    ];
    return { title: "Projected Gross Profit — Projected Income minus Actual Expenses", items: summaryItems, total: projectedGrossProfit };
  };

  const buildNetProfitItems = () => {
    const totalRevenue = jobs.reduce((sum, j) => sum + (j.deposits_received || 0), 0);
    const grossProfitAmt = Math.max(0, totalRevenue - expenses);
    const calcNetProfit = grossProfitAmt - managerPaid;
    const items = [
      { label: "Total Revenue Collected", sublabel: "Deposits received from all jobs", amount: totalRevenue, amountColor: "text-green-600" },
      { label: "Total Expenses (Receipts Paid)", sublabel: "Actual expense receipts logged", amount: -expenses, amountColor: "text-red-600" },
      { label: "Manager Pay (Actual Paid to Date)", sublabel: `Total of all manager payments recorded`, amount: -managerPaid, amountColor: "text-red-600" },
    ];
    return { title: "Net Profit — Revenue minus Expenses minus Manager Pay Paid", items, total: calcNetProfit };
  };

  const buildManagerProjectedItems = () => {
    const mgrPct = settings.manager_pay_percent || 10;
    const mgrType = settings.manager_pay_type || "percent";
    const mgrFlat = settings.manager_pay_flat_amount || 0;
    // Per-job breakdown: for flat_rate only contracted+in_progress; for percent all jobs with revenue
    const startedJobs = mgrType === "flat_rate"
      ? jobs.filter(j => ["contracted", "in_progress"].includes(j.status))
      : jobs.filter(j => ["contracted", "in_progress", "completed"].includes(j.status) && (j.deposits_received || 0) > 0);
    const items = startedJobs
      .filter(j => !j.manager_pay_waived)
      .map(j => {
        const revenue = j.deposits_received || 0;
        const receipts = jobReceipts.filter(r => r.job_id === j.id).reduce((s, r) => s + (r.amount || 0), 0);
        const gross = Math.max(0, revenue - receipts);
        const owed = mgrType === "flat_rate" ? mgrFlat : gross * (mgrPct / 100);
        const paid = managerPayments.filter(p => p.job_id === j.id).reduce((s, p) => s + (p.amount_paid || 0), 0);
        const remaining = Math.max(0, owed - paid);
        return remaining > 0 ? {
          label: j.title || "Job",
          sublabel: `Client: ${j.client_name || "—"} · Owed: ${formatCurrency(owed)} · Paid: ${formatCurrency(paid)}`,
          amount: remaining,
          amountColor: "text-purple-600",
        } : null;
      })
      .filter(Boolean);
    return { title: "Manager Pay Remaining — Per Job Breakdown", items, total: projectedManagerPay };
  };

  const buildSubProjectedItems = () => {
    const items = jobs
      .filter(j => (["in_progress", "contracted"].includes(j.status) || j.is_started) && (j.subcontractor_costs || 0) > 0)
      .map(j => {
        const budget = j.subcontractor_costs || 0;
        const logged = subLaborEntries.filter(e => e.job_id === j.id).reduce((s, e) => s + (e.calculated_pay || 0), 0);
        const remaining = Math.max(0, budget - logged);
        return {
          label: j.title,
          sublabel: `Budget: ${formatCurrency(budget)} · Logged: −${formatCurrency(logged)} · Remaining: ${formatCurrency(remaining)}`,
          amount: remaining,
          amountColor: "text-blue-600"
        };
      }).filter(i => i.amount > 0);
    return { title: "Projected Subcontractor Costs Remaining — Active Jobs", items, total: projectedSubPay };
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
    const projIncome = jobs
      .filter(j => ["contracted", "in_progress", "on_hold"].includes(j.status))
      .reduce((sum, j) => {
        const adjusted = (j.contract_amount || 0) + (j.change_orders_total || 0);
        const writeOff = j.write_off_amount || 0;
        return sum + (adjusted - writeOff);
      }, 0);
    const totalSubLabor = subLaborEntries.reduce((sum, e) => sum + (e.calculated_pay || 0), 0);
    const totalMgrPay = managerPaid + projectedManagerPay;
    const items = [
      { label: "Projected Total Income", sublabel: "Contract + COs − write-offs for all non-cancelled jobs", amount: projIncome, amountColor: "text-green-600" },
      { label: "− Actual Expenses (Receipts)", sublabel: "Paid receipts logged against jobs", amount: -expenses, amountColor: "text-red-600" },
      { label: "− Manager Pay (Paid + Still Owed)", sublabel: `Paid: ${formatCurrency(managerPaid)} · Still owed: ${formatCurrency(projectedManagerPay)}`, amount: -totalMgrPay, amountColor: "text-purple-600" },
      { label: "− Sub Labor (All Entries)", sublabel: `All subcontractor work entries (paid + unpaid)`, amount: -totalSubLabor, amountColor: "text-blue-600" },
    ];
    return { title: "Projected Net Profit — Full Breakdown", items, total: projectedNetProfit };
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPI label="Total Revenue" value={formatCurrency(revenue)} icon={TrendingUp} color="text-green-600" onClick={() => setModal(buildRevenueItems())} />
        <KPI label="Total Expenses" value={formatCurrency(expenses)} icon={TrendingDown} color="text-red-500" onClick={() => setModal(buildExpenseItems())} />
        <KPI label="Projected Job Expenses" value={formatCurrency(jobExpenses)} icon={TrendingDown} color="text-orange-600" onClick={() => {
          const items = jobs.map(j => {
            const total = (j.material_costs||0)+(j.labor_costs||0)+(j.subcontractor_costs||0)+(j.permit_costs||0)+(j.equipment_costs||0)+(j.overhead_costs||0)+(j.other_costs||0);
            return total > 0 ? { label: j.title || "Job", sublabel: `Client: ${j.client_name || "—"} · Status: ${j.status}`, amount: total, amountColor: "text-orange-600" } : null;
          }).filter(Boolean);
          setModal({ title: "Projected Job Expenses — Breakdown", items, total: jobExpenses });
        }} />
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
        <KPI label="Gross Profit" value={formatCurrency(grossProfit)} sub="Revenue minus expenses" icon={TrendingUp} color={grossProfit >= 0 ? "text-green-500" : "text-red-500"} onClick={() => setModal(buildGrossProfitItems())} />
        <KPI label="Projected Gross Profit" value={formatCurrency(projectedGrossProfit)} icon={TrendingUp} color={projectedGrossProfit >= 0 ? "text-green-500" : "text-red-500"} onClick={() => setModal(buildProjectedGrossProfitItems())} />
        <KPI label="Net Profit" value={formatCurrency(netProfit)} icon={DollarSign} color={netProfit >= 0 ? "text-green-600" : "text-red-600"} onClick={() => setModal(buildNetProfitItems())} />
        <KPI label="Projected Net Profit" value={formatCurrency(projectedNetProfit)} sub="After manager pay, tax reserve & savings" icon={DollarSign} color={projectedNetProfit >= 0 ? "text-green-600" : "text-red-600"} onClick={() => setModal(buildProjectedNetProfitItems())} />
        <KPI label="Cash on Hand" value={formatCurrency(cashOnHand)} icon={PiggyBank} color="text-blue-600" onClick={() => setModal(buildCashOnHandItems())} />
        <KPI label="Tax Reserve Needed" value={formatCurrency(taxReserve)} icon={AlertCircle} color="text-yellow-600" onClick={() => setModal(buildTaxReserveItems())} />
        <KPI label="Outstanding Receivables" value={formatCurrency(receivables)} icon={Clock} color="text-blue-500" onClick={() => setModal(buildReceivablesItems())} />
        <KPI label="Overdue Bills" value={formatCurrency(overdueAmount)} icon={AlertCircle} color={overdueAmount > 0 ? "text-red-600" : "text-muted-foreground"} onClick={() => setModal(buildOverdueBillsItems())} />
        <KPI label="Bills Due (30 Days)" value={formatCurrency(dueSoon)} icon={Clock} color="text-orange-500" onClick={() => setModal(buildDueSoonItems())} />
        <KPI label="Subcontractors Paid (YTD)" value={formatCurrency(subPaid)} icon={DollarSign} color="text-blue-600" onClick={() => setModal(buildSubPaidItems())} />
        <KPI label="Subcontractors Paid (Current Jobs)" value={formatCurrency(currentSubPayouts)} icon={DollarSign} color="text-blue-700" onClick={() => {
          const items = [];
          const activeJobIds = new Set(jobs.filter(j => !["completed", "cancelled"].includes(j.status)).map(j => j.id));
          ledgerPayments.filter(p => activeJobIds.has(p.job_id)).forEach(p =>
            items.push({ label: p.subcontractor_name || "Subcontractor", sublabel: `${p.job_title || "—"} · ${p.payment_date} (Ledger)`, amount: p.amount_paid || 0, amountColor: "text-blue-600" })
          );
          subLaborEntries.filter(s => activeJobIds.has(s.job_id)).forEach(s =>
            items.push({ label: s.subcontractor_name || "Subcontractor", sublabel: `${s.job_title || "—"} · ${s.work_date} (Work Entry)`, amount: s.calculated_pay || 0, amountColor: "text-blue-600" })
          );
          subPayments.filter(p => activeJobIds.has(p.job_id)).forEach(p =>
            items.push({ label: p.subcontractor_name || "Subcontractor", sublabel: `${p.job_title || "—"}${p.payment_date ? ` · ${p.payment_date}` : ""} (Direct Payment)`, amount: p.amount || 0, amountColor: "text-blue-600" })
          );
          const total = items.reduce((sum, item) => sum + item.amount, 0);
          setModal({ title: "Subcontractors Paid (Current Jobs) — Breakdown", items, total });
        }} />
        <KPI label="Subcontractors Projected" value={formatCurrency(projectedSubPay)} icon={DollarSign} color="text-blue-500" onClick={() => setModal(buildSubProjectedItems())} />
        <KPI label="Manager Paid (YTD)" value={formatCurrency(managerPaid)} icon={DollarSign} color="text-purple-600" onClick={() => setModal(buildManagerPaidItems())} />
        <KPI label="Manager Remaining" value={formatCurrency(projectedManagerPay)} icon={DollarSign} color="text-purple-500" sub={`Projected minus paid`} onClick={() => setModal(buildManagerProjectedItems())} />
        <KPI label="Owner Draws Paid" value={formatCurrency(ownerDraws)} icon={DollarSign} color="text-green-600" onClick={() => setModal(buildOwnerDrawsItems())} />
        <KPI label="Owner Projected Draw" value={formatCurrency(ownerProjectedDraw)} icon={DollarSign} color="text-green-700"
          sub="Projected income − all costs, no tax reserve"
          onClick={() => {
            const projIncome = jobs.filter(j => ["contracted", "in_progress", "on_hold"].includes(j.status)).reduce((sum, j) => {
              const adjusted = (j.contract_amount || 0) + (j.change_orders_total || 0);
              const writeOff = j.write_off_amount || 0;
              return sum + (adjusted - writeOff);
            }, 0);
            const totalSubLabor = subLaborEntries.reduce((sum, e) => sum + (e.calculated_pay || 0), 0);
            setModal({ title: "Owner Projected Draw — Breakdown", items: [
              { label: "Projected Total Income", sublabel: "Contract + COs for all non-cancelled jobs", amount: projIncome, amountColor: "text-green-600" },
              { label: "− Actual Expenses (Receipts)", sublabel: "Paid receipts logged", amount: -expenses, amountColor: "text-red-600" },
              { label: "− Manager Pay (Paid + Still Owed)", sublabel: `Paid: ${formatCurrency(managerPaid)} · Still owed: ${formatCurrency(projectedManagerPay)}`, amount: -(managerPaid + projectedManagerPay), amountColor: "text-purple-600" },
              { label: "− Sub Labor (All Entries)", sublabel: "All subcontractor work entries (paid + unpaid)", amount: -totalSubLabor, amountColor: "text-blue-600" },
            ], total: ownerProjectedDraw });
          }} />
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