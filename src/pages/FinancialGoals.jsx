import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Target, Download } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import GoalCard from "@/components/goals/GoalCard";
import GoalWizard from "@/components/goals/GoalWizard";
import GoalEditDialog from "@/components/goals/GoalEditDialog";
import GoalsDashboardSummary from "@/components/goals/GoalsDashboardSummary";
import StrategyInsightsPanel from "@/components/goals/StrategyInsightsPanel";
import EmptyState from "@/components/shared/EmptyState";

export default function FinancialGoals() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [tab, setTab] = useState("all");
  const qc = useQueryClient();

  const { data: goals = [] } = useQuery({ queryKey: ["goals"], queryFn: () => base44.entities.FinancialGoal.list("-created_date", 200) });
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 200) });
  const { data: bills = [] } = useQuery({ queryKey: ["bills"], queryFn: () => base44.entities.Bill.list("-due_date", 200) });
  const { data: personalBills = [] } = useQuery({ queryKey: ["personalBills"], queryFn: () => base44.entities.PersonalBill.list("-due_date", 200) });
  const { data: transactions = [] } = useQuery({ queryKey: ["transactions"], queryFn: () => base44.entities.BankTransaction.list("-date", 200) });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FinancialGoal.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals"] }); setWizardOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FinancialGoal.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals"] }); setEditGoal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FinancialGoal.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });

  const handleSaveEdit = (form) => {
    updateMutation.mutate({ id: form.id, data: form });
  };

  const filtered = tab === "all" ? goals
    : tab === "completed" ? goals.filter(g => g.status === "completed" || g.current_amount >= g.target_amount)
    : goals.filter(g => g.goal_type === tab && g.status !== "completed");

  const handleExportCSV = () => {
    const rows = [
      ["Title", "Type", "Category", "Target", "Current", "Progress%", "Monthly", "Target Date", "Status"],
      ...goals.map(g => [
        g.title, g.goal_type, g.category,
        g.target_amount, g.current_amount,
        g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0,
        g.monthly_contribution, g.target_date, g.status
      ])
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "financial-goals.csv"; a.click();
  };

  return (
    <div>
      <PageHeader
        title="Financial Goals"
        description="Set targets, track progress, and reach your financial goals"
        actionLabel="New Goal"
        onAction={() => setWizardOpen(true)}
      >
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </PageHeader>

      <GoalsDashboardSummary goals={goals} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="combined">Combined</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No goals yet"
              description="Create your first financial goal to start tracking progress."
              actionLabel="New Goal"
              onAction={() => setWizardOpen(true)}
            />
          ) : (
            <div className="grid gap-3">
              {filtered.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={setEditGoal}
                  onDelete={deleteMutation.mutate}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <StrategyInsightsPanel
            goals={goals}
            jobs={jobs}
            bills={bills}
            personalBills={personalBills}
            transactions={transactions}
          />
        </div>
      </div>

      <GoalWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSave={createMutation.mutate}
      />

      <GoalEditDialog
        open={!!editGoal}
        onClose={() => setEditGoal(null)}
        goal={editGoal}
        onSave={handleSaveEdit}
      />
    </div>
  );
}