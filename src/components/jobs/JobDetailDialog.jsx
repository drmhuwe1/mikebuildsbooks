import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/formatters";

export default function JobDetailDialog({ job, open, onOpenChange }) {
  if (!job) return null;

  const revenue = (job.contract_amount || 0) + (job.change_orders_total || 0);
  const costs = (job.material_costs || 0) + (job.labor_costs || 0) + (job.subcontractor_costs || 0) + (job.permit_costs || 0) + (job.equipment_costs || 0) + (job.overhead_costs || 0) + (job.other_costs || 0);
  const profit = revenue - costs;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const outstanding = revenue - (job.deposits_received || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {job.title}
            <Badge className={`text-xs ${getStatusColor(job.status)}`}>{job.status?.replace(/_/g, " ")}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Client:</span> <strong>{job.client_name || "—"}</strong></div>
            <div><span className="text-muted-foreground">Address:</span> <strong>{job.address || "—"}</strong></div>
            <div><span className="text-muted-foreground">Start:</span> <strong>{formatDate(job.start_date)}</strong></div>
            <div><span className="text-muted-foreground">Projected End:</span> <strong>{formatDate(job.projected_completion)}</strong></div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Financial Summary</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Contract Amount</span><strong>{formatCurrency(job.contract_amount)}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Change Orders</span><strong>{formatCurrency(job.change_orders_total)}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Revenue</span><strong>{formatCurrency(revenue)}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Deposits</span><strong>{formatCurrency(job.deposits_received)}</strong></div>
              <div className="flex justify-between col-span-2"><span className="text-muted-foreground">Outstanding Balance</span><strong className="text-red-600">{formatCurrency(outstanding)}</strong></div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Costs Breakdown</h4>
            <div className="space-y-2 text-sm">
              {[
                ["Materials", job.material_costs], ["Labor", job.labor_costs], ["Subcontractors", job.subcontractor_costs],
                ["Permits", job.permit_costs], ["Equipment", job.equipment_costs], ["Overhead", job.overhead_costs], ["Other", job.other_costs],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <strong>{formatCurrency(val)}</strong>
                </div>
              ))}
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total Costs</span><span>{formatCurrency(costs)}</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-muted text-center">
                <p className="text-xs text-muted-foreground">Gross Profit</p>
                <p className={`text-lg font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(profit)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted text-center">
                <p className="text-xs text-muted-foreground">Profit Margin</p>
                <p className={`text-lg font-bold ${margin >= 0 ? "text-green-600" : "text-red-600"}`}>{margin.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {job.scope && (
            <div className="border-t pt-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Scope of Work</h4>
              <p className="text-sm whitespace-pre-wrap">{job.scope}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}