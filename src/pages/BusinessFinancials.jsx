import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import FinancialHealthScore from "@/components/finance/FinancialHealthScore";
import BusinessKPIBar from "@/components/finance/BusinessKPIBar";
import BusinessCharts from "@/components/finance/BusinessCharts";
import BusinessProjections from "@/components/finance/BusinessProjections";
import AssistantPrompts from "@/components/finance/AssistantPrompts";
import ExpenseLedger from "@/components/finance/ExpenseLedger";
import ForecastedPayouts from "@/components/finance/ForecastedPayouts";
import PayoutComparisonSummary from "@/components/finance/PayoutComparisonSummary";
import { formatCurrency } from "@/lib/formatters";
import SubscriptionGate from "@/components/subscription/SubscriptionGate";
import ReceiptsViewer from "@/components/finance/ReceiptsViewer";
import PayoutSummaryCards from "@/components/finance/PayoutSummaryCards";
import OwnerPayoutTracker from "@/components/settings/OwnerPayoutTracker";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";

export default function BusinessFinancials() {
  const [tab, setTab] = useState("overview");
  const [showReceipts, setShowReceipts] = useState(false);
  const [editingJobExpenses, setEditingJobExpenses] = useState({});
  const [detailModal, setDetailModal] = useState(null);

  const queryOpts = { staleTime: 0, refetchOnMount: true };
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 500), ...queryOpts });
  const { data: bills = [] } = useQuery({ queryKey: ["bills"], queryFn: () => base44.entities.Bill.list("-due_date", 500), ...queryOpts });
  const { data: txns = [] } = useQuery({ queryKey: ["transactions"], queryFn: () => base44.entities.BankTransaction.list("-date", 500), ...queryOpts });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }), ...queryOpts });
  const { data: ledgerPayments = [] } = useQuery({ queryKey: ["ledgerPayments"], queryFn: () => base44.entities.SubcontractorLedgerPayment.list("-created_date", 500), ...queryOpts });
  const { data: contracts = [] } = useQuery({ queryKey: ["contracts"], queryFn: () => base44.entities.Contract.list("-created_date", 500), ...queryOpts });
  const { data: jobReceipts = [] } = useQuery({ queryKey: ["all-receipts"], queryFn: () => base44.entities.JobReceipt.list("-date", 500), ...queryOpts });
  const { data: bids = [] } = useQuery({ queryKey: ["bids"], queryFn: () => base44.entities.Bid.list("-created_date", 500), ...queryOpts });
  const { data: subLabor = [] } = useQuery({ queryKey: ["subLabor"], queryFn: () => base44.entities.SubcontractorWorkEntry.list("-created_date", 500), ...queryOpts });

  const s = settings[0] || {};
  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.slice(0, 7);

  // Jobs are the ONLY source of truth for all revenue calculations.
  // Contracts are never used for financial figures — jobs hold all data.

  const totalRevenue = useMemo(() => {
    return jobs.reduce((sum, j) => sum + (j.deposits_received || 0), 0);
  }, [jobs]);
  
  // Actual total expenses from JobReceipts page
  const actualExpenses = useMemo(() => {
    return jobReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [jobReceipts]);
  
  // Projected revenue = sum of bid amounts on all jobs
  const projectedRevenue = useMemo(() => {
    return jobs.reduce((sum, j) => {
      const linkedBid = bids.find(b => b.id === j.bid_id);
      return sum + (linkedBid?.bid_amount || j.contract_amount || 0);
    }, 0);
  }, [jobs, bids]);
  
  // Total bid amounts for projected gross profit
  const totalBidAmount = useMemo(() => {
    return bids.reduce((sum, b) => sum + (b.bid_amount || 0), 0);
  }, [bids]);
  
  // Only count ACTUAL receipts (not estimates) in profit calculations
  const actualReceipts = useMemo(() => jobReceipts.filter(r => !r.is_estimated), [jobReceipts]);
  const estimatedReceipts = useMemo(() => jobReceipts.filter(r => r.is_estimated), [jobReceipts]);
  const receiptTotal = useMemo(() => actualReceipts.reduce((sum, r) => sum + (r.amount || 0), 0), [actualReceipts]);
  const estimatedTotal = useMemo(() => estimatedReceipts.reduce((sum, r) => sum + (r.amount || 0), 0), [estimatedReceipts]);
  
  // All jobs count — jobs are the single source of truth
  const unlinkedJobs = jobs;
  
  const jobSubcontractorCosts = useMemo(() => subLabor.filter(s => s.payment_status === "Paid").reduce((sum, s) => sum + (s.calculated_pay || 0), 0), [subLabor]);
  const actualSubPaidFromJobs = useMemo(() => subLabor.filter(s => s.payment_status === "Paid").reduce((sum, s) => sum + (s.calculated_pay || 0), 0), [subLabor]);
  const jobExpenses = useMemo(() => {
    return unlinkedJobs.reduce((sum, j) => {
      const jobKey = j.id;
      const edited = editingJobExpenses[jobKey];
      if (edited !== undefined) return sum + edited;
      return sum + (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0);
    }, 0);
  }, [unlinkedJobs, editingJobExpenses]);
  const managerExpenses = useMemo(() => unlinkedJobs.reduce((sum, j) => sum + (j.material_costs || 0) + (j.equipment_costs || 0), 0), [unlinkedJobs]);
  const projectedExpenses = useMemo(() => jobExpenses + receiptTotal + estimatedTotal, [jobExpenses, receiptTotal, estimatedTotal]);
  const grossProfit = totalRevenue - actualExpenses;
  const projectedGrossProfit = totalBidAmount - (actualExpenses + jobExpenses);
  const managerPct = s.manager_pay_percent ?? 10;
  // Manager pay: only deduct materials/equipment from jobs that have collected deposits
  const managerExpensesCollected = useMemo(() => {
    return jobs.filter(j => (j.deposits_received || 0) > 0).reduce((sum, j) => sum + (j.material_costs || 0) + (j.equipment_costs || 0), 0);
  }, [jobs]);
  const receiptsCollected = useMemo(() => {
    return jobReceipts.filter(r => jobs.some(j => j.id === r.job_id && (j.deposits_received || 0) > 0)).reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [jobs, jobReceipts]);
  const managerPay = Math.max(0, (totalRevenue - managerExpensesCollected - receiptsCollected) * (managerPct / 100));
  const projectedManagerPayRecalc = managerPay;
  const netProfit = grossProfit - managerPay;

  // YTD actual subcontractor payments (is_paid: true) + SubcontractorWorkEntry paid labor
  const ledgerSubPaid = useMemo(() => 
    ledgerPayments.filter(p => p.is_paid).reduce((sum, p) => sum + (p.amount_paid || 0), 0), 
    [ledgerPayments]
  );
  const workEntrySubPaid = useMemo(() => 
    subLabor.filter(s => s.payment_status === "Paid").reduce((sum, s) => sum + (s.calculated_pay || 0), 0), 
    [subLabor]
  );
  const subPaid = ledgerSubPaid + workEntrySubPaid;
  const managerPaid = useMemo(() => 
    txns.filter(t => t.category === "payroll" && t.type === "outflow").reduce((sum, t) => sum + (t.amount || 0), 0), 
    [txns]
  );

  // Projected payments from active/contracted jobs (unlinked only)
  const projectedSubPay = useMemo(() => {
    return unlinkedJobs.filter(j => ["in_progress", "contracted"].includes(j.status))
      .reduce((sum, j) => sum + (j.subcontractor_costs || 0), 0);
  }, [unlinkedJobs]);
  
  const projectedManagerPay = projectedManagerPayRecalc; // Use actual calculation from above

  const cashOnHand = useMemo(() => txns.reduce((sum, t) => t.type === "inflow" ? sum + (t.amount || 0) : sum - (t.amount || 0), 0), [txns]);
  const taxReserve = totalRevenue * ((s.tax_reserve_percent || 25) / 100);
  const operatingReserve = totalRevenue * ((s.operating_reserve_percent || 5) / 100);
  const overdueAmount = bills.filter(b => b.status !== "paid" && b.due_date < today).reduce((s, b) => s + (b.amount || 0), 0);
  const dueSoon = bills.filter(b => b.status !== "paid" && b.due_date >= today && b.due_date <= new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]).reduce((s, b) => s + (b.amount || 0), 0);
  
  // Outstanding receivables — sum of per-job outstanding balance
  const receivables = useMemo(() => {
    return jobs.reduce((total, j) => {
      const linkedBid = bids.find(b => b.id === j.bid_id);
      const jobEstimate = linkedBid?.bid_amount || j.contract_amount || 0;
      const jobCollected = j.deposits_received || 0;
      const jobOwed = Math.max(0, jobEstimate - jobCollected);
      return total + jobOwed;
    }, 0);
  }, [jobs, bids]);
  const ownerDraws = txns.filter(t => t.category === "owner_draw" && t.type === "outflow").reduce((s, t) => s + (t.amount || 0), 0);

  const prompts = useMemo(() => {
    const msgs = [];
    if (overdueAmount > 0) msgs.push({ variant: "error", message: `You have ${formatCurrency(overdueAmount)} in overdue bills. Pay these to protect vendor relationships.` });
    if (cashOnHand < dueSoon) msgs.push({ variant: "warning", message: `Cash on hand (${formatCurrency(cashOnHand)}) may not cover bills due in 30 days (${formatCurrency(dueSoon)}).` });
    if (netProfit > 0 && cashOnHand > taxReserve * 1.5) msgs.push({ variant: "success", message: `Business is profitable this period. Cash is healthy for a conservative owner draw.` });
    const activeJobs = jobs.filter(j => j.status === "in_progress").length;
    if (activeJobs === 0) msgs.push({ variant: "info", message: `No active jobs right now. Consider pursuing new bids to maintain cash flow.` });
    if (receivables > cashOnHand) msgs.push({ variant: "warning", message: `Outstanding receivables (${formatCurrency(receivables)}) exceed current cash. Chase those payments.` });
    return msgs;
  }, [overdueAmount, cashOnHand, dueSoon, netProfit, taxReserve, jobs, receivables]);

  return (
    <SubscriptionGate feature="businessfinancials">
    <div className="space-y-5">
      <PageHeader title="Business Financials" description="Complete view of your business income, expenses, and financial health">
        <Button variant="outline" size="sm" onClick={() => setShowReceipts(true)} className="gap-1.5">
          <Receipt className="w-4 h-4" /> View Receipts
        </Button>
      </PageHeader>
      <ReceiptsViewer open={showReceipts} onOpenChange={setShowReceipts} />

      <AssistantPrompts prompts={prompts} />



      {detailModal === "actual" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDetailModal(null)}>
          <div className="bg-card border rounded-lg p-6 max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Actual Expenses Breakdown</h3>
            <p className="text-sm text-muted-foreground mb-4">Total from all expenses recorded on the Expenses page (JobReceipts)</p>
            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
              {jobReceipts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No expenses recorded</p>
              ) : (
                jobReceipts.map(r => (
                  <div key={r.id} className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                    <span>{r.description}</span>
                    <span className="font-semibold">{formatCurrency(r.amount)}</span>
                  </div>
                ))
              )}
            </div>
            <p className="text-lg font-bold border-t pt-3">Total: {formatCurrency(actualExpenses)}</p>
            <button onClick={() => setDetailModal(null)} className="mt-4 w-full px-4 py-2 border rounded hover:bg-muted">Close</button>
          </div>
        </div>
      )}

      {detailModal === "projected" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDetailModal(null)}>
          <div className="bg-card border rounded-lg p-6 max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Projected Job Expenses</h3>
            <p className="text-sm text-muted-foreground mb-4">Sum of material, labor, subcontractor, permit, equipment, overhead, and other costs from all jobs</p>
            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
              {unlinkedJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No jobs</p>
              ) : (
                unlinkedJobs.map(j => {
                  const defaultVal = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0);
                  const val = editingJobExpenses[j.id] !== undefined ? editingJobExpenses[j.id] : defaultVal;
                  return (
                    <div key={j.id} className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                      <span className="truncate">{j.title}</span>
                      <span className="font-semibold shrink-0 ml-2">{formatCurrency(val)}</span>
                    </div>
                  );
                })
              )}
            </div>
            <p className="text-lg font-bold border-t pt-3">Total: {formatCurrency(jobExpenses)}</p>
            <button onClick={() => setDetailModal(null)} className="mt-4 w-full px-4 py-2 border rounded hover:bg-muted">Close</button>
          </div>
        </div>
      )}

      {detailModal === "combined" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDetailModal(null)}>
          <div className="bg-card border rounded-lg p-6 max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Total Expenses Summary</h3>
            <div className="space-y-3 mb-4">
              <div className="p-3 bg-muted/30 rounded">
                <p className="text-xs text-muted-foreground">Actual Expenses (from page)</p>
                <p className="text-xl font-bold">{formatCurrency(actualExpenses)}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded">
                <p className="text-xs text-muted-foreground">Projected Job Expenses</p>
                <p className="text-xl font-bold">{formatCurrency(jobExpenses)}</p>
              </div>
              <div className="p-3 bg-primary/10 border border-primary/30 rounded">
                <p className="text-xs text-muted-foreground">Combined Total</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(actualExpenses + jobExpenses)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2">This combined total is subtracted from projected bid amounts to calculate projected profit.</p>
            <button onClick={() => setDetailModal(null)} className="w-full px-4 py-2 border rounded hover:bg-muted">Close</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          onClick={() => setDetailModal("actual")}
          className="bg-card border rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Total Actual Expenses</p>
          <p className="text-2xl font-bold">{formatCurrency(actualExpenses)}</p>
          <p className="text-xs text-muted-foreground mt-2">Click to view</p>
        </div>
        <div
          onClick={() => setDetailModal("projected")}
          className="bg-card border rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Projected Job Expenses</p>
          <p className="text-2xl font-bold">{formatCurrency(jobExpenses)}</p>
          <p className="text-xs text-muted-foreground mt-2">Click to view</p>
        </div>
        <div
          onClick={() => setDetailModal("combined")}
          className="bg-card border rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Total Expenses</p>
          <p className="text-2xl font-bold">{formatCurrency(actualExpenses + jobExpenses)}</p>
          <p className="text-xs text-muted-foreground mt-2">Click to view</p>
        </div>
        <div className="bg-card border border-primary/30 rounded-lg p-4 bg-primary/5">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Projected Profit</p>
          <p className={`text-2xl font-bold ${projectedGrossProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(projectedGrossProfit)}</p>
          <p className="text-xs text-muted-foreground mt-2">Bid amount - expenses</p>
        </div>
      </div>

      <BusinessKPIBar
        revenue={totalRevenue} expenses={actualExpenses} projectedExpenses={projectedExpenses} grossProfit={grossProfit}
        projectedGrossProfit={projectedGrossProfit}
        netProfit={netProfit} cashOnHand={cashOnHand} taxReserve={taxReserve}
        receivables={receivables} overdueAmount={overdueAmount} dueSoon={dueSoon}
        ownerDraws={ownerDraws}
        subPaid={subPaid} managerPaid={managerPaid}
        projectedSubPay={projectedSubPay} projectedManagerPay={projectedManagerPay}
        jobs={jobs} contracts={contracts} bills={bills} txns={txns}
        ledgerPayments={ledgerPayments} jobReceipts={jobReceipts} settings={s}
      />

      <FinancialHealthScore type="business" jobs={jobs} bills={bills} txns={txns} cashOnHand={cashOnHand} netProfit={netProfit} />

      <PayoutSummaryCards subPayments={ledgerPayments} settings={s} />

      <OwnerPayoutTracker />

      <div className="bg-card border rounded-lg p-6 mb-6">
        <p className="text-sm font-semibold mb-3">Edit Projected Job Expenses</p>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {unlinkedJobs.map(j => {
            const defaultVal = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0);
            const val = editingJobExpenses[j.id] !== undefined ? editingJobExpenses[j.id] : defaultVal;
            return (
              <div key={j.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{j.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{j.client_name || 'No client'}</p>
                </div>
                <input
                  type="number"
                  value={val}
                  onChange={e => setEditingJobExpenses(prev => ({ ...prev, [j.id]: parseFloat(e.target.value) || 0 }))}
                  className="w-28 px-2 py-1 border rounded text-sm text-right"
                />
              </div>
            );
          })}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
         <TabsList>
           <TabsTrigger value="overview">Charts</TabsTrigger>
           <TabsTrigger value="payouts">Forecasted Payouts</TabsTrigger>
           <TabsTrigger value="ledger">Expense Ledger</TabsTrigger>
           <TabsTrigger value="projections">Projections</TabsTrigger>
         </TabsList>
       </Tabs>

       {tab === "overview" && <BusinessCharts jobs={jobs} bills={bills} txns={txns} />}
       {tab === "payouts" && <ForecastedPayouts jobs={jobs} bids={bids} settings={s} txns={txns} jobReceipts={jobReceipts} />}
       {tab === "ledger" && <ExpenseLedger jobs={jobs} bills={bills} jobReceipts={jobReceipts} />}
       {tab === "projections" && <BusinessProjections jobs={jobs} bills={bills} cashOnHand={cashOnHand} netProfit={netProfit} />}
    </div>
    </SubscriptionGate>
  );
}