import React from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export default function WeeklyMonthlyPlanner({ bills, jobs, subPayments, contracts }) {
  const [expanded, setExpanded] = useState("week");
  const today = new Date().toISOString().split("T")[0];
  const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
  const monthFromNow = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const billsThisWeek = (bills || []).filter(b => b.status !== "paid" && b.due_date >= today && b.due_date <= weekFromNow);
  const billsThisMonth = (bills || []).filter(b => b.status !== "paid" && b.due_date > weekFromNow && b.due_date <= monthFromNow);
  const jobsClosingSoon = (jobs || []).filter(j => j.projected_completion && j.projected_completion >= today && j.projected_completion <= monthFromNow && ["in_progress", "contracted"].includes(j.status));
  const awaitingSignature = (contracts || []).filter(c => ["draft", "sent"].includes(c.status));
  const pendingSub = (subPayments || []).filter(p => p.status === "pending");

  const Section = ({ title, period, items, renderItem }) => (
    <div>
      <button
        className="w-full flex items-center justify-between py-2 text-left"
        onClick={() => setExpanded(expanded === period ? null : period)}
      >
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {expanded === period ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {expanded === period && (
        <div className="space-y-1.5 pb-3">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">Nothing to review — you're all caught up!</p>
          ) : items.map((item, i) => renderItem(item, i))}
        </div>
      )}
    </div>
  );

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Weekly & Monthly Planner</h3>
          <p className="text-xs text-muted-foreground">What's coming up</p>
        </div>
      </div>

      <div className="divide-y divide-border">
        <Section
          title={`This Week — ${billsThisWeek.length} bills (${formatCurrency(billsThisWeek.reduce((s, b) => s + (b.amount || 0), 0))})`}
          period="week"
          items={[...billsThisWeek, ...pendingSub.slice(0, 2), ...awaitingSignature.slice(0, 2)]}
          renderItem={(item, i) => (
            <div key={i} className="flex justify-between text-xs py-1 px-2 rounded bg-muted">
              <span className="text-foreground">{item.title || item.subcontractor_name || "Contract"}</span>
              <span className="font-medium">{formatCurrency(item.amount || item.contract_amount)} · {formatDate(item.due_date || item.payment_date)}</span>
            </div>
          )}
        />
        <Section
          title={`This Month — ${billsThisMonth.length} bills + ${jobsClosingSoon.length} jobs closing`}
          period="month"
          items={[...billsThisMonth, ...jobsClosingSoon]}
          renderItem={(item, i) => (
            <div key={i} className="flex justify-between text-xs py-1 px-2 rounded bg-muted">
              <span className="text-foreground">{item.title}</span>
              <span className="font-medium">{formatCurrency(item.amount || item.contract_amount)} · {formatDate(item.due_date || item.projected_completion)}</span>
            </div>
          )}
        />
        <Section
          title={`Contracts Awaiting Signature — ${awaitingSignature.length}`}
          period="contracts"
          items={awaitingSignature}
          renderItem={(item, i) => (
            <div key={i} className="flex justify-between text-xs py-1 px-2 rounded bg-muted">
              <span className="text-foreground">{item.title}</span>
              <span className="font-medium capitalize">{item.status} · {formatCurrency(item.contract_amount)}</span>
            </div>
          )}
        />
      </div>
    </Card>
  );
}