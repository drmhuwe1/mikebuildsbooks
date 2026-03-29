import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Package } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useToast } from "@/components/ui/use-toast";

export default function JobMaterialsTab({ job }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    vendor: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ["job-material-receipts", job?.id],
    queryFn: () => base44.entities.JobReceipt.filter({ job_id: job.id, category: "materials" }),
    enabled: !!job?.id,
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.JobReceipt.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-material-receipts", job.id] });
      qc.invalidateQueries({ queryKey: ["all-receipts"] });
      qc.invalidateQueries({ queryKey: ["jobReceipts"] });
      setForm({ description: "", amount: "", vendor: "", date: new Date().toISOString().split("T")[0], notes: "" });
      setShowForm(false);
      toast({ title: "Material cost added" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.JobReceipt.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-material-receipts", job.id] });
      qc.invalidateQueries({ queryKey: ["all-receipts"] });
      qc.invalidateQueries({ queryKey: ["jobReceipts"] });
      toast({ title: "Entry deleted" });
    },
  });

  const handleAdd = () => {
    if (!form.description || !form.amount) {
      toast({ title: "Description and amount are required", variant: "destructive" });
      return;
    }
    addMutation.mutate({
      job_id: job.id,
      job_title: job.title,
      description: form.description,
      amount: parseFloat(form.amount),
      category: "materials",
      vendor: form.vendor,
      date: form.date,
      notes: form.notes,
      is_estimated: false,
    });
  };

  const actualTotal = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);
  const projectedTotal = job.material_costs || 0;
  const remaining = projectedTotal - actualTotal;

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">Projected Budget</p>
          <p className="text-lg font-bold text-blue-900">{formatCurrency(projectedTotal)}</p>
          <p className="text-xs text-blue-600">from job estimate</p>
        </div>
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700">Actual Spent</p>
          <p className="text-lg font-bold text-red-900">{formatCurrency(actualTotal)}</p>
          <p className="text-xs text-red-600">flows to total expenses</p>
        </div>
        <div className={`p-3 rounded-lg border ${remaining >= 0 ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
          <p className={`text-xs ${remaining >= 0 ? "text-green-700" : "text-orange-700"}`}>
            {remaining >= 0 ? "Under Budget" : "Over Budget"}
          </p>
          <p className={`text-lg font-bold ${remaining >= 0 ? "text-green-900" : "text-orange-900"}`}>
            {formatCurrency(Math.abs(remaining))}
          </p>
          <p className={`text-xs ${remaining >= 0 ? "text-green-600" : "text-orange-600"}`}>
            {remaining >= 0 ? "remaining" : "over projected"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Material Entries ({receipts.length})</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Material Cost
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Description *</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Lumber, drywall, tile..." />
            </div>
            <div>
              <Label>Amount ($) *</Label>
              <Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <Label>Vendor</Label>
              <Input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} placeholder="e.g. Home Depot" />
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={addMutation.isPending} size="sm">Save</Button>
            <Button variant="outline" onClick={() => setShowForm(false)} size="sm">Cancel</Button>
          </div>
        </div>
      )}

      {/* Entries List */}
      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {!isLoading && receipts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No material costs recorded yet.</p>
          <p className="text-xs mt-1">Add entries as costs come in — they'll automatically appear in Business Financials.</p>
        </div>
      )}
      <div className="space-y-2">
        {receipts.map(r => (
          <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{r.description}</p>
              <p className="text-xs text-muted-foreground">
                {r.vendor && <span>{r.vendor} · </span>}
                {r.date && formatDate(r.date)}
                {r.notes && <span> · {r.notes}</span>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold text-red-700">{formatCurrency(r.amount)}</p>
              <button
                onClick={() => deleteMutation.mutate(r.id)}
                disabled={deleteMutation.isPending}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {receipts.length > 0 && (
        <div className="flex justify-between items-center pt-2 border-t font-semibold text-sm">
          <span>Total Actual Materials</span>
          <span className="text-red-700">{formatCurrency(actualTotal)}</span>
        </div>
      )}
    </div>
  );
}