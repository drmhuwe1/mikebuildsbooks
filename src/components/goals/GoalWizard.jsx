import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, ChevronLeft, Target } from "lucide-react";
import { differenceInMonths } from "date-fns";
import { formatCurrency } from "@/lib/formatters";

const BUSINESS_CATS = [
  { value: "business_emergency_fund", label: "Build Business Emergency Fund" },
  { value: "business_cash_reserves", label: "Increase Business Cash Reserves" },
  { value: "purchase_equipment", label: "Purchase Equipment" },
  { value: "reduce_business_debt", label: "Reduce Business Debt" },
  { value: "target_monthly_profit", label: "Reach Target Monthly Profit" },
  { value: "save_for_taxes", label: "Save for Taxes" },
  { value: "hire_employees", label: "Hire Employees" },
  { value: "expand_operations", label: "Expand Operations" },
];

const PERSONAL_CATS = [
  { value: "personal_emergency_fund", label: "Personal Emergency Fund" },
  { value: "debt_payoff", label: "Debt Payoff" },
  { value: "retirement_savings", label: "Retirement Savings" },
  { value: "home_purchase_fund", label: "Home Purchase Fund" },
  { value: "personal_savings_target", label: "Personal Savings Target" },
  { value: "vacation_savings", label: "Vacation Savings" },
  { value: "major_purchase", label: "Major Purchase Planning" },
];

const COMBINED_CATS = [
  { value: "owner_income_target", label: "Owner Income Target" },
  { value: "business_stability_target", label: "Business Stability Target" },
  { value: "combined_net_worth", label: "Combined Net Worth Growth" },
  { value: "lifestyle_income", label: "Lifestyle Income Planning" },
];

const STEPS = ["Goal Type", "Category", "Target Amount", "Target Date", "Review", "Confirm"];

export default function GoalWizard({ open, onClose, onSave }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    goal_type: "", category: "", title: "", target_amount: "",
    current_amount: "0", target_date: "", notes: ""
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const cats = form.goal_type === "business" ? BUSINESS_CATS
    : form.goal_type === "personal" ? PERSONAL_CATS : COMBINED_CATS;

  const monthsToTarget = form.target_date
    ? Math.max(1, differenceInMonths(new Date(form.target_date), new Date()))
    : null;

  const remaining = Math.max(0, parseFloat(form.target_amount || 0) - parseFloat(form.current_amount || 0));
  const monthlyContrib = monthsToTarget ? Math.ceil(remaining / monthsToTarget) : 0;

  const canNext = () => {
    if (step === 0) return !!form.goal_type;
    if (step === 1) return !!form.category;
    if (step === 2) return !!form.target_amount && parseFloat(form.target_amount) > 0;
    if (step === 3) return !!form.target_date;
    return true;
  };

  const handleConfirm = () => {
    const selectedCat = cats.find(c => c.value === form.category);
    onSave({
      title: form.title || selectedCat?.label || form.category,
      category: form.category,
      goal_type: form.goal_type,
      target_amount: parseFloat(form.target_amount),
      current_amount: parseFloat(form.current_amount || 0),
      monthly_contribution: monthlyContrib,
      target_date: form.target_date,
      notes: form.notes,
      status: "active",
    });
    setStep(0);
    setForm({ goal_type: "", category: "", title: "", target_amount: "", current_amount: "0", target_date: "", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> New Financial Goal — Step {step + 1} of {STEPS.length}
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-1 mb-2">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mb-4 font-medium">{STEPS[step]}</p>

        {/* Step 0 - Goal Type */}
        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">What type of goal is this?</p>
            {[
              { value: "business", label: "Business Goal", desc: "Related to your construction business" },
              { value: "personal", label: "Personal Goal", desc: "Your personal financial targets" },
              { value: "combined", label: "Combined Goal", desc: "Bridges both business and personal finances" },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => set("goal_type", opt.value)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${form.goal_type === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
              >
                <p className="text-sm font-semibold">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 1 - Category */}
        {step === 1 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Select the goal category:</p>
            <div className="grid gap-2 max-h-60 overflow-y-auto pr-1">
              {cats.map(c => (
                <button
                  key={c.value}
                  onClick={() => set("category", c.value)}
                  className={`w-full text-left p-2.5 rounded-lg border text-sm transition-all ${form.category === c.value ? "border-primary bg-primary/5 font-medium" : "border-border hover:border-primary/40"}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 - Amounts */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">How much do you need to save or reach?</p>
            <div>
              <Label>Goal Title (optional)</Label>
              <Input placeholder={cats.find(c => c.value === form.category)?.label || "My Goal"} value={form.title} onChange={e => set("title", e.target.value)} />
            </div>
            <div>
              <Label>Target Amount ($) *</Label>
              <Input type="number" placeholder="10000" value={form.target_amount} onChange={e => set("target_amount", e.target.value)} />
            </div>
            <div>
              <Label>Current Amount Already Saved ($)</Label>
              <Input type="number" placeholder="0" value={form.current_amount} onChange={e => set("current_amount", e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 3 - Date */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">When would you like to reach this goal?</p>
            <div>
              <Label>Target Completion Date *</Label>
              <Input type="date" value={form.target_date} onChange={e => set("target_date", e.target.value)} />
            </div>
            {form.target_date && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <p>📅 That's <strong>{monthsToTarget} months</strong> from now.</p>
                <p>💰 Recommended monthly contribution: <strong className="text-primary">{formatCurrency(monthlyContrib)}</strong></p>
              </div>
            )}
          </div>
        )}

        {/* Step 4 - Review */}
        {step === 4 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Review your goal before saving:</p>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Goal</span><span className="font-semibold">{form.title || cats.find(c => c.value === form.category)?.label}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-semibold capitalize">{form.goal_type}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Target</span><span className="font-semibold">{formatCurrency(parseFloat(form.target_amount || 0))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Currently Saved</span><span className="font-semibold">{formatCurrency(parseFloat(form.current_amount || 0))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Target Date</span><span className="font-semibold">{form.target_date}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Recommended Monthly</span><span className="font-semibold text-primary">{formatCurrency(monthlyContrib)}</span></div>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input placeholder="Any notes about this goal..." value={form.notes} onChange={e => set("notes", e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 5 - Confirm */}
        {step === 5 && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <p className="font-semibold text-lg">Ready to save this goal?</p>
            <p className="text-sm text-muted-foreground">Your goal will be tracked automatically and you'll receive progress updates.</p>
            <Button className="w-full" onClick={handleConfirm}>Save Goal & Start Tracking</Button>
          </div>
        )}

        {step < 5 && (
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => step === 0 ? onClose() : setStep(s => s - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> {step === 0 ? "Cancel" : "Back"}
            </Button>
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}