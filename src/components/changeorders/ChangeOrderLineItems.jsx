import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const CATEGORIES = ["materials", "labor", "subcontractor", "equipment", "permits", "other"];

export default function ChangeOrderLineItems({ lineItems = [], onChange }) {
  const addRow = () => {
    onChange([...lineItems, { category: "materials", description: "", quantity: 1, unit: "ea", unit_cost: 0, total_cost: 0 }]);
  };

  const updateRow = (idx, field, value) => {
    const updated = lineItems.map((item, i) => {
      if (i !== idx) return item;
      const next = { ...item, [field]: value };
      if (field === "quantity" || field === "unit_cost") {
        next.total_cost = (parseFloat(field === "quantity" ? value : next.quantity) || 0) * (parseFloat(field === "unit_cost" ? value : next.unit_cost) || 0);
      }
      return next;
    });
    onChange(updated);
  };

  const removeRow = (idx) => onChange(lineItems.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="text-left pb-2 pr-2 w-28">Category</th>
              <th className="text-left pb-2 pr-2">Description</th>
              <th className="text-left pb-2 pr-2 w-16">Qty</th>
              <th className="text-left pb-2 pr-2 w-16">Unit</th>
              <th className="text-right pb-2 pr-2 w-24">Unit Cost</th>
              <th className="text-right pb-2 pr-2 w-24">Total</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-1.5 pr-2">
                  <Select value={item.category} onValueChange={v => updateRow(idx, "category", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="py-1.5 pr-2">
                  <Input value={item.description} onChange={e => updateRow(idx, "description", e.target.value)} className="h-8 text-xs" placeholder="Description..." />
                </td>
                <td className="py-1.5 pr-2">
                  <Input type="number" value={item.quantity} onChange={e => updateRow(idx, "quantity", parseFloat(e.target.value) || 0)} className="h-8 text-xs text-right" />
                </td>
                <td className="py-1.5 pr-2">
                  <Input value={item.unit} onChange={e => updateRow(idx, "unit", e.target.value)} className="h-8 text-xs" placeholder="ea" />
                </td>
                <td className="py-1.5 pr-2">
                  <Input type="number" value={item.unit_cost} onChange={e => updateRow(idx, "unit_cost", parseFloat(e.target.value) || 0)} className="h-8 text-xs text-right" />
                </td>
                <td className="py-1.5 pr-2 text-right font-medium">
                  ${(item.total_cost || 0).toFixed(2)}
                </td>
                <td className="py-1.5">
                  <button onClick={() => removeRow(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {lineItems.length === 0 && (
              <tr><td colSpan={7} className="py-4 text-center text-xs text-muted-foreground">No line items yet. Add one below.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-1.5">
        <Plus className="w-3.5 h-3.5" /> Add Line Item
      </Button>
    </div>
  );
}