import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/shared/PageHeader";
import AssistantPrompts from "@/components/finance/AssistantPrompts";
import OwnerDistributionEngine from "@/components/finance/OwnerDistributionEngine";
import CombinedCharts from "@/components/finance/CombinedCharts";
import FinancialHealthScore from "@/components/finance/FinancialHealthScore";
import { formatCurrency } from "@/lib/formatters";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";

export default function FinancialSnapshot() {
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 500) });
   const { data: bills = [] } = useQuery({ queryKey: ["bills"], queryFn: () => base44.entities.Bill.list("-due_date", 500) });
   const { data: personalBills = [] } = useQuery({ queryKey: ["personalBills"], queryFn: () => base44.entities.PersonalBill.list("-due_date", 500) });
   const { data: txns = [] } = useQuery({ queryKey: ["transactions"], queryFn: () => base44.entities.BankTransaction.list("-date", 500) });
   const { data: contracts = [] } = useQuery({ queryKey: ["contracts"], queryFn: () => base44.entities.Contract.list("-created_date", 500) });
   const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });

  const s = settings[0] || {};
  const today = new Date().toISOString().split("T")[0];

  const totalRevenue = jobs.reduce((sum, j) => sum + (j.contract_amount || 0) + (j.change_orders_total || 0), 0);
  const totalExpenses = jobs.reduce((sum, j) => sum + (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0), 0);
  const grossProfit = totalRevenue - totalExpenses;
  const managerPct = s.manager_pay_percent ?? 10;
  const netProfit = grossProfit - Math.max(0, grossProfit * (managerPct / 100));
  const cashOnHand = txns.reduce((sum, t) => t.type === "inflow" ? sum + (t.amount || 0) : sum - (t.amount || 0), 0);
  // Tax reserve based on what's actually been collected (contracts)
  const totalCollected = contracts.reduce((sum, c) => sum + (c.client_paid_amount || 0), 0);
  const taxReserve = totalCollected * ((s.tax_reserve_percent || 25) / 100);
  const bizBillsDue30 = bills.filter(b => b.status !== "paid" && b.due_date >= today && b.due_date <= new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]).reduce((s, b) => s + (b.amount || 0), 0);
  const ownerDrawsPaid = txns.filter(t => t.category === "owner_draw" && t.type === "outflow").reduce((s, t) => s + (t.amount || 0), 0);
  const personalObligations = personalBills.filter(b => b.status !== "paid" && b.due_date >= today && b.due_date <= new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]).reduce((s, b) => s + (b.amount || 0), 0);
  const personalIncome = txns.filter(t => t.category === "owner_draw" && t.type === "inflow").reduce((s, t) => s + (t.amount || 0), 0);
  const personalExpenses = personalBills.filter(b => b.status === "paid").reduce((s, b) => s + (b.amount || 0), 0);
  const personalSurplus = personalIncome - personalExpenses;

  const prompts = useMemo(() => {
    const msgs = [];
    // Available after all business obligations (bills + receivables coverage)
    const outstandingReceivables = (contracts || []).reduce((sum, c) => sum + Math.max(0, (c.contract_amount || 0) - (c.client_paid_amount || 0)), 0);
    const safeAfterBiz = cashOnHand - bizBillsDue30;
    if (safeAfterBiz > 5000) msgs.push({ variant: "success", message: `After covering business bills due soon, you have ~${formatCurrency(safeAfterBiz)} available. A conservative owner draw is feasible.` });
    if (safeAfterBiz < 0) msgs.push({ variant: "error", message: `Business cash flow is tight. Bills due exceed cash on hand.` });
    if (outstandingReceivables > 0) msgs.push({ variant: "warning", message: `You have ${formatCurrency(outstandingReceivables)} in outstanding contract receivables. Collect these to strengthen cash flow.` });
    if (personalObligations > personalIncome) msgs.push({ variant: "warning", message: `Your personal bills due this month (${formatCurrency(personalObligations)}) may exceed your recent owner income (${formatCurrency(personalIncome)}).` });
    if (personalSurplus > 0) msgs.push({ variant: "info", message: `Personal finances show a surplus of ${formatCurrency(personalSurplus)}. Consider directing this to savings or debt payoff.` });
    return msgs;
  }, [cashOnHand, bizBillsDue30, personalObligations, personalIncome, personalSurplus, contracts]);

  const connectors = [
    { label: "Business Cash Available", value: formatCurrency(cashOnHand), trend: cashOnHand > 0, link: "/BusinessFinancials" },
    { label: "Biz Bills Due 30 Days", value: formatCurrency(bizBillsDue30), trend: false, link: "/BillsCalendar" },
    { label: "Tax Reserve Needed", value: formatCurrency(taxReserve), trend: null, link: "/PayoutEngine" },
    { label: "Owner Draws Paid", value: formatCurrency(ownerDrawsPaid), trend: null, link: "/Banking" },
    { label: "Personal Bills Due Soon", value: formatCurrency(personalObligations), trend: false, link: "/PersonalBills" },
    { label: "Personal Surplus/Deficit", value: formatCurrency(personalSurplus), trend: personalSurplus >= 0, link: "/PersonalFinancials" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Combined Financial Snapshot" description="See how your business and personal finances connect" />

      <AssistantPrompts prompts={prompts} />

      {/* Connector Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
         {connectors.map(c => (
           <Link key={c.label} to={c.link}>
             <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer group">
               <p className="text-xs text-muted-foreground mb-1 truncate">{c.label}</p>
               <div className="flex flex-col gap-2">
                 <p className={`text-base sm:text-lg font-bold break-words ${c.trend === true ? "text-green-600" : c.trend === false ? "text-red-600" : ""}`}>{c.value}</p>
                 <div className="flex gap-1 shrink-0">
                   {c.trend === true && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
                   {c.trend === false && <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                   <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
               </div>
             </Card>
           </Link>
         ))}
       </div>

      {/* Health Scores */}
      <div className="grid md:grid-cols-3 gap-4">
        <FinancialHealthScore type="business" jobs={jobs} bills={bills} txns={txns} cashOnHand={cashOnHand} netProfit={netProfit} compact />
        <FinancialHealthScore type="personal" personalBills={personalBills} ownerIncome={personalIncome} surplus={personalSurplus} savingsTotal={0} compact />
        <FinancialHealthScore type="combined" jobs={jobs} bills={bills} personalBills={personalBills} cashOnHand={cashOnHand} netProfit={netProfit} surplus={personalSurplus} compact />
      </div>

      {/* Owner Draw Engine */}
      <OwnerDistributionEngine
        cashOnHand={cashOnHand} bizBillsDue30={bizBillsDue30}
        taxReserve={taxReserve} netProfit={netProfit}
        ownerDrawsPaid={ownerDrawsPaid} personalObligations={personalObligations}
      />

      <CombinedCharts jobs={jobs} txns={txns} personalBills={personalBills} />
    </div>
  );
}