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
  const { data: subPayments = [] } = useQuery({ queryKey: ["subPayments"], queryFn: () => base44.entities.SubcontractorPayment.list("-created_date", 500), ...queryOpts });
  const { data: contracts = [] } = useQuery({ queryKey: ["contracts"], queryFn: () => base44.entities.Contract.list("-created_date", 500), ...queryOpts });
  const { data: jobReceipts = [] } = useQuery({ queryKey: ["all-receipts"], queryFn: () => base44.entities.JobReceipt.list("-date", 500), ...queryOpts });
  const { data: bids = [] } = useQuery({ queryKey: ["bids"], queryFn: () => base44.entities.Bid.list("-created_date", 500), ...queryOpts });

  const s = settings[0] || {};
  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.slice(0, 7);

  // Revenue: jobs are source of truth after contract is signed/active/completed
  const SIGNED_STATUSES = ["signed", "active", "completed"];
  // Jobs are the single source of truth for revenue — avoids double-counting contracts
  const totalRevenue = useMemo(() => {
    return jobs.reduce((sum, j) => sum + (j.total_paid_by_customer || 0), 0);
  }, [jobs]);
  
  const projectedRevenue = useMemo(() => {
    return contracts.reduce((sum, c) => sum + (c.contract_amount || 0), 0);
  }, [contracts]);
  
  // Only count ACTUAL receipts (not estimates) in profit calculations
  const actualReceipts = useMemo(() => jobReceipts.filter(r => !r.is_estimated), [jobReceipts]);
  const estimatedReceipts = useMemo(() => jobReceipts.filter(r => r.is_estimated), [jobReceipts]);
  const receiptTotal = useMemo(() => actualReceipts.reduce((sum, r) => sum + (r.amount || 0), 0), [actualReceipts]);
  const estimatedTotal = useMemo(() => estimatedReceipts.reduce((sum, r) => sum + (r.amount || 0), 0), [estimatedReceipts]);
  
  // Only count job expenses for jobs NOT linked to contracts
  const unlinkedJobIds = new Set(contracts.map(c => c.job_id).filter(Boolean));
  const unlinkedJobs = useMemo(() => jobs.filter(j => !unlinkedJobIds.has(j.id)), [jobs, contracts]);
  
  const jobSubcontractorCosts = useMemo(() => unlinkedJobs.reduce((sum, j) => sum + (j.subcontractor_costs || 0), 0), [unlinkedJobs]);
  const jobExpenses = useMemo(() => unlinkedJobs.reduce((sum, j) => sum + (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0), 0), [unlinkedJobs]);
  const projectedExpenses = useMemo(() => jobExpenses + receiptTotal + estimatedTotal, [jobExpenses, receiptTotal, estimatedTotal]);
  const totalExpenses = jobExpenses + receiptTotal;
  const grossProfit = totalRevenue - totalExpenses;
  const projectedGrossProfit = projectedRevenue - jobExpenses;
  const managerPct = s.manager_pay_percent ?? 10;
  const managerPayBase = Math.max(0, totalRevenue - (totalExpenses - jobSubcontractorCosts));
  const managerPay = Math.max(0, managerPayBase * (managerPct / 100));
  const netProfit = grossProfit - managerPay;

  // YTD actual payments
  const currentYear = new Date().getFullYear().toString();
  const subPaid = useMemo(() => 
    subPayments.filter(p => p.status === "paid" && p.payment_date?.startsWith(currentYear)).reduce((sum, p) => sum + (p.amount || 0), 0), 
    [subPayments, currentYear]
  );
  const managerPaid = useMemo(() => 
    txns.filter(t => t.category === "payroll" && t.type === "outflow" && t.date?.startsWith(currentYear)).reduce((sum, t) => sum + (t.amount || 0), 0), 
    [txns, currentYear]
  );

  // Projected payments from active/contracted jobs (unlinked only)
  const projectedSubPay = useMemo(() => {
    return unlinkedJobs.filter(j => ["in_progress", "contracted"].includes(j.status))
      .reduce((sum, j) => sum + (j.subcontractor_costs || 0), 0);
  }, [unlinkedJobs]);
  
  const jobExpensesExcludingSubs = useMemo(() => unlinkedJobs.reduce((sum, j) => sum + (j.material_costs || 0) + (j.labor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0), 0), [unlinkedJobs]);
  const projectedManagerPay = Math.max(0, projectedRevenue - jobExpensesExcludingSubs - receiptTotal - estimatedTotal) * (managerPct / 100);

  const cashOnHand = useMemo(() => txns.reduce((sum, t) => t.type === "inflow" ? sum + (t.amount || 0) : sum - (t.amount || 0), 0), [txns]);
  const taxReserve = totalRevenue * ((s.tax_reserve_percent || 25) / 100);
  const overdueAmount = bills.filter(b => b.status !== "paid" && b.due_date < today).reduce((s, b) => s + (b.amount || 0), 0);
  const dueSoon = bills.filter(b => b.status !== "paid" && b.due_date >= today && b.due_date <= new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]).reduce((s, b) => s + (b.amount || 0), 0);
  
  // Outstanding receivables — use job payments for signed contracts
  const receivables = useMemo(() => contracts.reduce((sum, c) => {
    const linkedJob = jobs.find(j => j.id === c.job_id);
    const paid = (SIGNED_STATUSES.includes(c.status) && linkedJob)
      ? (linkedJob.total_paid_by_customer || 0)
      : (c.client_paid_amount || 0);
    return sum + Math.max(0, (c.contract_amount || 0) - paid);
  }, 0), [contracts, jobs]);
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
        subPayments={subPayments} jobReceipts={jobReceipts} settings={s}
      />

      <FinancialHealthScore type="business" jobs={jobs} bills={bills} txns={txns} cashOnHand={cashOnHand} netProfit={netProfit} />

      <PayoutSummaryCards subPayments={subPayments} settings={s} />

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
       {tab === "payouts" && <ForecastedPayouts jobs={jobs} bids={bids} settings={s} />}
       {tab === "ledger" && <ExpenseLedger jobs={jobs} bills={bills} />}
       {tab === "projections" && <BusinessProjections jobs={jobs} bills={bills} cashOnHand={cashOnHand} netProfit={netProfit} />}
    </div>
    </SubscriptionGate>
  );
}