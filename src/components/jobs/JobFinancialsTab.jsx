import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function JobFinancialsTab({ job }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [costs, setCosts] = useState({
    material_costs: job.material_costs || 0,
    labor_costs: job.labor_costs || 0,
    subcontractor_costs: job.subcontractor_costs || 0,
    permit_costs: job.permit_costs || 0,
    equipment_costs: job.equipment_costs || 0,
    overhead_costs: job.overhead_costs || 0,
    other_costs: job.other_costs || 0,
  });
  const [saving, setSaving] = useState(false);

  const totalCosts = Object.values(costs).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const actualRevenue = (job.deposits_received || 0) + (job.change_orders_total || 0);
  const profit = actualRevenue - totalCosts;
  const margin = actualRevenue > 0 ? ((profit / actualRevenue) * 100) : 0;

  const costFields = [
    { key: 'material_costs', label: 'Materials' },
    { key: 'labor_costs', label: 'Labor' },
    { key: 'subcontractor_costs', label: 'Subcontractors' },
    { key: 'permit_costs', label: 'Permits' },
    { key: 'equipment_costs', label: 'Equipment' },
    { key: 'overhead_costs', label: 'Overhead' },
    { key: 'other_costs', label: 'Other' },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Job.update(job.id, costs);
      qc.invalidateQueries({ queryKey: ["jobs"] });
      setEditing(null);
    } catch (error) {
      alert(`Failed to save: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setCosts(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-blue-700 mb-1">Contract Amount</p>
          <p className="text-lg font-bold text-blue-900">{formatCurrency(job.contract_amount || 0)}</p>
        </div>
        <div className="p-3 bg-purple-50 rounded border border-purple-200">
          <p className="text-xs text-purple-700 mb-1">Cash Collected</p>
          <p className="text-lg font-bold text-purple-900">{formatCurrency(job.deposits_received || 0)}</p>
        </div>
        <div className="p-3 bg-amber-50 rounded border border-amber-200">
          <p className="text-xs text-amber-700 mb-1">Actual Revenue</p>
          <p className="text-lg font-bold text-amber-900">{formatCurrency(actualRevenue)}</p>
        </div>
        <div className="p-3 bg-red-50 rounded border border-red-200">
          <p className="text-xs text-red-700 mb-1">Total Costs</p>
          <p className="text-lg font-bold text-red-900">{formatCurrency(totalCosts)}</p>
        </div>
        <div className={`p-3 rounded border ${profit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-xs mb-1 ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>Profit</p>
          <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-900' : 'text-red-900'}`}>{formatCurrency(profit)}</p>
          <p className={`text-xs mt-1 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{margin.toFixed(1)}% margin</p>
        </div>
      </div>

      <div className="space-y-3 border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm">Cost Breakdown</p>
          {editing ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit Costs</Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {costFields.map(({ key, label }) => (
            <div key={key}>
              <Label className="text-xs">{label}</Label>
              {editing ? (
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={costs[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm font-medium mt-1">
                  {costs[key] > 0 ? formatCurrency(costs[key]) : "—"}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}