import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, ChevronLeft, Target } from "lucide-react";

const SCENARIO_TYPES = [
  { value: "pricing_increase", label: "Increase Job Pricing", desc: "Raise prices to improve profitability" },
  { value: "hiring", label: "Hire Additional Help", desc: "Add subcontractors or employees" },
  { value: "owner_income", label: "Increase Owner Income", desc: "Increase draws or distributions" },
  { value: "reduce_expenses", label: "Reduce Business Expenses", desc: "Cut costs or eliminate expenses" },
  { value: "equipment_purchase", label: "Purchase Equipment", desc: "Major capital investment" },
  { value: "marketing", label: "Increase Marketing", desc: "Boost business development" },
  { value: "custom", label: "Custom Scenario", desc: "Build your own scenario" },
];

const STEPS = ["Type", "Details", "Variables", "Confirm"];

export default function ScenarioWizard({ open, onClose, onSave }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    description: "",
    scenario_type: "",
    variables: {},
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setVar = (k, v) => setForm(f => ({ ...f, variables: { ...f.variables, [k]: v } }));

  const handleSave = () => {
    onSave(form);
    setStep(0);
    setForm({ name: "", description: "", scenario_type: "", variables: {} });
  };

  const getTypeDetails = () => {
    const defaults = {
      pricing_increase: { job_price_change_percent: 10 },
      hiring: { new_subcontractors: 1 },
      owner_income: { owner_draw_change_percent: 20 },
      reduce_expenses: { new_monthly_expense: -1000 },
      equipment_purchase: { equipment_purchase: 25000 },
      marketing: { marketing_spend: 1000 },
    };
    return defaults[form.scenario_type] || {};
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Scenario Wizard — Step {step + 1} of {STEPS.length}
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {/* Step 0 - Type */}
        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Choose scenario type</p>
            {SCENARIO_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => set("scenario_type", t.value)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  form.scenario_type === t.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-semibold">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 1 - Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Scenario Name *</Label>
              <Input placeholder="e.g. Raise Prices 10%" value={form.name} onChange={e => set("name", e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="What is this scenario about?" value={form.description} onChange={e => set("description", e.target.value)} rows={2} />
            </div>
          </div>
        )}

        {/* Step 2 - Variables */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Adjust key variables</p>
            {form.scenario_type === "pricing_increase" && (
              <div>
                <Label>Price Increase (%)</Label>
                <Input type="number" value={form.variables.job_price_change_percent || 10} onChange={e => setVar("job_price_change_percent", parseFloat(e.target.value))} />
              </div>
            )}
            {form.scenario_type === "hiring" && (
              <>
                <div>
                  <Label>New Subcontractors</Label>
                  <Input type="number" value={form.variables.new_subcontractors || 0} onChange={e => setVar("new_subcontractors", parseInt(e.target.value))} />
                </div>
                <div>
                  <Label>New Employees</Label>
                  <Input type="number" value={form.variables.new_employees || 0} onChange={e => setVar("new_employees", parseInt(e.target.value))} />
                </div>
              </>
            )}
            {form.scenario_type === "owner_income" && (
              <div>
                <Label>Owner Draw Change (%)</Label>
                <Input type="number" value={form.variables.owner_draw_change_percent || 20} onChange={e => setVar("owner_draw_change_percent", parseFloat(e.target.value))} />
              </div>
            )}
            {form.scenario_type === "reduce_expenses" && (
              <div>
                <Label>Monthly Savings ($)</Label>
                <Input type="number" value={form.variables.new_monthly_expense || 0} onChange={e => setVar("new_monthly_expense", -Math.abs(parseFloat(e.target.value)))} />
              </div>
            )}
            {form.scenario_type === "equipment_purchase" && (
              <div>
                <Label>Equipment Cost ($)</Label>
                <Input type="number" value={form.variables.equipment_purchase || 25000} onChange={e => setVar("equipment_purchase", parseFloat(e.target.value))} />
              </div>
            )}
            {form.scenario_type === "marketing" && (
              <div>
                <Label>Monthly Marketing Budget ($)</Label>
                <Input type="number" value={form.variables.marketing_spend || 1000} onChange={e => setVar("marketing_spend", parseFloat(e.target.value))} />
              </div>
            )}
            {form.scenario_type === "custom" && (
              <p className="text-xs text-muted-foreground">Use the main simulator form to set custom variables.</p>
            )}
          </div>
        )}

        {/* Step 3 - Confirm */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Review and save</p>
            <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
              <div><span className="text-muted-foreground">Name:</span> <strong>{form.name}</strong></div>
              <div><span className="text-muted-foreground">Type:</span> <strong>{form.scenario_type}</strong></div>
              {form.description && <div><span className="text-muted-foreground">Description:</span> <strong>{form.description}</strong></div>}
            </div>
            <Button className="w-full" onClick={handleSave} disabled={!form.name || !form.scenario_type}>Save Scenario</Button>
          </div>
        )}

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={() => step === 0 ? onClose() : setStep(s => s - 1)}>
            <ChevronLeft className="w-4 h-4 mr-1" /> {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={step === 0 && !form.scenario_type}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}