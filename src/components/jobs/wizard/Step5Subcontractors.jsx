import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

const emptyRow = { name: "", trade: "", payment_type: "fixed", value: 0 };

const TRADES = ["Electrical", "Plumbing", "HVAC", "Framing", "Roofing", "Drywall", "Painting", "Flooring", "Concrete", "Landscaping", "Other"];

export default function Step5Subcontractors({ data, onChange }) {
  const items = data.sub_items || [];

  const update = (idx, field, val) => {
    onChange({ ...data, sub_items: items.map((item, i) => i === idx ? { ...item, [field]: val } : item) });
  };

  const addRow = () => onChange({ ...data, sub_items: [...items, { ...emptyRow }] });
  const removeRow = (idx) => onChange({ ...data, sub_items: items.filter((_, i) => i !== idx) });

  const laborCost = (() => {
    const c = data.crew_size * data.hours_per_day * data.labor_days * data.labor_rate;
    return isNaN(c) ? 0 : c;
  })();

  const materialSubtotal = (data.material_items || []).reduce((s, r) => s + (parseFloat(r.total) || 0), 0);
  const totalJobCost = laborCost + materialSubtotal;

  const calcPayout = (item) => {
    const v = parseFloat(item.value) || 0;
    switch (item.payment_type) {
      case "fixed": return v;
      case "hourly": return v; // treat as fixed dollar estimate for now
      case "percent_labor": return (v / 100) * laborCost;
      case "percent_profit": return (v / 100) * totalJobCost;
      default: return v;
    }
  };

  const total = items.reduce((sum, item) => sum + calcPayout(item), 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Add any subcontractors for this job. Leave blank if none are needed.</p>

      {items.map((item, idx) => (
        <div key={idx} className="border rounded-lg p-3 space-y-3 bg-muted/20">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Subcontractor #{idx + 1}</p>
            <button onClick={() => removeRow(idx)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={item.name} onChange={e => update(idx, "name", e.target.value)} placeholder="Subcontractor name" />
            </div>
            <div>
              <Label>Trade</Label>
              <Select value={item.trade} onValueChange={v => update(idx, "trade", v)}>
                <SelectTrigger><SelectValue placeholder="Select trade" /></SelectTrigger>
                <SelectContent>{TRADES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Type</Label>
              <Select value={item.payment_type} onValueChange={v => update(idx, "payment_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="hourly">Hourly Estimate</SelectItem>
                  <SelectItem value="percent_labor">% of Labor Cost</SelectItem>
                  <SelectItem value="percent_profit">% of Job Cost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{item.payment_type === "percent_labor" || item.payment_type === "percent_profit" ? "Percentage (%)" : "Amount ($)"}</Label>
              <Input type="number" min="0" step="0.01" value={item.value} onChange={e => update(idx, "value", e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-right text-muted-foreground">
            Estimated Payout: <strong className="text-foreground">{formatCurrency(calcPayout(item))}</strong>
          </p>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-1.5">
        <Plus className="w-3.5 h-3.5" /> Add Subcontractor
      </Button>

      {items.length > 0 && (
        <div className="flex justify-end pt-2 border-t">
          <p className="text-sm font-semibold">Total Subcontractor Cost: <span className="text-primary">{formatCurrency(total)}</span></p>
        </div>
      )}
    </div>
  );
}