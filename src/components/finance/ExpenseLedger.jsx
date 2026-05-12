import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { Receipt, ChevronDown, ChevronRight, Eye } from "lucide-react";
import ReceiptsViewer from "./ReceiptsViewer";

const CATEGORY_LABELS = {
  materials: "Materials", labor: "Labor", subcontractor: "Subcontractor",
  equipment: "Equipment", permits: "Permits & Fees", overhead: "Overhead",
  fuel: "Fuel", tools: "Tools", other: "Other"
};

export default function ExpenseLedger({ jobs = [], bills = [] }) {
  const [showReceipts, setShowReceipts] = useState(false);
  const [expandedJob, setExpandedJob] = useState(null);

  const { data: jobReceipts = [] } = useQuery({
    queryKey: ["all-receipts"],
    queryFn: () => base44.entities.JobReceipt.list("-date", 500),
  });

  const allDeductions = useMemo(() => {
    const deductions = [];
    jobs.forEach(j => {
      if (j.material_costs) deductions.push({ type: "Material Costs", job: j.title, amount: j.material_costs, date: j.created_date });
      if (j.labor_costs) deductions.push({ type: "Labor Costs", job: j.title, amount: j.labor_costs, date: j.created_date });
      if (j.subcontractor_costs) deductions.push({ type: "Subcontractor Costs", job: j.title, amount: j.subcontractor_costs, date: j.created_date });
      if (j.permit_costs) deductions.push({ type: "Permits & Fees", job: j.title, amount: j.permit_costs, date: j.created_date });
      if (j.equipment_costs) deductions.push({ type: "Equipment Rental", job: j.title, amount: j.equipment_costs, date: j.created_date });
      if (j.overhead_costs) deductions.push({ type: "Overhead", job: j.title, amount: j.overhead_costs, date: j.created_date });
      if (j.other_costs) deductions.push({ type: "Other Costs", job: j.title, amount: j.other_costs, date: j.created_date });
    });
    bills.forEach(b => {
      deductions.push({ type: `Bill: ${b.category || "Other"}`, job: b.title, amount: b.amount, date: b.due_date });
    });
    // Add receipts
    jobReceipts.forEach(r => {
      deductions.push({ type: `Receipt: ${CATEGORY_LABELS[r.category] || r.category}`, job: r.job_title || "No Job", amount: r.amount, date: r.date });
    });
    return deductions.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [jobs, bills, jobReceipts]);

  const totalDeductions = useMemo(() => allDeductions.reduce((sum, d) => sum + (d.amount || 0), 0), [allDeductions]);

  const groupedByType = useMemo(() => {
    const grouped = {};
    allDeductions.forEach(d => {
      if (!grouped[d.type]) grouped[d.type] = 0;
      grouped[d.type] += d.amount;
    });
    return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  }, [allDeductions]);

  // Group receipts by job for the by-job view
  const receiptsByJob = useMemo(() => {
    const grouped = {};
    jobReceipts.forEach(r => {
      const key = r.job_id || "unassigned";
      const label = r.job_title || "No Job";
      if (!grouped[key]) grouped[key] = { label, receipts: [], total: 0 };
      grouped[key].receipts.push(r);
      grouped[key].total += r.amount || 0;
    });
    return Object.entries(grouped).sort((a, b) => b[1].total - a[1].total);
  }, [jobReceipts]);

  const receiptTotal = useMemo(() => jobReceipts.reduce((sum, r) => sum + (r.amount || 0), 0), [jobReceipts]);

  return (
    <div className="space-y-4">
      {/* Summary by Deduction Type */}
      <Card className="p-4 bg-red-50 border-red-200">
        <p className="text-sm font-semibold text-red-900 mb-3">All Deductions by Category</p>
        <div className="space-y-2">
          {groupedByType.map(([type, amount]) => (
            <div key={type} className="flex justify-between text-sm">
              <span className="text-red-800">{type}</span>
              <span className="font-semibold text-red-700">{formatCurrency(amount)}</span>
            </div>
          ))}
          <div className="border-t border-red-300 pt-2 mt-2 flex justify-between font-bold text-red-900">
            <span>Total Deductions</span>
            <span>{formatCurrency(totalDeductions)}</span>
          </div>
        </div>
      </Card>

      {/* Receipts by Job Section */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold flex items-center gap-2"><Receipt className="w-4 h-4 text-red-500" /> Expenses by Job (Receipts)</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total: {formatCurrency(receiptTotal)} across {receiptsByJob.length} job(s)</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowReceipts(true)} className="gap-1.5">
            <Eye className="w-4 h-4" /> View All Receipts
          </Button>
        </div>

        {receiptsByJob.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center">No receipts uploaded yet. Open a job → Expenses tab to add them.</p>
        ) : (
          <div className="space-y-1">
            {receiptsByJob.map(([key, group]) => (
              <div key={key} className="border rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors text-left"
                  onClick={() => setExpandedJob(expandedJob === key ? null : key)}
                >
                  <div className="flex items-center gap-2">
                    {expandedJob === key ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                    <span className="text-sm font-medium">{group.label}</span>
                    <span className="text-xs text-muted-foreground">({group.receipts.length})</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">{formatCurrency(group.total)}</span>
                </button>
                {expandedJob === key && (
                  <div className="border-t divide-y bg-muted/10">
                    {group.receipts.map(r => (
                      <div key={r.id} className="flex items-center justify-between px-4 py-2 text-xs">
                        <span className="text-muted-foreground">{r.description}{r.vendor ? ` — ${r.vendor}` : ""}</span>
                        <span className="font-semibold text-red-600">{formatCurrency(r.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Detailed Ledger */}
      <Card className="p-4">
        <p className="text-sm font-semibold mb-3">Detailed Expense Ledger</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-2 font-semibold">Type</th>
                <th className="text-left p-2 font-semibold">Job/Bill</th>
                <th className="text-right p-2 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {allDeductions.map((d, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-2">{d.type}</td>
                  <td className="p-2 text-muted-foreground">{d.job}</td>
                  <td className="p-2 text-right font-medium text-red-600">{formatCurrency(d.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {allDeductions.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No deductions yet</p>}
      </Card>

      <ReceiptsViewer open={showReceipts} onOpenChange={setShowReceipts} />
    </div>
  );
}