import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

export default function MaterialCostTracker({ materials, onAdd, onDelete }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ supplier: "", category: "other", cost: 0, purchase_date: "", status: "ordered" });

  const categories = ["lumber", "plumbing", "electrical", "hvac", "roofing", "drywall", "paint", "flooring", "hardware", "other"];

  const totalMaterials = materials.reduce((s, m) => s + (m.cost || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="font-semibold">Total Material Costs: {formatCurrency(totalMaterials)}</p>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" /> Add Material</Button>
      </div>

      <div className="space-y-2">
        {materials.length === 0 ? (
          <p className="text-sm text-muted-foreground">No materials tracked yet.</p>
        ) : (
          materials.map(m => (
            <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="min-w-0">
                <p className="font-semibold text-sm">{m.supplier}</p>
                <p className="text-xs text-muted-foreground">{m.category} · {formatDate(m.purchase_date)}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-bold text-sm">{formatCurrency(m.cost)}</p>
                <Button type="button" variant="ghost" size="icon" onClick={() => onDelete(m.id)} aria-label={m.supplier ? `Delete material from ${m.supplier}` : "Delete material cost"}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Material Cost</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Supplier</Label><Input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} /></div>
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Cost ($)</Label><Input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: parseFloat(e.target.value) || 0 }))} /></div>
            <div><Label>Purchase Date</Label><Input type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} /></div>
            <Button className="w-full" onClick={() => { onAdd(form); setDialogOpen(false); }}>Add Material</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}