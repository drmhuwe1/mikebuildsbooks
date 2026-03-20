import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import WizardShell from "./WizardShell";
import Step1Client from "./Step1Client";
import Step2Project from "./Step2Project";
import Step3Materials from "./Step3Materials";
import Step4Labor from "./Step4Labor";
import Step5Subcontractors from "./Step5Subcontractors";
import Step6OtherCosts from "./Step6OtherCosts";
import Step7OverheadProfit from "./Step7OverheadProfit";
import Step8Payment from "./Step8Payment";
import Step9Documents from "./Step9Documents";
import Step10Summary from "./Step10Summary";

function generateJobNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `JOB-${year}-${rand}`;
}

const defaultData = {
  // Step 1
  client_id: "", client_name: "", client_phone: "", client_email: "", client_address: "", client_billing_address: "",
  // Step 2
  title: "", job_number: generateJobNumber(), project_type: "", scope: "", start_date: "", projected_completion: "", permit_required: false,
  // Step 3
  material_items: [], quote_file_url: "",
  // Step 4
  crew_size: "", hours_per_day: "", labor_days: "", labor_rate: "",
  // Step 5
  sub_items: [],
  // Step 6
  permit_costs: "", equipment_costs: "", dumpster_costs: "", inspection_costs: "", contingency_costs: "", other_costs: "",
  // Step 7
  overhead_percent: "10", target_profit_margin: "20",
  // Step 8
  deposit_amount: "", progress_payment: "", final_payment: "", payment_schedule_notes: "",
};

