import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, FileText, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import OperationsDashboardCards from "@/components/operations/OperationsDashboardCards";
import JobPipelineVisualization from "@/components/operations/JobPipelineVisualization";
import OwnerDecisionAssistant from "@/components/operations/OwnerDecisionAssistant";
import BusinessHealthScoreCard from "@/components/operations/BusinessHealthScoreCard";
import ScheduleStatusWidget from "@/components/operations/ScheduleStatusWidget";
import { formatCurrency, formatDate } from "@/lib/formatters";

export default function OperationsCommandCenter() {
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 200) });
   const { data: jobStages = [] } = useQuery({ queryKey: ["jobStages"], queryFn: () => base44.entities.JobStage.list("-created_date", 200) });
   const { data: bids = [] } = useQuery({ queryKey: ["bids"], queryFn: () => base44.entities.Bid.list("-created_date", 200) });
   const { data: contracts = [] } = useQuery({ queryKey: ["contracts"], queryFn: () => base44.entities.Contract.list("-created_date", 200) });
   const { data: bills = [] } = useQuery({ queryKey: ["bills"], queryFn: () => base44.entities.Bill.list("-due_date", 200) });
   const { data: personalBills = [] } = useQuery({ queryKey: ["personalBills"], queryFn: () => base44.entities.PersonalBill.list("-due_date", 200) });
   const { data: bankAccounts = [] } = useQuery({ queryKey: ["bankAccounts"], queryFn: () => base44.entities.BankAccount.list("-created_date", 200) });
   const { data: subcontractors = [] } = useQuery({ queryKey: ["subcontractors"], queryFn: () => base44.entities.Subcontractor.list("-created_date", 200) });
   const { data: payments = [] } = useQuery({ queryKey: ["subcontractorPayments"], queryFn: () => base44.entities.SubcontractorPayment.list("-created_date", 200) });
   const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });

  const today = new Date().toISOString().split("T")[0];

  // Job status breakdown
  const bidding = jobs.filter(j => j.status === "bidding");
  const contracted = jobs.filter(j => j.status === "contracted" && j.contract_amount > 0);
  const inProgress = jobs.filter(j => j.status === "in_progress");
  const completed = jobs.filter(j => j.status === "completed");
  const awaitingPayment = jobs.filter(j => j.status !== "completed" && j.contract_amount > (j.deposits_received || 0));

  // Bill status
  const overdueBills = bills.filter(b => b.status !== "paid" && b.due_date < today);
  const upcomingBills = bills.filter(b => b.status !== "paid" && b.due_date >= today && b.due_date <= new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split("T")[0]);

  const jobCard = (label, count, color) => (
    <Card className="p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{count}</p>
    </Card>
  );

  const businessName = settings[0]?.company_name || "Your Business";

  return (
    <div>
      <PageHeader
        title="Operations Command Center"
        description="Complete overview of business operations and financial health"
      />

      <div className="mb-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{businessName}</span>
      </div>

      <div className="space-y-6">
         {/* Key Metrics */}
         <OperationsDashboardCards jobs={jobs} contracts={contracts} bills={bills} personalBills={personalBills} bankAccounts={bankAccounts} payments={payments} />

        {/* Health Score & Schedule Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <BusinessHealthScoreCard jobs={jobs} bills={bills} personalBills={personalBills} bankAccounts={bankAccounts} settings={settings[0]} />
          </div>
          <div>
            <OwnerDecisionAssistant jobs={jobs} contracts={contracts} bills={bills} personalBills={personalBills} bankAccounts={bankAccounts} subcontractors={subcontractors} payments={payments} />
          </div>
        </div>

        {/* Schedule Status Widget */}
        <ScheduleStatusWidget jobs={jobs} />

        {/* Job Pipeline */}
        <JobPipelineVisualization jobStages={jobStages} jobs={jobs} contracts={contracts} />

        {/* Tabs for detailed views */}
        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="jobs">Job Status</TabsTrigger>
            <TabsTrigger value="profitability">Profitability</TabsTrigger>
            <TabsTrigger value="bills">Bills & Payments</TabsTrigger>
            <TabsTrigger value="subcontractors">Subcontractors</TabsTrigger>
          </TabsList>

          {/* Job Status Tab */}
          <TabsContent value="jobs" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {jobCard("Bids Awaiting Contract", bidding.length, "text-yellow-600")}
              {jobCard("Contracted", contracted.length, "text-purple-600")}
              {jobCard("In Progress", inProgress.length, "text-green-600")}
              {jobCard("Completed", completed.length, "text-gray-600")}
              {jobCard("Awaiting Payment", awaitingPayment.length, "text-red-600")}
            </div>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">Jobs Needing Attention</h3>
              <div className="space-y-2">
                {bidding.length > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm">{bidding.length} bid{bidding.length !== 1 ? "s" : ""} awaiting contract</span>
                  </div>
                )}
                {awaitingPayment.length > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm">{awaitingPayment.length} invoice{awaitingPayment.length !== 1 ? "s" : ""} unpaid ({formatCurrency(awaitingPayment.reduce((s, j) => s + j.contract_amount - j.deposits_received, 0))})</span>
                  </div>
                )}
                {bidding.length === 0 && awaitingPayment.length === 0 && (
                  <p className="text-sm text-muted-foreground">All jobs on track.</p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Profitability Tab */}
          <TabsContent value="profitability" className="mt-4 space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Top Profitable Jobs</h3>
              <div className="space-y-2">
                {jobs
                  .filter(j => (j.contract_amount || 0) > 0)
                  .map(j => {
                    const totalCosts = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.overhead_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.other_costs || 0);
                    const revenue = (j.contract_amount || 0) + (j.change_orders_total || 0);
                    const profit = revenue - totalCosts;
                    const margin = revenue > 0 ? ((profit / revenue) * 100) : 0;
                    return { ...j, totalCosts, revenue, profit, margin };
                  })
                  .sort((a, b) => b.profit - a.profit)
                  .slice(0, 5)
                  .map(j => (
                    <div key={j.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{j.title}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(j.revenue)} contract</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${j.profit > 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(j.profit)}</p>
                        <p className="text-xs text-muted-foreground">{j.margin.toFixed(1)}% margin</p>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Projected Earnings */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h3 className="font-semibold mb-4">Projected Earnings (120 Days)</h3>
              <div className="space-y-3">
                {jobs
                  .filter(j => j.status === 'contracted' || j.status === 'in_progress')
                  .map(j => {
                    const totalCosts = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.overhead_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.other_costs || 0);
                    const revenue = (j.contract_amount || 0) + (j.change_orders_total || 0);
                    const profit = revenue - totalCosts;
                    return { ...j, profit, revenue, totalCosts };
                  })
                  .length === 0 ? (
                    <p className="text-sm text-muted-foreground">No contracted or in-progress jobs.</p>
                  ) : (
                    <>
                      {jobs
                        .filter(j => j.status === 'contracted' || j.status === 'in_progress')
                        .map(j => {
                          const totalCosts = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.overhead_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.other_costs || 0);
                          const revenue = (j.contract_amount || 0) + (j.change_orders_total || 0);
                          const profit = revenue - totalCosts;
                          return (
                            <div key={j.id} className="flex items-center justify-between p-2 bg-white rounded">
                              <p className="text-sm font-medium">{j.title}</p>
                              <p className="text-sm font-bold text-blue-600">{formatCurrency(profit)}</p>
                            </div>
                          );
                        })}
                      <div className="border-t pt-3 mt-3">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">Total Projected</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(
                              jobs
                                .filter(j => j.status === 'contracted' || j.status === 'in_progress')
                                .reduce((sum, j) => {
                                  const costs = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.overhead_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.other_costs || 0);
                                  const rev = (j.contract_amount || 0) + (j.change_orders_total || 0);
                                  return sum + (rev - costs);
                                }, 0)
                            )}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
              </div>
            </Card>
          </TabsContent>

          {/* Bills Tab */}
          <TabsContent value="bills" className="space-y-4 mt-4">
            {overdueBills.length > 0 && (
              <Card className="p-4 border-red-200 bg-red-50">
                <h3 className="font-semibold mb-3 text-red-700">⚠ Overdue Bills</h3>
                <div className="space-y-2">
                  {overdueBills.slice(0, 5).map(b => (
                    <div key={b.id} className="flex justify-between text-sm">
                      <span>{b.title}</span>
                      <span className="font-bold">{formatCurrency(b.amount)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {upcomingBills.length > 0 && (
              <Card className="p-4 border-yellow-200 bg-yellow-50">
                <h3 className="font-semibold mb-3 text-yellow-700">📅 Due This Week</h3>
                <div className="space-y-2">
                  {upcomingBills.slice(0, 5).map(b => (
                    <div key={b.id} className="flex justify-between text-sm">
                      <span>{b.title}</span>
                      <span className="font-bold">{formatCurrency(b.amount)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Subcontractors Tab */}
          <TabsContent value="subcontractors" className="mt-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Subcontractor Status</h3>
              <div className="space-y-2">
                {subcontractors.slice(0, 5).map(sub => {
                  const subPayments = payments.filter(p => p.subcontractor_id === sub.id && p.status === "paid");
                  const totalPaid = subPayments.reduce((s, p) => s + (p.amount || 0), 0);
                  return (
                    <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-semibold text-sm">{sub.name}</p>
                        <p className="text-xs text-muted-foreground">{sub.specialty}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatCurrency(totalPaid)}</p>
                        {sub.w9_received && <Badge className="text-xs mt-1">W-9 ✓</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}