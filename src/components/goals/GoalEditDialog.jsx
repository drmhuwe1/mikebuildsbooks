import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const ALL_CATS = [
  { value: "business_emergency_fund", label: "Business Emergency Fund" },
  { value: "business_cash_reserves", label: "Business Cash Reserves" },
  { value: "purchase_equipment", label: "Purchase Equipment" },
  { value: "reduce_business_debt", label: "Reduce Business Debt" },
  { value: "target_monthly_profit", label: "Target Monthly Profit" },
  { value: "save_for_taxes", label: "Save for Taxes" },
  { value: "hire_employees", label: "Hire Employees" },
  { value: "expand_operations", label: "Expand Operations" },
  { value: "personal_emergency_fund", label: "Personal Emergency Fund" },
  { value: "debt_payoff", label: "Debt Payoff" },
  { value: "retirement_savings", label: "Retirement Savings" },
  { value: "home_purchase_fund", label: "Home Purchase Fund" },
  { value: "personal_savings_target", label: "Personal Savings Target" },
  { value: "vacation_savings", label: "Vacation Savings" },
  { value: "major_purchase", label: "Major Purchase" },
  { value: "owner_income_target", label: "Owner Income Target" },
  { value: "business_stability_target", label: "Business Stability Target" },
  { value: "combined_net_worth", label: "Combined Net Worth" },
  { value: "lifestyle_income", label: "Lifestyle Income" },
];

export default function GoalEditDialog({ open, onClose, goal, onSave }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (goal) setForm({ ...goal });
  }, [goal]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Goal</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Title *</Label><Input value={form.title || ""} onChange={e => set("title", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={form.goal_type || "personal"} onValueChange={v => set("goal_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="combined">Combined</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status || "active"} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Category</Label>
            <Select value={form.category || ""} onValueChange={v => set("category", v)}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>{ALL_CATS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Target Amount ($)</Label><Input type="number" value={form.target_amount || 0} onChange={e => set("target_amount", parseFloat(e.target.value) || 0)} /></div>
            <div><Label>Current Amount ($)</Label><Input type="number" value={form.current_amount || 0} onChange={e => set("current_amount", parseFloat(e.target.value) || 0)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Monthly Contribution ($)</Label><Input type="number" value={form.monthly_contribution || 0} onChange={e => set("monthly_contribution", parseFloat(e.target.value) || 0)} /></div>
            <div><Label>Target Date</Label><Input type="date" value={form.target_date || ""} onChange={e => set("target_date", e.target.value)} /></div>
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={2} /></div>
          <Button type="button" className="w-full" onClick={() => onSave(form)} disabled={!form.title}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}