import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

const STEPS = ["Summary", "Revenue", "Expenses", "Goals", "Complete"];

export default function MonthlyReviewWizard({ open, onClose, jobs, bills, personalBills, goals }) {
  const [step, setStep] = useState(0);

  const completedThisMonth = jobs.filter(j => j.status === "completed" && j.actual_completion >= new Date(new Date().setDate(1)).toISOString().split("T")[0]);
  const inProgressJobs = jobs.filter(j => j.status === "in_progress");
  const monthlyRevenue = jobs.filter(j => j.created_date >= new Date(new Date().setDate(1)).toISOString().split("T")[0]).reduce((s, j) => s + (j.contract_amount || 0), 0);
  const monthlyExpenses = bills.filter(b => b.created_date >= new Date(new Date().setDate(1)).toISOString().split("T")[0]).reduce((s, b) => s + (b.amount || 0), 0);
  const monthlyProfit = monthlyRevenue - monthlyExpenses;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Monthly Operations Review — Step {step + 1} of {STEPS.length}</DialogTitle></DialogHeader>

        {/* Progress */}
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {/* Step 0 - Summary */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Here's your month at a glance.</p>
            <Card className="p-4 space-y-3">
              <div className="flex justify-between"><span className="text-muted-foreground">Jobs Completed</span><span className="font-bold">{completedThisMonth.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Jobs In Progress</span><span className="font-bold">{inProgressJobs.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Revenue</span><span className="font-bold text-green-600">{formatCurrency(monthlyRevenue)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Expenses</span><span className="font-bold text-red-600">{formatCurrency(monthlyExpenses)}</span></div>
              <div className="border-t pt-3 flex justify-between"><span className="font-semibold">Profit</span><span className={`font-bold text-lg ${monthlyProfit > 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(monthlyProfit)}</span></div>
            </Card>
          </div>
        )}

        {/* Step 1 - Revenue */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Revenue Performance</p>
            <Card className="p-4">
              <p className="text-3xl font-bold text-green-600">{formatCurrency(monthlyRevenue)}</p>
              <p className="text-sm text-muted-foreground mt-2">{completedThisMonth.length} jobs completed this month</p>
            </Card>
          </div>
        )}

        {/* Step 2 - Expenses */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Expense Overview</p>
            <Card className="p-4">
              <p className="text-3xl font-bold text-red-600">{formatCurrency(monthlyExpenses)}</p>
              <p className="text-sm text-muted-foreground mt-2">{bills.filter(b => b.status === "paid").length} bills paid</p>
            </Card>
          </div>
        )}

        {/* Step 3 - Goals */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Financial Goals Progress</p>
            {goals.slice(0, 3).map(g => (
              <Card key={g.id} className="p-4">
                <p className="font-semibold text-sm">{g.title}</p>
                <div className="mt-2 w-full bg-muted rounded-full h-2">
                  <div className="bg-primary rounded-full h-2" style={{ width: `${Math.min(100, (g.current_amount / g.target_amount) * 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{formatCurrency(g.current_amount)} of {formatCurrency(g.target_amount)}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Step 4 - Complete */}
        {step === 4 && (
          <div className="text-center space-y-4 py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="font-semibold text-lg">Monthly Review Complete!</p>
            <p className="text-sm text-muted-foreground">Great work this month. Keep up the momentum!</p>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => step === 0 ? onClose() : setStep(s => s - 1)}>
            <ChevronLeft className="w-4 h-4 mr-1" /> {step === 0 ? "Close" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={onClose}>Done</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}