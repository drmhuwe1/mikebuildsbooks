import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, Pencil } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatDate } from "@/lib/formatters";
import JobMunicipalityDetail from "./JobMunicipalityDetail";
import JobExpensesTab from "./JobExpensesTab";
import JobPaymentTracking from "./JobPaymentTracking.jsx";
import JobFinancialsTab from "./JobFinancialsTab";
import SignedContractManager from "@/components/contracts/SignedContractManager";
import JobChangeOrdersTab from "@/components/changeorders/JobChangeOrdersTab";
import JobPhotoGallery from "@/components/photos/JobPhotoGallery";
import JobDailyLogTab from "@/components/dailylog/JobDailyLogTab";
import JobSubLaborTab from "@/components/jobs/JobSubLaborTab";
import JobMaterialsTab from "@/components/jobs/JobMaterialsTab";
import JobManagerPayTab from "@/components/jobs/JobManagerPayTab";

export default function JobDetailDialog({ job, open, onOpenChange, onEditJob }) {
  const qc = useQueryClient();
  const { data: subPayments = [] } = useQuery({ queryKey: ["subPayments", job?.id], queryFn: () => base44.entities.SubcontractorPayment.filter({ job_id: job?.id }), enabled: !!job?.id });
  const { data: ledgerPayments = [] } = useQuery({ queryKey: ["ledgerPayments", job?.id], queryFn: () => base44.entities.SubcontractorLedgerPayment.filter({ job_id: job?.id }), enabled: !!job?.id });
  const { data: settingsList = [] } = useQuery({ queryKey: ["appSettings"], queryFn: () => base44.entities.AppSettings.list() });
  const company = settingsList[0] || {};

  if (!job) return null;

  const contractRevenue = (job.contract_amount || 0) + (job.change_orders_total || 0);
  const actualRevenue = (job.deposits_received || 0) + (job.change_orders_total || 0);
  const costs = (job.material_costs || 0) + (job.labor_costs || 0) + (job.subcontractor_costs || 0) + (job.permit_costs || 0) + (job.equipment_costs || 0) + (job.overhead_costs || 0) + (job.other_costs || 0);
  const profit = actualRevenue - costs;
  const margin = actualRevenue > 0 ? ((profit / actualRevenue) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>{job.title}</DialogTitle>
            {onEditJob && (
              <Button size="sm" variant="outline" onClick={() => { onOpenChange(false); onEditJob(job); }} className="gap-1.5 text-xs h-7">
                <Pencil className="w-3 h-3" /> Edit Job Info
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <div className="overflow-x-auto -mx-1 px-1">
            <TabsList className="flex w-max min-w-full gap-0">
              <TabsTrigger value="overview" className="flex-1 text-xs px-2">Overview</TabsTrigger>
              <TabsTrigger value="financials" className="flex-1 text-xs px-2">Financials</TabsTrigger>
              <TabsTrigger value="payments" className="flex-1 text-xs px-2">Payments</TabsTrigger>
              <TabsTrigger value="expenses" className="flex-1 text-xs px-2">Expenses</TabsTrigger>
              <TabsTrigger value="contract" className="flex-1 text-xs px-2">Contract</TabsTrigger>
              <TabsTrigger value="photos" className="flex-1 text-xs px-2">Photos</TabsTrigger>
              <TabsTrigger value="dailylog" className="flex-1 text-xs px-2">Daily Log</TabsTrigger>
              <TabsTrigger value="changeorders" className="flex-1 text-xs px-2">Change Orders</TabsTrigger>
              <TabsTrigger value="sublabor" className="flex-1 text-xs px-2">Sub Labor</TabsTrigger>
              <TabsTrigger value="materials" className="flex-1 text-xs px-2">Materials</TabsTrigger>
              <TabsTrigger value="municipality" className="flex-1 text-xs px-2">Municipality</TabsTrigger>
              <TabsTrigger value="managerpay" className="flex-1 text-xs px-2">Mgr Pay</TabsTrigger>
            </TabsList>
          </div>

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

          <TabsContent value="financials" className="mt-4">
            <JobFinancialsTab job={job} />
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <JobPaymentTracking job={job} subPayments={subPayments} ledgerPayments={ledgerPayments} />
          </TabsContent>

          <TabsContent value="expenses" className="mt-4">
            <JobExpensesTab job={job} />
          </TabsContent>

          <TabsContent value="contract" className="mt-4">
            <SignedContractManager
              entityId={job.id}
              entityType="Job"
              signedImages={job.signed_contract_images || []}
              isSignedAndAccepted={job.signed_and_accepted || false}
              onUpdate={() => qc.invalidateQueries({ queryKey: ["jobs"] })}
            />
          </TabsContent>

          <TabsContent value="photos" className="mt-4">
            <JobPhotoGallery job={job} company={company} />
          </TabsContent>

          <TabsContent value="dailylog" className="mt-4">
            <JobDailyLogTab job={job} />
          </TabsContent>

          <TabsContent value="changeorders" className="mt-4">
            <JobChangeOrdersTab job={job} />
          </TabsContent>

          <TabsContent value="sublabor" className="mt-4">
            <JobSubLaborTab job={job} />
          </TabsContent>

          <TabsContent value="materials" className="mt-4">
            <JobMaterialsTab job={job} />
          </TabsContent>

          <TabsContent value="municipality" className="mt-4">
            <JobMunicipalityDetail jobId={job.id} job={job} />
          </TabsContent>

          <TabsContent value="managerpay" className="mt-4">
            <JobManagerPayTab job={job} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}