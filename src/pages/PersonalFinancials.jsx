import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import FinancialHealthScore from "@/components/finance/FinancialHealthScore";
import PersonalKPIBar from "@/components/finance/PersonalKPIBar";
import PersonalCharts from "@/components/finance/PersonalCharts";
import PersonalProjections from "@/components/finance/PersonalProjections";
import AssistantPrompts from "@/components/finance/AssistantPrompts";
import { formatCurrency } from "@/lib/formatters";

export default function PersonalFinancials() {
  const [tab, setTab] = useState("overview");

  const { data: personalBills = [] } = useQuery({ queryKey: ["personalBills"], queryFn: () => base44.entities.PersonalBill.list("-due_date", 500) });
  const { data: txns = [] } = useQuery({ queryKey: ["transactions"], queryFn: () => base44.entities.BankTransaction.list("-date", 500) });

  const today = new Date().toISOString().split("T")[0];

  const monthlyObligations = useMemo(() =>
    personalBills.filter(b => b.is_recurring && b.status !== "cancelled").reduce((s, b) => s + (b.amount || 0), 0),
  [personalBills]);

  const ownerIncome = useMemo(() =>
    txns.filter(t => t.category === "owner_draw" && t.type === "inflow").reduce((s, t) => s + (t.amount || 0), 0),
  [txns]);

  const totalPersonalExpenses = useMemo(() =>
    personalBills.filter(b => b.status === "paid").reduce((s, b) => s + (b.amount || 0), 0),
  [personalBills]);

  const overdueBills = personalBills.filter(b => b.status !== "paid" && b.due_date < today);
  const overdueAmount = overdueBills.reduce((s, b) => s + (b.amount || 0), 0);

  const dueSoon = personalBills.filter(b =>
    b.status !== "paid" && b.due_date >= today &&
    b.due_date <= new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]
  );

  const savingsTotal = personalBills.filter(b => b.category === "savings" && b.status === "paid").reduce((s, b) => s + (b.amount || 0), 0);
  const debtPayments = personalBills.filter(b => b.category === "debt" && b.status === "paid").reduce((s, b) => s + (b.amount || 0), 0);
  const surplus = ownerIncome - totalPersonalExpenses;

  const prompts = useMemo(() => {
    const msgs = [];
    if (overdueAmount > 0) msgs.push({ variant: "error", message: `You have ${formatCurrency(overdueAmount)} in overdue personal bills. Address these immediately.` });
    if (dueSoon.length > 0) msgs.push({ variant: "warning", message: `${dueSoon.length} personal bill(s) due within 7 days totaling ${formatCurrency(dueSoon.reduce((s, b) => s + (b.amount || 0), 0))}.` });
    if (surplus < 0) msgs.push({ variant: "error", message: `Your personal expenses exceed your owner income this period by ${formatCurrency(Math.abs(surplus))}. Consider a business distribution.` });
    if (surplus > 0) msgs.push({ variant: "success", message: `You have a personal monthly surplus of ${formatCurrency(surplus)}. Consider directing some to savings or debt payoff.` });
    if (savingsTotal === 0) msgs.push({ variant: "info", message: `No savings transfers recorded. Consider setting up a recurring savings goal.` });
    return msgs;
  }, [overdueAmount, dueSoon, surplus, savingsTotal]);

  return (
    <div className="space-y-5">
      <PageHeader title="Personal Financials" description="Your personal income, expenses, savings, and financial position" />

      <AssistantPrompts prompts={prompts} />

      <PersonalKPIBar
        ownerIncome={ownerIncome} monthlyObligations={monthlyObligations}
        surplus={surplus} savingsTotal={savingsTotal} debtPayments={debtPayments}
        overdueAmount={overdueAmount}
      />

      <FinancialHealthScore type="personal" personalBills={personalBills} ownerIncome={ownerIncome} surplus={surplus} savingsTotal={savingsTotal} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Charts</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "overview" && <PersonalCharts personalBills={personalBills} txns={txns} />}
      {tab === "projections" && <PersonalProjections personalBills={personalBills} ownerIncome={ownerIncome} surplus={surplus} />}
    </div>
  );
}