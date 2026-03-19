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
import { formatCurrency } from "@/lib/formatters";
import SubscriptionGate from "@/components/subscription/SubscriptionGate";
import ReceiptsViewer from "@/components/finance/ReceiptsViewer";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";

export default function BusinessFinancials() {
  const [tab, setTab] = useState("overview");
  const [showReceipts, setShowReceipts] = useState(false);

  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 500) });
  const { data: bills = [] } = useQuery({ queryKey: ["bills"], queryFn: () => base44.entities.Bill.list("-due_date", 500) });
  const { data: txns = [] } = useQuery({ queryKey: ["transactions"], queryFn: () => base44.entities.BankTransaction.list("-date", 500) });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });
  const { data: subPayments = [] } = useQuery({ queryKey: ["subPayments"], queryFn: () => base44.entities.SubcontractorPayment.list("-created_date", 500) });
  const { data: contracts = [] } = useQuery({ queryKey: ["contracts"], queryFn: () => base44.entities.Contract.list("-created_date", 500) });
  const { data: jobReceipts = [] } = useQuery({ queryKey: ["all-receipts"], queryFn: () => base44.entities.JobReceipt.list("-date", 500) });

  const s = settings[0] || {};
  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.slice(0, 7);

  const totalRevenue = useMemo(() => {
    const jobRevenue = jobs.reduce((sum, j) => sum + (j.total_paid_by_customer || 0) + (j.change_orders_total || 0), 0);
    const contractRevenue = contracts.reduce((sum, c) => sum + (c.client_paid_amount || 0), 0);
    return jobRevenue + contractRevenue;
  }, [jobs, contracts]);
  const receiptTotal = useMemo(() => jobReceipts.reduce((sum, r) => sum + (r.amount || 0), 0), [jobReceipts]);
  const totalExpenses = useMemo(() => jobs.reduce((sum, j) => sum + (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0), 0) + receiptTotal, [jobs, receiptTotal]);
  const grossProfit = totalRevenue - totalExpenses;
  const managerPct = s.manager_pay_percent ?? 10;
  const managerPay = Math.max(0, grossProfit * (managerPct / 100));
  const netProfit = grossProfit - managerPay;

  const cashOnHand = useMemo(() => txns.reduce((sum, t) => t.type === "inflow" ? sum + (t.amount || 0) : sum - (t.amount || 0), 0), [txns]);
  const taxReserve = Math.max(0, netProfit * ((s.tax_reserve_percent || 25) / 100));
  const overdueAmount = bills.filter(b => b.status !== "paid" && b.due_date < today).reduce((s, b) => s + (b.amount || 0), 0);
  const dueSoon = bills.filter(b => b.status !== "paid" && b.due_date >= today && b.due_date <= new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]).reduce((s, b) => s + (b.amount || 0), 0);
  const receivables = jobs.reduce((sum, j) => sum + Math.max(0, (j.contract_amount || 0) - (j.total_paid_by_customer || 0)), 0);
  const ownerDraws = txns.filter(t => t.category === "owner_draw").reduce((s, t) => s + (t.amount || 0), 0);

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
        revenue={totalRevenue} expenses={totalExpenses} grossProfit={grossProfit}
        netProfit={netProfit} cashOnHand={cashOnHand} taxReserve={taxReserve}
        receivables={receivables} overdueAmount={overdueAmount} dueSoon={dueSoon}
        ownerDraws={ownerDraws}
      />

      <FinancialHealthScore type="business" jobs={jobs} bills={bills} txns={txns} cashOnHand={cashOnHand} netProfit={netProfit} />

      <Tabs value={tab} onValueChange={setTab}>
         <TabsList>
           <TabsTrigger value="overview">Charts</TabsTrigger>
           <TabsTrigger value="ledger">Expense Ledger</TabsTrigger>
           <TabsTrigger value="projections">Projections</TabsTrigger>
         </TabsList>
       </Tabs>

       {tab === "overview" && <BusinessCharts jobs={jobs} bills={bills} txns={txns} />}
       {tab === "ledger" && <ExpenseLedger jobs={jobs} bills={bills} />}
       {tab === "projections" && <BusinessProjections jobs={jobs} bills={bills} cashOnHand={cashOnHand} netProfit={netProfit} />}
    </div>
    </SubscriptionGate>
  );
}