export default function JobSetupWizard({ initialBid, initialContract, existingJob, onClose, onJobCreated }) {
   const [step, setStep] = useState(1);

   // Pre-fill from bid, contract, or existing job
   const getInitialData = () => {
      if (existingJob) {
        return {
          ...defaultData,
          ...existingJob,
          material_items: existingJob.material_items || [],
          sub_items: existingJob.sub_items || [],
        };
      }
      if (initialContract) {
        const contractAmt = parseFloat(initialContract.contract_amount) || 0;
        const depositAmt = parseFloat(initialContract.deposit_amount) || 0;
        const startAmt = parseFloat(initialContract.start_of_construction_amount) || 0;
        const finalAmt = parseFloat(initialContract.final_payment_amount) || Math.max(0, contractAmt - depositAmt - startAmt);
        return {
          ...defaultData,
          client_id: initialContract.client_id || "",
          client_name: initialContract.client_name || "",
          client_last_name: initialContract.client_last_name || "",
          client_address: initialContract.client_address || "",
          client_zip_code: initialContract.client_zip_code || "",
          client_city: initialContract.client_city || "",
          client_state: initialContract.client_state || "",
          title: initialContract.title || "",
          scope: initialContract.scope_summary || "",
          deposit_amount: depositAmt,
          progress_payment: startAmt,
          final_payment: finalAmt,
          bid_amount_estimate: contractAmt,
          // Pre-fill a single material line so costs reflect the contract amount
          // This prevents the wizard from recalculating from $0
          _use_contract_amount: true,
        };
      }
      if (!initialBid) return defaultData;
      return {
        ...defaultData,
        client_id: initialBid.client_id || "",
        client_name: initialBid.client_name || "",
        client_last_name: initialBid.client_last_name || "",
        client_email: initialBid.client_email || "",
        client_phone: initialBid.client_phone || "",
        client_address: initialBid.project_address || "",
        client_billing_address: initialBid.project_address || "",
        client_zip_code: initialBid.project_zip_code || "",
        client_city: initialBid.project_city || "",
        client_state: initialBid.project_state || "",
        title: initialBid.title || "",
        scope: initialBid.scope_summary || "",
        project_zip_code: initialBid.project_zip_code || "",
        project_city: initialBid.project_city || "",
        project_state: initialBid.project_state || "",
        material_items: initialBid.material_items || [],
        bid_amount_estimate: initialBid.bid_amount || "",
      };
    };

   const [data, setData] = useState(getInitialData());
   const [saving, setSaving] = useState(false);
   const qc = useQueryClient();

   const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list("-created_date", 200) });
   const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });
   const appSettings = settings[0] || {};

  // Derived financial totals (computed fresh each render)
  const materialSubtotal = (data.material_items || []).reduce((s, r) => s + (parseFloat(r.total) || 0), 0);
  const laborCost = (parseFloat(data.crew_size) || 0) * (parseFloat(data.hours_per_day) || 0) * (parseFloat(data.labor_days) || 0) * (parseFloat(data.labor_rate) || 0);

  const calcSubPayout = (item) => {
    const v = parseFloat(item.value) || 0;
    switch (item.payment_type) {
      case "fixed": return v;
      case "hourly": return v;
      case "percent_labor": return (v / 100) * laborCost;
      case "percent_profit": return (v / 100) * (laborCost + materialSubtotal);
      default: return v;
    }
  };
  const subTotal = (data.sub_items || []).reduce((s, item) => s + calcSubPayout(item), 0);

  const otherCostsTotal = ["permit_costs", "equipment_costs", "dumpster_costs", "inspection_costs", "contingency_costs", "other_costs"]
    .reduce((s, k) => s + (parseFloat(data[k]) || 0), 0);

  const directCost = materialSubtotal + laborCost + subTotal + otherCostsTotal;
  const overhead = parseFloat(data.overhead_percent) || 0;
  const margin = parseFloat(data.target_profit_margin) || 0;
  const overheadAmount = directCost * (overhead / 100);
  const totalCost = directCost + overheadAmount;

  // If launched from a contract/bid and no costs were entered in the wizard,
  // use the known contract amount directly instead of recalculating from scratch
  const hasWizardCosts = directCost > 0;
  const contractAmountFallback = parseFloat(data.bid_amount_estimate) || 0;
  const bidAmount = hasWizardCosts
    ? (margin > 0 ? totalCost / (1 - margin / 100) : totalCost)
    : contractAmountFallback;
  const grossProfit = bidAmount - totalCost;

  const totals = { directCost, materialSubtotal, laborCost, subTotal, otherCostsTotal, totalCost, bidAmount, grossProfit };

  const warnings = [];
  if (!data.title) warnings.push("No project name entered");
  if (!data.client_name) warnings.push("No client information entered");
  if (materialSubtotal === 0 && laborCost === 0) warnings.push("No costs entered");
  if (!data.deposit_amount && !data.final_payment) warnings.push("No payment schedule created");

  const stepValidation = {
    1: !!data.client_name && !!data.client_address,
    2: !!data.title && !!data.scope,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
    8: true,
    9: true,
    10: true,
  };

  const handleNext = async () => {
    if (step < 10) {
      setStep(s => s + 1);
    } else {
      await createJob();
    }
  };

  const createJob = async () => {
    setSaving(true);

    // Create or link client
    let clientId = data.client_id;
    if (!clientId && data.client_name) {
      const existing = clients.find(c => c.name?.toLowerCase() === data.client_name.toLowerCase());
      if (existing) {
        clientId = existing.id;
      } else {
        const newClient = await base44.entities.Client.create({
          name: data.client_name,
          phone: data.client_phone,
          email: data.client_email,
          address: data.client_address,
          status: "active",
        });
        clientId = newClient.id;
      }
    }

    const scopeWithType = data.project_type ? `[${data.project_type}] ${data.scope}` : data.scope;

    const jobData = {
      title: data.title,
      client_id: clientId,
      client_name: data.client_name,
      address: data.client_address,
      zip_code: data.client_zip_code || "",
      city: data.client_city || "",
      state: data.client_state || "",
      scope: scopeWithType,
      status: "contracted",
      start_date: data.start_date || null,
      projected_completion: data.projected_completion || null,
      contract_amount: Math.round(bidAmount),
      deposits_received: parseFloat(data.deposit_amount) || 0,
      material_costs: Math.round(materialSubtotal),
      labor_costs: Math.round(laborCost),
      subcontractor_costs: Math.round(subTotal),
      permit_costs: parseFloat(data.permit_costs) || 0,
      equipment_costs: parseFloat(data.equipment_costs) || 0,
      overhead_costs: Math.round(overheadAmount),
      other_costs: (parseFloat(data.dumpster_costs) || 0) + (parseFloat(data.inspection_costs) || 0) + (parseFloat(data.contingency_costs) || 0) + (parseFloat(data.other_costs) || 0),
      notes: [
        data.payment_schedule_notes ? `Payment Schedule: ${data.payment_schedule_notes}` : "",
        data.quote_file_url ? `Quote File: ${data.quote_file_url}` : "",
        data.permit_required ? "⚠ Permit required" : "",
        `Job Number: ${data.job_number}`,
      ].filter(Boolean).join("\n"),
    };

    const job = existingJob
      ? await base44.entities.Job.update(existingJob.id, jobData)
      : await base44.entities.Job.create(jobData);

    // Create or update bid record
    const bidData = {
      title: `${data.title} — Estimate`,
      client_id: clientId,
      client_name: data.client_name,
      job_id: job.id,
      status: "sent",
      scope_summary: data.scope,
      project_address: data.client_address || "",
      project_zip_code: data.client_zip_code || "",
      project_city: data.client_city || "",
      project_state: data.client_state || "",
      material_cost: Math.round(materialSubtotal),
      labor_hours: (parseFloat(data.crew_size) || 0) * (parseFloat(data.hours_per_day) || 0) * (parseFloat(data.labor_days) || 0),
      labor_rate: parseFloat(data.labor_rate) || 0,
      subcontractor_cost: Math.round(subTotal),
      permit_cost: parseFloat(data.permit_costs) || 0,
      overhead_percent: overhead,
      target_profit_margin: margin,
      total_estimated_cost: Math.round(totalCost),
      bid_amount: Math.round(bidAmount),
      gross_profit: Math.round(grossProfit),
    };

    if (data.bid_id) {
      await base44.entities.Bid.update(data.bid_id, bidData);
    } else {
      await base44.entities.Bid.create(bidData);
    }

    // Create subcontractor payment records
    for (const sub of (data.sub_items || [])) {
      if (sub.name) {
        await base44.entities.SubcontractorPayment.create({
          subcontractor_name: sub.name,
          job_id: job.id,
          job_title: data.title,
          amount: calcSubPayout(sub),
          description: `${sub.trade || "General"} — ${data.title}`,
          status: "pending",
        });
      }
    }

    qc.invalidateQueries({ queryKey: ["jobs"] });
    qc.invalidateQueries({ queryKey: ["bids"] });
    qc.invalidateQueries({ queryKey: ["clients"] });

    setSaving(false);
    onJobCreated?.(job);
    onClose();
  };

  const richData = {
    ...data,
    _materialSubtotal: materialSubtotal,
    _laborCost: laborCost,
    _subTotal: subTotal,
    _bidAmount: bidAmount,
    _grossProfit: grossProfit,
    _totalCost: totalCost,
  };

  const stepProps = { data, onChange: setData };

  return (
    <WizardShell
      currentStep={step}
      onBack={() => setStep(s => Math.max(1, s - 1))}
      onNext={handleNext}
      onClose={onClose}
      nextDisabled={!stepValidation[step] || saving}
      nextLabel={saving ? "Creating..." : undefined}
      isLastStep={step === 10}
    >
      {step === 1 && <Step1Client {...stepProps} existingClients={clients} />}
      {step === 2 && <Step2Project {...stepProps} />}
      {step === 3 && <Step3Materials {...stepProps} />}
      {step === 4 && <Step4Labor {...stepProps} />}
      {step === 5 && <Step5Subcontractors {...stepProps} />}
      {step === 6 && <Step6OtherCosts {...stepProps} />}
      {step === 7 && <Step7OverheadProfit {...stepProps} onChange={setData} totals={totals} />}
      {step === 8 && <Step8Payment {...stepProps} bidAmount={bidAmount} />}
      {step === 9 && <Step9Documents wizardData={richData} settings={appSettings} />}
      {step === 10 && <Step10Summary wizardData={richData} warnings={warnings} settings={appSettings} />}
    </WizardShell>
  );
}