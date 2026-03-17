import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function ScenarioForm({ variables, onVariableChange, onCalculate, results, baselineData }) {
  const fields = [
    { key: "job_price_change_percent", label: "Job Price Change (%)", min: -50, max: 50, step: 1, icon: TrendingUp },
    { key: "material_cost_change_percent", label: "Material Cost Change (%)", min: -30, max: 30, step: 1 },
    { key: "subcontractor_payout_change_percent", label: "Subcontractor Payout Change (%)", min: -30, max: 30, step: 1 },
    { key: "jobs_per_month_change", label: "Additional Jobs Per Month", min: -5, max: 10, step: 1 },
    { key: "owner_draw_change_percent", label: "Owner Draw Change (%)", min: -50, max: 50, step: 1 },
  ];

  const expenseFields = [
    { key: "new_monthly_expense", label: "New Monthly Expense ($)", min: 0, max: 20000, step: 500 },
    { key: "equipment_purchase", label: "Equipment Purchase ($)", min: 0, max: 100000, step: 1000 },
    { key: "one_time_expense", label: "One-Time Expense ($)", min: 0, max: 50000, step: 500 },
    { key: "marketing_spend", label: "Monthly Marketing Spend ($)", min: 0, max: 10000, step: 100 },
  ];

  const otherFields = [
    { key: "tax_reserve_percent_change", label: "Tax Reserve % Change", min: -10, max: 20, step: 1 },
    { key: "new_subcontractors", label: "New Subcontractors to Hire", min: 0, max: 10, step: 1 },
    { key: "new_employees", label: "New Employees to Hire", min: 0, max: 10, step: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Revenue & Pricing */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Revenue & Pricing</h3>
        <div className="space-y-4">
          {fields.slice(0, 3).map(f => (
            <div key={f.key}>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm">{f.label}</Label>
                <span className="text-sm font-semibold text-primary">{variables[f.key] || 0}{f.label.includes("%") ? "%" : ""}</span>
              </div>
              <Slider
                value={[variables[f.key] || 0]}
                onValueChange={v => onVariableChange(f.key, v[0])}
                min={f.min}
                max={f.max}
                step={f.step}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Job Volume */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Job Volume</h3>
        <div className="space-y-4">
          {fields.slice(3, 4).map(f => (
            <div key={f.key}>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm">{f.label}</Label>
                <span className="text-sm font-semibold">{variables[f.key] || 0}</span>
              </div>
              <Slider value={[variables[f.key] || 0]} onValueChange={v => onVariableChange(f.key, v[0])} min={f.min} max={f.max} step={f.step} />
            </div>
          ))}
        </div>
      </Card>

      {/* Owner & Draw */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Owner Income</h3>
        <div className="space-y-4">
          {fields.slice(4).map(f => (
            <div key={f.key}>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm">{f.label}</Label>
                <span className="text-sm font-semibold">{variables[f.key] || 0}%</span>
              </div>
              <Slider value={[variables[f.key] || 0]} onValueChange={v => onVariableChange(f.key, v[0])} min={f.min} max={f.max} step={f.step} />
            </div>
          ))}
        </div>
      </Card>

      {/* Expenses */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Expenses & Investments</h3>
        <div className="space-y-4">
          {expenseFields.map(f => (
            <div key={f.key}>
              <Label className="text-sm">{f.label}</Label>
              <Input
                type="number"
                value={variables[f.key] || 0}
                onChange={e => onVariableChange(f.key, parseFloat(e.target.value) || 0)}
                min={f.min}
                max={f.max}
                step={f.step}
                className="mt-1"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Other */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Staffing & Reserves</h3>
        <div className="space-y-4">
          {otherFields.map(f => (
            <div key={f.key}>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm">{f.label}</Label>
                <span className="text-sm font-semibold">{variables[f.key] || 0}</span>
              </div>
              <Slider value={[variables[f.key] || 0]} onValueChange={v => onVariableChange(f.key, v[0])} min={f.min} max={f.max} step={f.step} />
            </div>
          ))}
        </div>
      </Card>

      <Button onClick={onCalculate} className="w-full" size="lg">Calculate Projections</Button>
    </div>
  );
}