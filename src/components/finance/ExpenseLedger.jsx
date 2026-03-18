import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";

export default function ExpenseLedger({ jobs = [], bills = [] }) {
  const allDeductions = useMemo(() => {
    const deductions = [];

    // Job expense details
    jobs.forEach(j => {
      if (j.material_costs) deductions.push({ type: "Material Costs", job: j.title, amount: j.material_costs, date: j.created_date });
      if (j.labor_costs) deductions.push({ type: "Labor Costs", job: j.title, amount: j.labor_costs, date: j.created_date });
      if (j.subcontractor_costs) deductions.push({ type: "Subcontractor Costs", job: j.title, amount: j.subcontractor_costs, date: j.created_date });
      if (j.permit_costs) deductions.push({ type: "Permits & Fees", job: j.title, amount: j.permit_costs, date: j.created_date });
      if (j.equipment_costs) deductions.push({ type: "Equipment Rental", job: j.title, amount: j.equipment_costs, date: j.created_date });
      if (j.overhead_costs) deductions.push({ type: "Overhead", job: j.title, amount: j.overhead_costs, date: j.created_date });
      if (j.other_costs) deductions.push({ type: "Other Costs", job: j.title, amount: j.other_costs, date: j.created_date });
    });

    // Business bills
    bills.forEach(b => {
      deductions.push({ type: `Bill: ${b.category || "Other"}`, job: b.title, amount: b.amount, date: b.due_date });
    });

    return deductions.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [jobs, bills]);

  const totalDeductions = useMemo(() => allDeductions.reduce((sum, d) => sum + (d.amount || 0), 0), [allDeductions]);

  const groupedByType = useMemo(() => {
    const grouped = {};
    allDeductions.forEach(d => {
      if (!grouped[d.type]) grouped[d.type] = 0;
      grouped[d.type] += d.amount;
    });
    return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  }, [allDeductions]);

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
    </div>
  );
}