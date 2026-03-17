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

const STEPS = ["Basics", "Costs", "Margins", "Review"];

export default function BidWizard({ bid, onClose }) {
  const qc = useQueryClient();
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list("-created_date", 200) });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });

  const s = settings[0] || {};
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: bid?.title || "",
    client_id: bid?.client_id || "",
    client_name: bid?.client_name || "",
    status: bid?.status || "draft",
    scope_summary: bid?.scope_summary || "",
    material_cost: bid?.material_cost || 0,
    labor_hours: bid?.labor_hours || 0,
    labor_rate: bid?.labor_rate || s.default_labor_rate || 45,
    subcontractor_cost: bid?.subcontractor_cost || 0,
    permit_cost: bid?.permit_cost || 0,
    equipment_cost: bid?.equipment_cost || 0,
    overhead_percent: bid?.overhead_percent ?? s.default_overhead_percent ?? 10,
    contingency_percent: bid?.contingency_percent ?? s.default_contingency_percent ?? 5,
    target_profit_margin: bid?.target_profit_margin ?? s.default_profit_margin ?? 20,
    notes: bid?.notes || "",
    valid_until: bid?.valid_until || "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setNum = (k, v) => setForm(f => ({ ...f, [k]: parseFloat(v) || 0 }));

  const calc = useMemo(() => {
    const laborCost = form.labor_hours * form.labor_rate;
    const directCosts = form.material_cost + laborCost + form.subcontractor_cost + form.permit_cost + form.equipment_cost;
    const overhead = directCosts * (form.overhead_percent / 100);
    const subtotal = directCosts + overhead;
    const contingency = subtotal * (form.contingency_percent / 100);
    const totalEstimatedCost = subtotal + contingency;
    const bidAmount = totalEstimatedCost / (1 - form.target_profit_margin / 100);
    const grossProfit = bidAmount - totalEstimatedCost;
    const netProfit = grossProfit - overhead;
    return { laborCost, directCosts, overhead, subtotal, contingency, totalEstimatedCost, bidAmount, grossProfit, netProfit };
  }, [form]);

  const saveMutation = useMutation({
    mutationFn: (data) => bid?.id ? base44.entities.Bid.update(bid.id, data) : base44.entities.Bid.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bids"] }); onClose(); },
  });

  const handleSave = () => {
    saveMutation.mutate({
      ...form,
      total_estimated_cost: Math.round(calc.totalEstimatedCost * 100) / 100,
      bid_amount: Math.round(calc.bidAmount * 100) / 100,
      gross_profit: Math.round(calc.grossProfit * 100) / 100,
      net_profit: Math.round(calc.netProfit * 100) / 100,
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
          <React.Fragment key={s}>
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
            <div><Label>Scope Summary</Label><Textarea value={form.scope_summary} onChange={e => set("scope_summary", e.target.value)} rows={3} placeholder="Describe the work..." /></div>
            <div><Label>Valid Until</Label><Input type="date" value={form.valid_until} onChange={e => set("valid_until", e.target.value)} /></div>
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
              <div><Label>Permit Cost ($)</Label><Input type="number" value={form.permit_cost} onChange={e => setNum("permit_cost", e.target.value)} /></div>
              <div><Label>Equipment Rental ($)</Label><Input type="number" value={form.equipment_cost} onChange={e => setNum("equipment_cost", e.target.value)} /></div>
            </div>
            <div className="p-3 rounded-lg bg-muted flex items-center justify-between">
              <span className="text-sm font-medium">Direct Costs Total:</span>
              <span className="text-base font-bold">{formatCurrency(calc.directCosts)}</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <GuidedPrompt message="Set your overhead, contingency, and profit margin percentages." variant="info" />
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Overhead %</Label><Input type="number" value={form.overhead_percent} onChange={e => setNum("overhead_percent", e.target.value)} /></div>
              <div><Label>Contingency %</Label><Input type="number" value={form.contingency_percent} onChange={e => setNum("contingency_percent", e.target.value)} /></div>
              <div><Label>Target Profit Margin %</Label><Input type="number" value={form.target_profit_margin} onChange={e => setNum("target_profit_margin", e.target.value)} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} /></div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <GuidedPrompt message="Review your bid calculations. All numbers are editable in previous steps." variant="success" />
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
            </div>
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
            <Button onClick={handleSave} disabled={!form.title || saveMutation.isPending}>
              <Check className="w-4 h-4 mr-1" />{saveMutation.isPending ? "Saving..." : "Save Bid"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}