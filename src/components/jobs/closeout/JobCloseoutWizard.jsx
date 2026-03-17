import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

import CloseoutStep1Completion from "./CloseoutStep1Completion";
import CloseoutStep2Materials from "./CloseoutStep2Materials";
import CloseoutStep3Labor from "./CloseoutStep3Labor";
import CloseoutStep4Subcontractors from "./CloseoutStep4Subcontractors";
import CloseoutStep5FinancialSummary from "./CloseoutStep5FinancialSummary";
import CloseoutStep6Reserves from "./CloseoutStep6Reserves";
import CloseoutStep7Payouts from "./CloseoutStep7Payouts";
import CloseoutStep8Documents from "./CloseoutStep8Documents";
import CloseoutStep9MarkClosed from "./CloseoutStep9MarkClosed";

const STEPS = [
  "Project Completion",
  "Final Materials",
  "Final Labor",
  "Subcontractor Payments",
  "Financial Summary",
  "Reserve Allocations",
  "Final Payouts",
  "Final Documents",
  "Mark Job Closed",
];

export default function JobCloseoutWizard({ job, onClose, onJobClosed }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);

  const { data: settings = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }),
  });
  const { data: subs = [] } = useQuery({
    queryKey: ["subcontractors"],
    queryFn: () => base44.entities.Subcontractor.list("-created_date", 200),
  });
  const { data: subPayments = [] } = useQuery({
    queryKey: ["subPayments"],
    queryFn: () => base44.entities.SubcontractorPayment.list("-created_date", 500),
  });

  const s = settings[0] || {};

  // Shared closeout state across steps
  const [closeoutData, setCloseoutData] = useState({
    // Step 1
    actual_completion: job.actual_completion || "",
    inspection_passed: false,
    customer_signoff: false,
    completion_notes: "",
    // Step 2
    material_costs: job.material_costs || 0,
    // Step 3
    labor_hours: 0,
    labor_rate: s.default_labor_rate || 45,
    labor_costs: job.labor_costs || 0,
    // Step 4 — handled per sub
    subcontractor_final_payments: {},
    // Step 6 — reserve adjustments
    reserve_overrides: {},
    // Step 7 — payout confirmations
    payouts_confirmed: false,
  });

  const update = (patch) => setCloseoutData((d) => ({ ...d, ...patch }));

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Job.update(job.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["subPayments"] });
    },
  });

  const jobSubPayments = subPayments.filter((p) => p.job_id === job.id);

  const revenue = (job.contract_amount || 0) + (job.change_orders_total || 0);
  const materialCosts = closeoutData.material_costs;
  const laborCosts = closeoutData.labor_costs;
  const subCosts = job.subcontractor_costs || 0;
  const otherCosts = (job.permit_costs || 0) + (job.equipment_costs || 0) + (job.other_costs || 0);
  const overhead = job.overhead_costs || 0;
  const totalCosts = materialCosts + laborCosts + subCosts + otherCosts + overhead;
  const grossProfit = revenue - totalCosts;
  const managerPct = s.manager_pay_percent ?? 10;
  const managerPay = Math.max(0, grossProfit * (managerPct / 100));
  const netAfterManager = grossProfit - managerPay;

  const defaultReserves = {
    tax_reserve: { label: "Tax Reserve", pct: s.tax_reserve_percent || 25, amount: Math.max(0, netAfterManager * ((s.tax_reserve_percent || 25) / 100)) },
    operating_reserve: { label: "Operating Reserve", pct: s.operating_reserve_percent || 10, amount: Math.max(0, netAfterManager * ((s.operating_reserve_percent || 10) / 100)) },
    owner_payout: { label: "Owner Payout", pct: s.owner_payout_percent || 30, amount: Math.max(0, netAfterManager * ((s.owner_payout_percent || 30) / 100)) },
    admin_compensation: { label: "Admin Compensation", pct: s.admin_compensation_percent || 15, amount: Math.max(0, netAfterManager * ((s.admin_compensation_percent || 15) / 100)) },
    retained_earnings: { label: "Retained Earnings", pct: s.retained_earnings_percent || 10, amount: Math.max(0, netAfterManager * ((s.retained_earnings_percent || 10) / 100)) },
  };

  const financials = { revenue, materialCosts, laborCosts, subCosts, otherCosts, overhead, totalCosts, grossProfit, managerPay, netAfterManager, managerPct };

  const handleFinalClose = async () => {
    await updateMutation.mutateAsync({
      status: "completed",
      actual_completion: closeoutData.actual_completion || new Date().toISOString().split("T")[0],
      material_costs: closeoutData.material_costs,
      labor_costs: closeoutData.labor_costs,
      notes: job.notes ? job.notes + "\n\n[CLOSED] " + (closeoutData.completion_notes || "") : closeoutData.completion_notes || "",
    });
    toast({ title: "Job closed successfully!", description: `${job.title} has been marked as completed.` });
    onJobClosed?.();
    onClose();
  };

  const stepProps = { job, closeoutData, update, subs, jobSubPayments, financials, defaultReserves, settings: s };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Job Closeout Wizard</p>
            <p className="text-sm font-bold truncate">{job.title}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step progress */}
        <div className="px-5 py-3 border-b shrink-0 bg-muted/30">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
                    i === step ? "bg-primary text-primary-foreground" :
                    i < step ? "text-green-600 cursor-pointer" : "text-muted-foreground"
                  }`}
                >
                  {i < step ? <CheckCircle className="w-3 h-3" /> : <span className="w-4 h-4 rounded-full border text-center leading-4 inline-block">{i + 1}</span>}
                  <span className="hidden md:inline">{s}</span>
                </button>
                {i < STEPS.length - 1 && <span className="text-muted-foreground/40 text-xs shrink-0">›</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {step === 0 && <CloseoutStep1Completion {...stepProps} />}
          {step === 1 && <CloseoutStep2Materials {...stepProps} />}
          {step === 2 && <CloseoutStep3Labor {...stepProps} />}
          {step === 3 && <CloseoutStep4Subcontractors {...stepProps} />}
          {step === 4 && <CloseoutStep5FinancialSummary {...stepProps} />}
          {step === 5 && <CloseoutStep6Reserves {...stepProps} />}
          {step === 6 && <CloseoutStep7Payouts {...stepProps} />}
          {step === 7 && <CloseoutStep8Documents {...stepProps} />}
          {step === 8 && <CloseoutStep9MarkClosed {...stepProps} onConfirm={handleFinalClose} saving={updateMutation.isPending} />}
        </div>

        {/* Footer nav */}
        {step < 8 && (
          <div className="flex items-center justify-between px-5 py-3 border-t shrink-0 bg-card">
            <Button variant="outline" size="sm" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <span className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
            <Button size="sm" onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}