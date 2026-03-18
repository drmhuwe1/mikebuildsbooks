import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Calculator, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/formatters";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import BidIntelligencePanel from "./BidIntelligencePanel";
import BidHistoricalComparison from "./BidHistoricalComparison";
import BidValidationPanel from "./BidValidationPanel";
import BidSignatureSection from "./BidSignatureSection";
import { calculateBidIntelligence } from "@/lib/bidIntelligence";
import { predictJobProfit } from "@/lib/financialIntelligence";

const STEPS = ["Basics", "Costs", "Margins", "Payment & Terms", "Review", "Signatures"];

export default function BidWizard({ bid, onClose }) {
  const qc = useQueryClient();
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list("-created_date", 200) });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });
  const { data: allJobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 200) });
  const { data: allMaterials = [] } = useQuery({ queryKey: ["materials"], queryFn: () => base44.entities.MaterialCost.list("-created_date", 200) });
  const { data: allBids = [] } = useQuery({ queryKey: ["bids"], queryFn: () => base44.entities.Bid.list("-created_date", 200) });

  const s = settings[0] || {};
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => {
    const defaults = {
      title: "", client_id: "", client_name: "", client_last_name: "", status: "draft", scope_summary: "", 
      material_cost: 0, labor_hours: 0, labor_rate: s.default_labor_rate || 45,
      subcontractor_cost: 0, permit_cost: 0, permit_cost_min: 0, permit_cost_max: 0, equipment_cost: 0,
      overhead_percent: s.default_overhead_percent ?? 10, contingency_percent: s.default_contingency_percent ?? 5,
      target_profit_margin: s.default_profit_margin ?? 20, notes: "", valid_until: "",
      deposit_percent: 50, deposit_amount: 0, disclaimer: "",
      start_of_construction_label: "Upon completion and passing of framing and footer inspection:",
      start_of_construction_amount: 0,
      final_payment_amount: 0,
      client_paid_amount: 0,
      change_orders: "Any changes to the scope of work, timeline, or specifications must be documented in writing and signed by both parties prior to commencement of the changed work. Change orders may result in adjustments to the contract price and/or timeline. No extra charges shall be incurred without prior written authorization.",
      contractor_signature_name: "", contractor_signature_date: "",
      customer_signature_name: "", customer_signature_date: "",
      contractor_signed: false, customer_signed: false,
      additional_notes: "",
      unforeseen_conditions: "If unforeseen conditions are encountered during construction that affect the scope of work, budget, or timeline, the contractor will notify the client immediately and provide a change order estimate.",
      permits_inspections: "All required permits and inspections are the responsibility of the contractor unless otherwise specified. Costs are included in the bid unless the scope changes.",
      weather_delays: "Project timeline may be affected by weather conditions. The contractor will make reasonable efforts to minimize delays, but schedule adjustments may be necessary.",
      site_access: "The client must provide reasonable access to the project site during scheduled working hours.",
    };
    if (bid) {
      return {
        ...defaults,
        ...bid,
        client_paid_amount: bid.client_paid_amount || 0,
      };
    }
    return defaults;
  });
  const [validationData, setValidationData] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setNum = (k, v) => setForm(f => ({ ...f, [k]: parseFloat(v) || 0 }));

  const calc = useMemo(() => {
    const laborCost = form.labor_hours * form.labor_rate;
    const permitCost = form.permit_cost_min && form.permit_cost_max ? (form.permit_cost_min + form.permit_cost_max) / 2 : form.permit_cost;
    const directCosts = form.material_cost + laborCost + form.subcontractor_cost + permitCost + form.equipment_cost;
    const overhead = directCosts * (form.overhead_percent / 100);
    const contingency = directCosts * (form.contingency_percent / 100);
    const totalEstimatedCost = directCosts + overhead + contingency;
    
    // Use stored bid_amount if it exists and is > 0, otherwise calculate from margin
    const bidAmount = (form.bid_amount && form.bid_amount > 0) ? form.bid_amount : (totalEstimatedCost > 0 ? totalEstimatedCost / (1 - form.target_profit_margin / 100) : 0);
    const grossProfit = bidAmount - totalEstimatedCost;
    const netProfit = bidAmount - directCosts - overhead - contingency;
    
    // Calculate payment breakdown: Deposit + Second Payment + Final Payment = Bid Amount
    const depositAmt = form.deposit_amount || (bidAmount * ((form.deposit_percent || 50) / 100));
    const secondPaymentAmt = form.start_of_construction_amount || 0;
    const finalPaymentAmt = Math.max(0, bidAmount - depositAmt - secondPaymentAmt);
    
    return { 
      laborCost, permitCost, directCosts, overhead, contingency, totalEstimatedCost, bidAmount, grossProfit, netProfit,
      depositAmt, secondPaymentAmt, finalPaymentAmt 
    };
  }, [form]);

  const bidIntelligence = useMemo(() => {
    return calculateBidIntelligence({ ...form, bid_amount: calc.bidAmount }, allJobs, allMaterials, allBids);
  }, [form, calc.bidAmount, allJobs, allMaterials, allBids]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // Auto-create client if needed
      let clientId = data.client_id;
      if (!clientId && data.client_name) {
        const newClient = await base44.entities.Client.create({
          name: [data.client_name, data.client_last_name].filter(Boolean).join(" "),
        });
        clientId = newClient.id;
      }

      // Create or update bid
      const bidData = {
        ...data,
        client_id: clientId,
        client_paid_amount: parseFloat(data.client_paid_amount) || 0,
      };
      const createdBid = bid?.id 
        ? await base44.entities.Bid.update(bid.id, bidData)
        : await base44.entities.Bid.create(bidData);

      // Auto-create job in "bidding" status (only for new bids)
      if (!bid?.id && createdBid) {
        await base44.entities.Job.create({
          title: data.title || "New Project",
          client_id: clientId,
          client_name: data.client_name,
          scope: data.scope_summary,
          status: "bidding",
          bid_id: createdBid.id,
        });



        // Auto-create draft proposal document
        await base44.entities.Document.create({
          title: `Proposal - ${data.title}`,
          type: "proposal",
          bid_id: createdBid.id,
          client_id: clientId,
          notes: `Draft proposal from bid. Client: ${data.client_name}. Amount: $${data.bid_amount}`,
        });
      }

      return createdBid;
    },
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["bids"] }); 
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["contracts"] });
      qc.invalidateQueries({ queryKey: ["documents"] });
      onClose(); 
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      ...form,
      client_paid_amount: parseFloat(form.client_paid_amount) || 0,
      disclaimer: form.disclaimer || "",
      total_estimated_cost: Math.round(calc.totalEstimatedCost * 100) / 100,
      bid_amount: Math.round(calc.bidAmount * 100) / 100,
      gross_profit: Math.round(calc.grossProfit * 100) / 100,
      net_profit: Math.round(calc.netProfit * 100) / 100,
      deposit_amount: Math.round(calc.depositAmt * 100) / 100,
      start_of_construction_amount: Math.round(calc.secondPaymentAmt * 100) / 100,
      final_payment_amount: Math.round(calc.finalPaymentAmt * 100) / 100,
    });
  };

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    set("client_id", clientId);
    set("client_name", client?.name || "");
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onClose}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
        <h2 className="text-lg font-bold">{bid ? "Edit Bid" : "New Bid"}</h2>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <React.Fragment key={s + i}>
            <button
              onClick={() => setStep(i)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="w-3 h-3 inline mr-1" /> : null}{s}
            </button>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
          </React.Fragment>
        ))}
      </div>

      <Card className="p-6">
        {step === 0 && (
          <div className="space-y-4">
            <GuidedPrompt message="Start by entering the basic bid information." variant="info" />
            <div><Label>Bid Title *</Label><Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Kitchen Renovation - Smith" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Client</Label>
                <Select value={form.client_id} onValueChange={handleClientChange}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["draft","sent","approved","rejected","expired"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Client First Name</Label><Input value={form.client_name} onChange={e => set("client_name", e.target.value)} placeholder="First name" /></div>
              <div><Label>Client Last Name</Label><Input value={form.client_last_name} onChange={e => set("client_last_name", e.target.value)} placeholder="Last name" /></div>
            </div>
            <div><Label>Scope Summary</Label><Textarea value={form.scope_summary} onChange={e => set("scope_summary", e.target.value)} rows={3} placeholder="Describe the work..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valid Until</Label><Input type="date" value={form.valid_until} onChange={e => set("valid_until", e.target.value)} /></div>
            </div>
            <div><Label>Additional Notes</Label><Textarea value={form.additional_notes} onChange={e => set("additional_notes", e.target.value)} rows={2} placeholder="Any additional notes or special information..." /></div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <GuidedPrompt message="Enter all cost components. Labor cost is calculated from hours × rate." variant="info" />
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Material Cost ($)</Label><Input type="number" value={form.material_cost} onChange={e => setNum("material_cost", e.target.value)} /></div>
              <div><Label>Labor Hours</Label><Input type="number" value={form.labor_hours} onChange={e => setNum("labor_hours", e.target.value)} /></div>
              <div><Label>Labor Rate ($/hr)</Label><Input type="number" value={form.labor_rate} onChange={e => setNum("labor_rate", e.target.value)} /></div>
              <div className="p-3 rounded-lg bg-muted flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Labor Cost:</span>
                <span className="text-sm font-bold">{formatCurrency(calc.laborCost)}</span>
              </div>
              <div><Label>Subcontractor Cost ($)</Label><Input type="number" value={form.subcontractor_cost} onChange={e => setNum("subcontractor_cost", e.target.value)} /></div>
              <div className="col-span-2 grid grid-cols-3 gap-2 items-end"><div><Label>Permit Cost Range</Label><Input type="number" value={form.permit_cost_min} onChange={e => setNum("permit_cost_min", e.target.value)} placeholder="Min" /></div><div><Input type="number" value={form.permit_cost_max} onChange={e => setNum("permit_cost_max", e.target.value)} placeholder="Max" /></div><div className="p-2 rounded-lg bg-muted text-xs font-bold text-right">{form.permit_cost_min ? `$${form.permit_cost_min}-$${form.permit_cost_max}` : "—"}</div></div>
              <div><Label>Equipment Rental ($)</Label><Input type="number" value={form.equipment_cost} onChange={e => setNum("equipment_cost", e.target.value)} /></div>
            </div>
            <div className="p-3 rounded-lg bg-muted flex items-center justify-between">
              <span className="text-sm font-medium">Direct Costs Total:</span>
              <span className="text-base font-bold">{formatCurrency(calc.directCosts)}</span>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h3 className="font-semibold text-sm">Cost Descriptions (optional)</h3>
              <div><Label className="text-sm">Material Details</Label><Textarea value={form.material_description || ""} onChange={e => set("material_description", e.target.value)} rows={2} placeholder="Describe materials being used..." /></div>
              <div><Label className="text-sm">Subcontractor Work</Label><Textarea value={form.subcontractor_description || ""} onChange={e => set("subcontractor_description", e.target.value)} rows={2} placeholder="Describe subcontractor scope..." /></div>
              <div><Label className="text-sm">Equipment & Rentals</Label><Textarea value={form.equipment_description || ""} onChange={e => set("equipment_description", e.target.value)} rows={2} placeholder="Describe equipment being used..." /></div>
              <div><Label className="text-sm">Permits & Inspections</Label><Textarea value={form.permit_description || ""} onChange={e => set("permit_description", e.target.value)} rows={2} placeholder="Describe permit requirements..." /></div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <GuidedPrompt message="Set your overhead, contingency, and profit margin percentages." variant="info" />
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Overhead %</Label><Input type="number" value={form.overhead_percent} onChange={e => setNum("overhead_percent", e.target.value)} /></div>
                <div><Label>Contingency %</Label><Input type="number" value={form.contingency_percent} onChange={e => setNum("contingency_percent", e.target.value)} /></div>
                <div><Label>Target Profit Margin %</Label><Input type="number" value={form.target_profit_margin} onChange={e => setNum("target_profit_margin", e.target.value)} /></div>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} /></div>
            </div>
            <div className="col-span-1">
              <BidIntelligencePanel intelligence={bidIntelligence} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <GuidedPrompt message="Set the total bid amount and payment terms. The second payment is optional—leave blank if not needed." variant="info" />
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Total Bid Amount ($) *</Label><Input type="number" value={form.bid_amount} onChange={e => setNum("bid_amount", e.target.value)} placeholder="e.g. 50000" /></div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between">
                <span className="text-sm text-blue-900 font-medium">Calculated:</span>
                <span className="text-sm font-bold text-blue-900">{formatCurrency(calc.bidAmount)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Deposit Amount ($) *</Label><Input type="number" value={form.deposit_amount} onChange={e => setNum("deposit_amount", e.target.value)} placeholder="e.g. 10000" /></div>
              <div className="p-3 rounded-lg bg-muted flex items-center justify-between">
                <span className="text-sm text-muted-foreground">As % of Bid:</span>
                <span className="text-sm font-bold">{calc.bidAmount > 0 ? ((calc.depositAmt / calc.bidAmount) * 100).toFixed(1) : form.deposit_percent}%</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="font-semibold mb-3 block">Second Payment (Optional)</Label>
              <div className="space-y-3">
                <div><Label className="text-sm">Payment Description / Milestone</Label><Input value={form.start_of_construction_label} onChange={e => set("start_of_construction_label", e.target.value)} placeholder="e.g. Upon completion of framing..." /></div>
                <div><Label className="text-sm">Amount ($)</Label><Input type="number" value={form.start_of_construction_amount} onChange={e => setNum("start_of_construction_amount", e.target.value)} placeholder="Leave blank to skip this payment" /></div>
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="font-semibold mb-3 block">Final Payment</Label>
              <p className="text-xs text-muted-foreground mb-2">Amount automatically calculated as remaining balance</p>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <span className="text-sm text-muted-foreground">Final Payment:</span>
                <span className="font-bold text-lg block text-blue-900">{formatCurrency(calc.finalPaymentAmt)}</span>
              </div>
            </div>

            <div className="border-t pt-4"><Label>Additional Fees or Conditions Disclaimer</Label><Textarea value={form.disclaimer} onChange={e => set("disclaimer", e.target.value)} rows={3} placeholder="e.g., 'Additional fees may only apply if client requests changes to scope'" /></div>

            <div className="border-t pt-4">
              <Label className="font-semibold mb-3 block">Client Paid Amount (optional)</Label>
              <p className="text-xs text-muted-foreground mb-2">Enter if payment has been received. Leave blank if not yet paid.</p>
              <div><Label className="text-sm">Amount Paid ($)</Label><Input type="number" value={form.client_paid_amount} onChange={e => setNum("client_paid_amount", e.target.value)} placeholder="Leave blank if not paid" /></div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h3 className="font-semibold text-sm">Project & Terms (editable defaults below)</h3>
              <div><Label className="text-sm">Project Description</Label><Textarea value={form.project_description || ""} onChange={e => set("project_description", e.target.value)} rows={2} placeholder="Overall project description..." /></div>
              <div><Label className="text-sm">Included in This Bid</Label><Textarea value={form.included_in_bid || ""} onChange={e => set("included_in_bid", e.target.value)} rows={2} placeholder="List what is included..." /></div>
              <div><Label className="text-sm">Material Responsibility</Label><Textarea value={form.material_responsibility || ""} onChange={e => set("material_responsibility", e.target.value)} rows={2} placeholder="Who supplies materials..." /></div>
              <div><Label className="text-sm">Project Timeline</Label><Textarea value={form.project_timeline || ""} onChange={e => set("project_timeline", e.target.value)} rows={2} placeholder="Estimated duration..." /></div>
              <div><Label className="text-sm">Terms & Conditions</Label><Textarea value={form.terms_and_conditions || ""} onChange={e => set("terms_and_conditions", e.target.value)} rows={2} placeholder="General terms and conditions..." /></div>
              <div><Label className="text-sm">Unforeseen Conditions</Label><Textarea value={form.unforeseen_conditions} onChange={e => set("unforeseen_conditions", e.target.value)} rows={2} /></div>
              <div><Label className="text-sm">Change Orders</Label><Textarea value={form.change_orders} onChange={e => set("change_orders", e.target.value)} rows={2} /></div>
              <div><Label className="text-sm">Permits & Inspections</Label><Textarea value={form.permits_inspections} onChange={e => set("permits_inspections", e.target.value)} rows={2} /></div>
              <div><Label className="text-sm">Weather Delays</Label><Textarea value={form.weather_delays} onChange={e => set("weather_delays", e.target.value)} rows={2} /></div>
              <div><Label className="text-sm">Site Access</Label><Textarea value={form.site_access} onChange={e => set("site_access", e.target.value)} rows={2} /></div>
              <div><Label className="text-sm">Exclusions</Label><Textarea value={form.exclusions || ""} onChange={e => set("exclusions", e.target.value)} rows={2} placeholder="What is NOT included..." /></div>
            </div>
           </div>
         )}

            {step === 4 && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <BidValidationPanel bid={form} onValidationComplete={setValidationData} />
              
              <GuidedPrompt message="Review your bid calculations. All numbers are editable in previous steps." variant="success" />
              
              {/* Profit Prediction */}
              {(() => {
                const similarJobs = allJobs.filter(j => 
                  j.status === 'completed' && 
                  Math.abs((j.contract_amount || 0) - calc.bidAmount) / Math.max(1, calc.bidAmount) < 0.5
                ).slice(0, 3);
                const prediction = predictJobProfit({ contract_amount: calc.bidAmount, material_costs: form.material_cost, labor_costs: calc.laborCost }, similarJobs);
                return (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Profit Prediction</p>
                    <p className="text-xs text-blue-800 mb-2">Based on {similarJobs.length} similar completed jobs</p>
                    {prediction.insights.map((insight, i) => (
                      <p key={i} className="text-xs text-blue-700 mb-1">→ {insight}</p>
                    ))}
                  </div>
                );
              })()}

              <h3 className="text-base font-bold flex items-center gap-2"><Calculator className="w-4 h-4" /> Bid Summary: {form.title}</h3>
            <div className="space-y-2 text-sm">
              {[
                ["Materials", calc.directCosts > 0 && form.material_cost],
                ["Labor (" + form.labor_hours + "h × " + formatCurrency(form.labor_rate) + ")", calc.laborCost],
                ["Subcontractors", form.subcontractor_cost],
                ["Permits", form.permit_cost],
                ["Equipment", form.equipment_cost],
              ].filter(([,v]) => v > 0).map(([l, v]) => (
                <div key={l} className="flex justify-between"><span className="text-muted-foreground">{l}</span><strong>{formatCurrency(v)}</strong></div>
              ))}
              <div className="flex justify-between border-t pt-2"><span>Direct Costs</span><strong>{formatCurrency(calc.directCosts)}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Overhead ({form.overhead_percent}%)</span><strong>{formatCurrency(calc.overhead)}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Contingency ({form.contingency_percent}%)</span><strong>{formatCurrency(calc.contingency)}</strong></div>
              <div className="flex justify-between border-t pt-2 text-base"><span className="font-semibold">Total Estimated Cost</span><strong>{formatCurrency(calc.totalEstimatedCost)}</strong></div>
              <div className="flex justify-between text-lg border-t pt-2"><span className="font-bold">Bid Amount</span><strong className="text-primary">{formatCurrency(calc.bidAmount)}</strong></div>
              <div className="flex justify-between text-green-600"><span>Gross Profit ({form.target_profit_margin}%)</span><strong>{formatCurrency(calc.grossProfit)}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Net Profit</span><strong>{formatCurrency(calc.netProfit)}</strong></div>

              <div className="mt-4 pt-4 border-t space-y-1.5 text-sm font-semibold">
                <div className="flex justify-between text-blue-900"><span>Deposit (upon acceptance):</span><span>{formatCurrency(calc.depositAmt)}</span></div>
                {calc.secondPaymentAmt > 0 && <div className="flex justify-between text-blue-900"><span>{form.start_of_construction_label || "Second Payment"}:</span><span>{formatCurrency(calc.secondPaymentAmt)}</span></div>}
                <div className="flex justify-between text-blue-900"><span>Final Payment:</span><span>{formatCurrency(calc.finalPaymentAmt)}</span></div>
                <div className="flex justify-between border-t pt-1.5 text-base text-primary"><span>Total:</span><span>{formatCurrency(calc.bidAmount)}</span></div>
              </div>
              </div>
              <BidHistoricalComparison similarJobs={bidIntelligence.similarJobs} />
              </div>
              <div className="col-span-1">
              <BidIntelligencePanel intelligence={bidIntelligence} />
              </div>
              </div>
               )}

              {step === 5 && (
              <div className="space-y-4">
              <GuidedPrompt message="Both parties must sign this contract to make it legally binding." variant="warning" />
              <BidSignatureSection bid={form} onSignaturesChange={(sigs) => {
              setForm(f => ({ ...f, ...sigs }));
              }} isLocked={false} />
              </div>
              )}

              <div className="flex justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : onClose()}>
            <ArrowLeft className="w-4 h-4 mr-1" />{step > 0 ? "Back" : "Cancel"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSave} 
              disabled={!form.title || saveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-1" />{saveMutation.isPending ? "Saving..." : bid ? "Update Bid" : "Save Bid"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}