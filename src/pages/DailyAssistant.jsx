import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { buildActionItems, buildHealthMetrics } from "@/lib/assistantLogic";
import ActionItem from "@/components/assistant/ActionItem";

import WeeklyMonthlyPlanner from "@/components/assistant/WeeklyMonthlyPlanner";
import AllocationGuide from "@/components/assistant/AllocationGuide";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORY_LABELS = {
  billing: "Bills & Payments",
  subcontractors: "Subcontractors",
  contracts: "Contracts & Estimates",
  jobs: "Job Management",
  banking: "Banking",
};

const CATEGORY_COLORS = {
  billing: "bg-red-100 text-red-700",
  subcontractors: "bg-orange-100 text-orange-700",
  contracts: "bg-blue-100 text-blue-700",
  jobs: "bg-yellow-100 text-yellow-700",
  banking: "bg-purple-100 text-purple-700",
};

export default function DailyAssistant() {
  const [dismissed, setDismissed] = useState({});

  const { data: jobs = [], refetch: refetchJobs } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 200) });
  const { data: bills = [] } = useQuery({ queryKey: ["bills"], queryFn: () => base44.entities.Bill.list("-due_date", 200) });
  const { data: subPayments = [] } = useQuery({ queryKey: ["subPayments"], queryFn: () => base44.entities.SubcontractorPayment.list("-created_date", 100) });
  const { data: bankAccounts = [] } = useQuery({ queryKey: ["bankAccounts"], queryFn: () => base44.entities.BankAccount.list() });
  const { data: contracts = [] } = useQuery({ queryKey: ["contracts"], queryFn: () => base44.entities.Contract.list("-created_date", 100) });
  const { data: bids = [] } = useQuery({ queryKey: ["bids"], queryFn: () => base44.entities.Bid.list("-created_date", 100) });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });
  const { data: transactions = [] } = useQuery({ queryKey: ["transactions"], queryFn: () => base44.entities.BankTransaction.list("-date", 100) });

  const s = settings[0] || {};
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const allData = { jobs, bills, subPayments, bankAccounts, contracts, bids, settings: s, transactions };
  const actionItems = buildActionItems(allData).filter(item => !dismissed[item.id]);
  const metrics = buildHealthMetrics(allData);

  const grouped = {};
  actionItems.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  const urgentCount = actionItems.filter(i => i.priority <= 2).length;
  const highCount = actionItems.filter(i => i.priority === 3).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Daily Business Assistant</h2>
          </div>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          {urgentCount > 0 && <Badge className="bg-red-100 text-red-700">{urgentCount} Urgent</Badge>}
          {highCount > 0 && <Badge className="bg-orange-100 text-orange-700">{highCount} High Priority</Badge>}
          {actionItems.length === 0 && <Badge className="bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> All caught up!</Badge>}
        </div>
      </div>

      {/* Action List */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">What Needs Attention Today</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {actionItems.length === 0 ? "No actions needed — great job!" : `${actionItems.length} item(s) need your attention`}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setDismissed({})}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reset
          </Button>
        </div>

        {actionItems.length === 0 ? (
          <div className="flex items-center gap-3 px-4 py-6 rounded-lg bg-green-50 border border-green-200 text-green-800">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-medium">Everything is on track!</p>
              <p className="text-xs text-green-700 mt-0.5">No urgent tasks, missing data, or overdue items detected. Check back tomorrow.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[category] || "bg-muted text-muted-foreground"}`}>
                    {CATEGORY_LABELS[category] || category}
                  </span>
                  <span className="text-xs text-muted-foreground">{items.length} item(s)</span>
                </div>
                <div className="space-y-2">
                  {items.map(item => (
                    <ActionItem
                      key={item.id}
                      item={item}
                      onDismiss={(id) => setDismissed(d => ({ ...d, [id]: true }))}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Allocation Guide */}
      <AllocationGuide metrics={metrics} settings={s} />

      {/* Weekly/Monthly Planner */}
      <WeeklyMonthlyPlanner bills={bills} jobs={jobs} subPayments={subPayments} contracts={contracts} />

      {/* Missing Information Summary */}
      <MissingInfoPanel jobs={jobs} bills={bills} contracts={contracts} subPayments={subPayments} transactions={transactions} />
    </div>
  );
}

function MissingInfoPanel({ jobs, bills, contracts, subPayments, transactions }) {
  const issues = [];

  (jobs || []).forEach(j => {
    if (["in_progress", "contracted"].includes(j.status)) {
      if (!j.contract_amount) issues.push({ text: `Job "${j.title}" has no contract amount`, link: "/Jobs", severity: "high" });
      if (!j.projected_completion) issues.push({ text: `Job "${j.title}" is missing a projected completion date`, link: "/Jobs", severity: "medium" });
      if (!j.material_costs && !j.labor_costs) issues.push({ text: `Job "${j.title}" has no cost data entered`, link: "/Jobs", severity: "high" });
      if (!j.scope) issues.push({ text: `Job "${j.title}" has no scope of work description`, link: "/Jobs", severity: "low" });
    }
  });

  (contracts || []).forEach(c => {
    if (!c.payment_schedule) issues.push({ text: `Contract "${c.title}" has no payment schedule`, link: "/Contracts", severity: "medium" });
    if (!c.deposit_amount) issues.push({ text: `Contract "${c.title}" has no deposit amount set`, link: "/Contracts", severity: "medium" });
  });

  (bills || []).filter(b => !b.due_date).forEach(b => {
    issues.push({ text: `Bill "${b.title}" is missing a due date`, link: "/BillsCalendar", severity: "medium" });
  });

  const uncategorized = (transactions || []).filter(t => !t.is_categorized);
  if (uncategorized.length > 0) {
    issues.push({ text: `${uncategorized.length} bank transaction(s) have not been categorized`, link: "/Banking", severity: "medium" });
  }

  if (issues.length === 0) return null;

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold mb-1">Missing Information Alerts</h3>
      <p className="text-xs text-muted-foreground mb-4">These gaps could lead to mistakes or incorrect financial reports. Fix them to keep your records accurate.</p>
      <div className="space-y-2">
        {issues.map((issue, i) => (
          <ActionItem
            key={i}
            item={{
              id: `missing_${i}`,
              icon: "AlertTriangle",
              color: issue.severity === "high" ? "red" : issue.severity === "medium" ? "yellow" : "blue",
              title: issue.text,
              link: issue.link,
            }}
          />
        ))}
      </div>
    </Card>
  );
}