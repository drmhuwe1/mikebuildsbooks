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

  const queryOpts = { staleTime: 0, refetchOnMount: true };
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 500), ...queryOpts });
  const { data: bills = [] } = useQuery({ queryKey: ["bills"], queryFn: () => base44.entities.Bill.list("-due_date", 500), ...queryOpts });
  const { data: txns = [] } = useQuery({ queryKey: ["transactions"], queryFn: () => base44.entities.BankTransaction.list("-date", 500), ...queryOpts });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }), ...queryOpts });
  const { data: ledgerPayments = [] } = useQuery({ queryKey: ["ledgerPayments"], queryFn: () => base44.entities.SubcontractorLedgerPayment.list("-created_date", 500), ...queryOpts });
  const { data: contracts = [] } = useQuery({ queryKey: ["contracts"], queryFn: () => base44.entities.Contract.list("-created_date", 500), ...queryOpts });
  const { data: jobReceipts = [] } = useQuery({ queryKey: ["all-receipts"], queryFn: () => base44.entities.JobReceipt.list("-date", 500), ...queryOpts });
  const { data: bids = [] } = useQuery({ queryKey: ["bids"], queryFn: () => base44.entities.Bid.list("-created_date", 500), ...queryOpts });

  const s = settings[0] || {};
  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.slice(0, 7);

  // Jobs are the ONLY source of truth for all revenue calculations.
  // Contracts are never used for financial figures — jobs hold all data.

  const totalRevenue = useMemo(() => {
    return jobs.reduce((sum, j) => sum + (j.deposits_received || 0), 0);
  }, [jobs]);
  
  // Projected revenue = sum of contract_amount on all jobs (what's been contracted)
  const projectedRevenue = useMemo(() => {
    return jobs.reduce((sum, j) => sum + (j.contract_amount || 0) + (j.change_orders_total || 0), 0);
  }, [jobs]);
  
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
  
  const jobSubcontractorCosts = useMemo(() => unlinkedJobs.reduce((sum, j) => sum + (j.subcontractor_costs || 0), 0), [unlinkedJobs]);
  const actualSubPaidFromJobs = useMemo(() => unlinkedJobs.reduce((sum, j) => sum + (j.subcontractor_costs || 0), 0), [unlinkedJobs]);
  const jobExpenses = useMemo(() => unlinkedJobs.reduce((sum, j) => sum + (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0), 0), [unlinkedJobs]);
  const managerExpenses = useMemo(() => unlinkedJobs.reduce((sum, j) => sum + (j.material_costs || 0) + (j.equipment_costs || 0), 0), [unlinkedJobs]);
  const projectedExpenses = useMemo(() => jobExpenses + receiptTotal + estimatedTotal, [jobExpenses, receiptTotal, estimatedTotal]);
  const totalExpenses = jobExpenses + receiptTotal;
  const grossProfit = totalRevenue - totalExpenses;
  const projectedGrossProfit = totalBidAmount - (jobExpenses + estimatedTotal);
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

  // YTD actual subcontractor payments (is_paid: true)
  const subPaid = useMemo(() => 
    ledgerPayments.filter(p => p.is_paid).reduce((sum, p) => sum + (p.amount_paid || 0), 0), 
    [ledgerPayments]
  );
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
  const overdueAmount = bills.filter(b => b.status !== "paid" && b.due_date < today).reduce((s, b) => s + (b.amount || 0), 0);
  const dueSoon = bills.filter(b => b.status !== "paid" && b.due_date >= today && b.due_date <= new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]).reduce((s, b) => s + (b.amount || 0), 0);
  
  // Outstanding receivables — total contract amounts minus collected deposits
  const receivables = useMemo(() => {
    const totalExpected = jobs.reduce((sum, j) => sum + (j.contract_amount || 0) + (j.change_orders_total || 0), 0);
    const totalCollected = jobs.reduce((sum, j) => sum + (j.deposits_received || 0), 0);
    return Math.max(0, totalExpected - totalCollected);
  }, [jobs]);
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

      <BusinessKPIBar
        revenue={totalRevenue} expenses={totalExpenses} projectedExpenses={projectedExpenses} grossProfit={grossProfit}
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

      <Tabs value={tab} onValueChange={setTab}>
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