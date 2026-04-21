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

export default function JobSetupWizard({ initialBid, initialContract, initialChangeOrder, existingJob, onClose, onJobCreated }) {
   const [step, setStep] = useState(1);

   // Pre-fill from bid, contract, change order, or existing job
   const getInitialData = () => {
      if (existingJob) {
        return {
          ...defaultData,
          ...existingJob,
          material_items: existingJob.material_items || [],
          sub_items: existingJob.sub_items || [],
        };
      }
      if (initialChangeOrder) {
        const coAmt = parseFloat(initialChangeOrder.change_order_amount) || 0;
        // Parse full address if available
        const parseAddress = (addressStr) => {
          if (!addressStr) return {};
          const trimmed = addressStr.trim();
          const stateZipMatch = trimmed.match(/([A-Z]{2})\s+(\d{5})/);
          if (!stateZipMatch) return { client_address: addressStr };
          const state = stateZipMatch[1];
          const zip = stateZipMatch[2];
          const beforeStateZip = trimmed.substring(0, stateZipMatch.index).trim();
          let street = beforeStateZip;
          let city = "";
          if (beforeStateZip.includes(",")) {
            const parts = beforeStateZip.split(",");
            street = parts[0].trim();
            city = parts[1].trim();
          } else {
            const words = beforeStateZip.split(" ");
            if (words.length > 1) {
              city = words.pop().trim();
              street = words.join(" ").trim();
            }
          }
          return street && city ? { client_address: street, client_city: city, client_state: state, client_zip_code: zip } : { client_address: addressStr };
        };
        const parsedAddr = parseAddress(initialChangeOrder.client_address);
        
        // If updating existing job, add CO costs to job's existing costs; otherwise use CO costs as-is
        const existingMaterialCosts = existingJob?.material_costs || 0;
        const existingLaborCosts = existingJob?.labor_costs || 0;
        const existingSubCosts = existingJob?.subcontractor_costs || 0;
        const existingPermitCosts = existingJob?.permit_costs || 0;
        const existingEquipCosts = existingJob?.equipment_costs || 0;
        
        const cOMaterialCost = parseFloat(initialChangeOrder.material_cost) || 0;
        const coLaborCost = parseFloat(initialChangeOrder.labor_cost) || 0;
        const coSubCost = parseFloat(initialChangeOrder.subcontractor_cost) || 0;
        const coPermitCost = parseFloat(initialChangeOrder.permit_cost) || 0;
        const coEquipCost = parseFloat(initialChangeOrder.equipment_cost) || 0;
        
        return {
          ...defaultData,
          client_id: initialChangeOrder.client_id || "",
          client_name: initialChangeOrder.client_name || "",
          client_last_name: initialChangeOrder.client_last_name || "",
          client_address: parsedAddr.client_address || "",
          client_city: parsedAddr.client_city || "",
          client_state: parsedAddr.client_state || "",
          client_zip_code: parsedAddr.client_zip_code || "",
          title: initialChangeOrder.title || `Change Order - ${initialChangeOrder.job_title}`,
          scope: initialChangeOrder.scope_summary || initialChangeOrder.project_description || "",
          // Costs: add CO costs to existing job costs
          material_items: [{
            name: "Materials",
            vendor: "",
            qty: 1,
            unit_cost: existingMaterialCosts + cOMaterialCost,
            total: existingMaterialCosts + cOMaterialCost
          }],
          crew_size: "1",
          hours_per_day: "8",
          labor_days: (coLaborCost + existingLaborCosts) > 0 
            ? String(Math.max(1, Math.ceil((coLaborCost + existingLaborCosts) / (parseFloat(initialChangeOrder.labor_rate) || 45) / 8)))
            : "1",
          labor_rate: String(parseFloat(initialChangeOrder.labor_rate) || 45),
          permit_costs: String(coPermitCost + existingPermitCosts),
          equipment_costs: String(coEquipCost + existingEquipCosts),
          sub_items: (coSubCost + existingSubCosts) > 0 ? [{
            name: "Subcontractors",
            trade: "Various",
            payment_type: "fixed",
            value: coSubCost + existingSubCosts
          }] : [],
          deposit_amount: String(parseFloat(initialChangeOrder.deposit_amount) || 0),
          final_payment: String(coAmt),
          bid_amount_estimate: coAmt,
          target_profit_margin: "20",
          overhead_percent: "10",
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
  const isPercentageMode = appSettings.overhead_mode === "percentage";
  const overheadAmount = isPercentageMode
    ? (parseFloat(data.bid_amount_estimate) || 0) * ((appSettings.default_overhead_percent ?? 10) / 100)
    : directCost * (overhead / 100);
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
      contract_amount: Math.round(bidAmount) || Math.round(contractAmountFallback),
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

    // If job was created from a change order, link the CO back to this new job
    if (initialChangeOrder && !existingJob) {
      await base44.entities.ChangeOrder.update(initialChangeOrder.id, { job_id: job.id });
    }

    // Auto-create municipality record for permit tracking
    try {
      await base44.functions.invoke('createMunicipalityRecord', {
        jobId: job.id,
        address: data.client_address || "",
        city: data.client_city || "",
        state: data.client_state || "",
        zipCode: data.client_zip_code || "",
      });
    } catch (err) {
      console.warn("Could not auto-create municipality:", err.message);
      // Continue anyway - municipality creation is optional
    }

    // Create subcontractor payment records (only if bid already exists)
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
      {step === 7 && <Step7OverheadProfit {...stepProps} onChange={setData} totals={totals} overheadMode={appSettings.overhead_mode || "direct"} defaultOverheadPct={appSettings.default_overhead_percent ?? 10} contractAmount={bidAmount} />}
      {step === 8 && <Step8Payment {...stepProps} bidAmount={bidAmount} />}
      {step === 9 && <Step9Documents wizardData={richData} settings={appSettings} />}
      {step === 10 && <Step10Summary wizardData={richData} warnings={warnings} settings={appSettings} />}
    </WizardShell>
  );
}