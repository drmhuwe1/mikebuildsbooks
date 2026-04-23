import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/formatters";

const CATEGORY_LABELS = {
  materials: "Materials",
  labor: "Labor",
  subcontractor: "Subcontractors",
  permits: "Permits",
  equipment: "Equipment",
  overhead: "Overhead",
  fuel: "Fuel",
  tools: "Tools",
  other: "Other",
};

export default function JobFinancialsTab({ job }) {
  const { data: receipts = [] } = useQuery({
    queryKey: ["job-receipts", job.id],
    queryFn: () => base44.entities.JobReceipt.filter({ job_id: job.id }),
    staleTime: 0,
  });

  const { data: subLabor = [] } = useQuery({
    queryKey: ["sub-labor", job.id],
    queryFn: () => base44.entities.SubcontractorWorkEntry.filter({ job_id: job.id }),
    staleTime: 0,
  });

  // Aggregate receipts by category
  const receiptsByCategory = useMemo(() => {
    const map = {};
    receipts.forEach(r => {
      const cat = r.category || "other";
      map[cat] = (map[cat] || 0) + (r.amount || 0);
    });
    return map;
  }, [receipts]);

  const totalReceiptsExpenses = useMemo(() =>
    receipts.reduce((sum, r) => sum + (r.amount || 0), 0), [receipts]);

  const totalSubLaborPaid = useMemo(() =>
    subLabor.filter(e => e.payment_status === "Paid").reduce((sum, e) => sum + (e.calculated_pay || 0), 0), [subLabor]);

  const totalSubLaborUnpaid = useMemo(() =>
    subLabor.filter(e => e.payment_status !== "Paid").reduce((sum, e) => sum + (e.calculated_pay || 0), 0), [subLabor]);

  const totalCosts = totalReceiptsExpenses + totalSubLaborPaid + totalSubLaborUnpaid;

  const actualRevenue = (job.total_paid_by_customer || job.deposits_received || 0) + (job.change_orders_total || 0);
  const profit = actualRevenue - totalCosts;
  const margin = actualRevenue > 0 ? ((profit / actualRevenue) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-blue-700 mb-1">Contract Amount</p>
          <p className="text-lg font-bold text-blue-900">{formatCurrency(job.contract_amount || 0)}</p>
        </div>
        <div className="p-3 bg-amber-50 rounded border border-amber-200">
          <p className="text-xs text-amber-700 mb-1">Cash Collected</p>
          <p className="text-lg font-bold text-amber-900">{formatCurrency(job.total_paid_by_customer || job.deposits_received || 0)}</p>
        </div>
        <div className="p-3 bg-red-50 rounded border border-red-200">
          <p className="text-xs text-red-700 mb-1">Total Costs</p>
          <p className="text-lg font-bold text-red-900">{formatCurrency(totalCosts)}</p>
        </div>
        <div className={`p-3 rounded border col-span-2 ${profit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-xs mb-1 ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>Profit</p>
          <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-900' : 'text-red-900'}`}>{formatCurrency(profit)}</p>
          <p className={`text-xs mt-1 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{margin.toFixed(1)}% margin</p>
        </div>
      </div>

      {/* Expense Receipts Breakdown */}
      <div className="border rounded-lg p-4 space-y-2">
        <p className="font-semibold text-sm">Expense Receipts</p>
        {receipts.length === 0 ? (
          <p className="text-xs text-muted-foreground">No receipts logged yet. Add them under the Expenses tab.</p>
        ) : (
          <>
            {Object.entries(receiptsByCategory).map(([cat, amount]) => (
              <div key={cat} className="flex justify-between text-sm py-1 border-b border-border/40 last:border-0">
                <span className="text-muted-foreground">{CATEGORY_LABELS[cat] || cat}</span>
                <span className="font-medium">{formatCurrency(amount)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold pt-1">
              <span>Total Receipts</span>
              <span>{formatCurrency(totalReceiptsExpenses)}</span>
            </div>
          </>
        )}
      </div>

      {/* Sub Labor Breakdown */}
      <div className="border rounded-lg p-4 space-y-2">
        <p className="font-semibold text-sm">Subcontractor Labor</p>
        {subLabor.length === 0 ? (
          <p className="text-xs text-muted-foreground">No sub labor entries logged for this job.</p>
        ) : (
          <>
            <div className="flex justify-between text-sm py-1 border-b border-border/40">
              <span className="text-muted-foreground">Paid Labor</span>
              <span className="font-medium text-green-700">{formatCurrency(totalSubLaborPaid)}</span>
            </div>
            <div className="flex justify-between text-sm py-1 border-b border-border/40">
              <span className="text-muted-foreground">Unpaid Labor (owed)</span>
              <span className="font-medium text-orange-700">{formatCurrency(totalSubLaborUnpaid)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1">
              <span>Total Sub Labor</span>
              <span>{formatCurrency(totalSubLaborPaid + totalSubLaborUnpaid)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}