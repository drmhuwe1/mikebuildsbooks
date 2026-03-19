import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { X, Calendar, DollarSign, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatDate } from "@/lib/formatters";
import JobMunicipalityDetail from "./JobMunicipalityDetail";
import JobExpensesTab from "./JobExpensesTab";
import JobPaymentTracking from "./JobPaymentTracking.jsx";

export default function JobDetailDialog({ job, open, onOpenChange }) {
  if (!job) return null;

  const { data: subPayments = [] } = useQuery({ queryKey: ["subPayments", job.id], queryFn: () => base44.entities.SubcontractorPayment.filter({ job_id: job.id }) });

  const contractRevenue = (job.contract_amount || 0) + (job.change_orders_total || 0);
  const actualRevenue = (job.deposits_received || 0) + (job.change_orders_total || 0);
  const costs = (job.material_costs || 0) + (job.labor_costs || 0) + (job.subcontractor_costs || 0) + (job.permit_costs || 0) + (job.equipment_costs || 0) + (job.overhead_costs || 0) + (job.other_costs || 0);
  const profit = actualRevenue - costs;
  const margin = actualRevenue > 0 ? ((profit / actualRevenue) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{job.title}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="municipality">Municipality</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Client</p>
                <p className="font-semibold">{job.client_name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Address</p>
                <p className="font-semibold">{job.address || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <p className="font-semibold capitalize">{job.status?.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Scope</p>
                <p className="text-sm text-muted-foreground">{job.scope || "—"}</p>
              </div>
              {job.start_date && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Start</p>
                  <p className="font-semibold">{formatDate(job.start_date)}</p>
                </div>
              )}
              {job.projected_completion && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Est. Completion</p>
                  <p className="font-semibold">{formatDate(job.projected_completion)}</p>
                </div>
              )}
            </div>
            {job.notes && (
              <div className="p-3 bg-gray-50 rounded border">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{job.notes}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="financials" className="mt-4 space-y-4">
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
                <p className="text-lg font-bold text-red-900">{formatCurrency(costs)}</p>
              </div>
              <div className={`p-3 rounded border ${profit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className={`text-xs mb-1 ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>Profit</p>
                <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-900' : 'text-red-900'}`}>{formatCurrency(profit)}</p>
                <p className={`text-xs mt-1 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{margin.toFixed(1)}% margin</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-sm">Cost Breakdown</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ['Materials', job.material_costs],
                  ['Labor', job.labor_costs],
                  ['Subcontractors', job.subcontractor_costs],
                  ['Permits', job.permit_costs],
                  ['Equipment', job.equipment_costs],
                  ['Overhead', job.overhead_costs],
                ].map(([label, value]) => (
                  value > 0 && (
                    <div key={label} className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{formatCurrency(value)}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <JobPaymentTracking job={job} subPayments={subPayments} />
          </TabsContent>

          <TabsContent value="expenses" className="mt-4">
            <JobExpensesTab job={job} />
          </TabsContent>

          <TabsContent value="municipality" className="mt-4">
            <JobMunicipalityDetail jobId={job.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}