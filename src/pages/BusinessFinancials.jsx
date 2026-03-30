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
  const { data: managerPayments = [] } = useQuery({ queryKey: ["managerPayments"], queryFn: () => base44.entities.ManagerPayment.list("-payment_date", 500), ...queryOpts });

  const s = settings[0] || {};
  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.slice(0, 7);

  // Jobs are the ONLY source of truth for all revenue calculations.
  // Contracts are never used for financial figures — jobs hold all data.

  const totalRevenue = useMemo(() => {
    return jobs.reduce((sum, j) => sum + (j.deposits_received || 0), 0);
  }, [jobs]);
  
  // Actual total expenses from JobReceipts page + subcontractors paid YTD
  const actualExpenses = useMemo(() => {
    const receiptsTotal = jobReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);
    const ledgerSubPaidTotal = ledgerPayments.filter(p => p.is_paid).reduce((sum, p) => sum + (p.amount_paid || 0), 0);
    const workEntrySubPaidTotal = subLabor.filter(s => s.payment_status === "Paid").reduce((sum, s) => sum + (s.calculated_pay || 0), 0);
    return receiptsTotal + ledgerSubPaidTotal + workEntrySubPaidTotal;
  }, [jobReceipts, ledgerPayments, subLabor]);
  
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
  // Projected job expenses always includes ALL jobs (started or not) for savings planning
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
  const managerPct = s.manager_pay_percent ?? 10;
  const grossProfit = totalRevenue - actualExpenses;
  // Manager pay = 10% of (revenue minus receipts/materials only) — sub labor is NOT deducted from manager pay basis
  const managerPayBasis = Math.max(0, totalRevenue - receiptTotal);
  const managerPay = managerPayBasis * (managerPct / 100);
  const projectedGrossProfit = totalBidAmount - (actualExpenses + jobExpenses);
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
  const managerPaid = useMemo(() => {
    const fromTxns = txns.filter(t => t.category === "payroll" && t.type === "outflow").reduce((sum, t) => sum + (t.amount || 0), 0);
    const fromManagerPayments = managerPayments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
    return fromTxns + fromManagerPayments;
  }, [txns, managerPayments]);

  // Projected payments from active/contracted jobs (unlinked only)
  const projectedSubPay = useMemo(() => {
    return unlinkedJobs.filter(j => ["in_progress", "contracted"].includes(j.status))
      .reduce((sum, j) => sum + (j.subcontractor_costs || 0), 0);
  }, [unlinkedJobs]);

  // Current subcontractor payout for active/contracted jobs only
  const currentSubPayouts = useMemo(() => {
    const activeJobIds = new Set(jobs.filter(j => ["in_progress", "contracted"].includes(j.status)).map(j => j.id));
    const ledgerTotal = ledgerPayments.filter(p => activeJobIds.has(p.job_id)).reduce((sum, p) => sum + (p.amount_paid || 0), 0);
    const laborTotal = subLabor.filter(s => activeJobIds.has(s.job_id)).reduce((sum, s) => sum + (s.calculated_pay || 0), 0);
    return ledgerTotal + laborTotal;
  }, [jobs, ledgerPayments, subLabor]);
  
  const projectedManagerPay = Math.max(0, projectedManagerPayRecalc - managerPaid);
  const ownerProjectedDraw = Math.max(0, totalRevenue - (actualExpenses + jobExpenses) - projectedManagerPay);
  const projectedNetProfit = projectedGrossProfit - projectedManagerPay;

  const cashOnHand = useMemo(() => txns.reduce((sum, t) => t.type === "inflow" ? sum + (t.amount || 0) : sum - (t.amount || 0), 0), [txns]);
  const taxReserve = Math.max(0, netProfit * ((s.tax_reserve_percent || 25) / 100));
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
      <PageHeader title="Business Financials" description="Track all business income, expenses, and financial health.">
        <Button variant="outline" size="sm" onClick={() => setShowReceipts(true)} className="gap-1.5">
          <Receipt className="w-4 h-4" /> View Receipts
        </Button>
      </PageHeader>
      <ReceiptsViewer open={showReceipts} onOpenChange={setShowReceipts} />

      <AssistantPrompts prompts={prompts} />

      <BusinessKPIBar
        revenue={totalRevenue} expenses={actualExpenses} jobExpenses={jobExpenses} projectedExpenses={projectedExpenses} grossProfit={grossProfit}
        projectedGrossProfit={projectedGrossProfit}
        netProfit={netProfit} projectedNetProfit={projectedNetProfit} cashOnHand={cashOnHand} taxReserve={taxReserve}
        receivables={receivables} overdueAmount={overdueAmount} dueSoon={dueSoon}
        ownerDraws={ownerDraws}
        subPaid={subPaid} managerPaid={managerPaid}
        projectedSubPay={projectedSubPay} projectedManagerPay={projectedManagerPay}
        currentSubPayouts={currentSubPayouts}
        jobs={jobs} contracts={contracts} bills={bills} txns={txns}
        ledgerPayments={ledgerPayments} jobReceipts={jobReceipts} subPayments={ledgerPayments} subLaborEntries={subLabor} settings={s}
        managerPayments={managerPayments}
        ownerProjectedDraw={ownerProjectedDraw}
        managerPayTotal={managerPay}
      />

      <FinancialHealthScore type="business" jobs={jobs} bills={bills} txns={txns} cashOnHand={cashOnHand} netProfit={netProfit} />

      <PayoutSummaryCards subPayments={ledgerPayments} subLaborEntries={subLabor} managerPayments={managerPayments} settings={s} />

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