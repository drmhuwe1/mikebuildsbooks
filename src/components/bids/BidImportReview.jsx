import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, AlertTriangle, Eye, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";

export default function BidImportReview({ data, onChange, original, fileName }) {
   const [previewOpen, setPreviewOpen] = useState(false);
   const [scopeExpanded, setScopeExpanded] = useState(false);

   const handleCostChange = (field, value) => {
     onChange({ ...data, [field]: parseFloat(value) || 0 });
   };

  const parseScopeItems = (text) => {
    if (!text) return [];
    return text
      .split(/[\n•\-*]/)
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.length < 200);
  };

  const ScopePreview = ({ text }) => {
    const items = parseScopeItems(text);
    if (items.length === 0) return <p className="text-sm text-muted-foreground italic">No items detected</p>;
    return (
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-primary font-semibold shrink-0">•</span>
            <span className="text-sm text-foreground">{item}</span>
          </div>
        ))}
      </div>
    );
  };

  const getConfidence = (field) => {
    const score = data.confidence_scores?.[field] ?? 1;
    if (score >= 0.9) return { label: "High", color: "text-green-600", bg: "bg-green-50" };
    if (score >= 0.7) return { label: "Medium", color: "text-yellow-600", bg: "bg-yellow-50" };
    return { label: "Low", color: "text-red-600", bg: "bg-red-50" };
  };

  const fieldGroup = (title, fields) => (
    <div className="space-y-3">
      <p className="font-semibold text-sm">{title}</p>
      {fields.map(([key, label, type = "text"]) => {
        const conf = getConfidence(key);
        return (
          <div key={key} className={`p-3 rounded-lg border ${conf.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold">{label}</Label>
              <Badge className={`text-xs ${conf.color}`}>{conf.label} Confidence</Badge>
            </div>
            {type === "textarea" ? (
              <Textarea
                value={data[key] || ""}
                onChange={e => onChange({ ...data, [key]: e.target.value })}
                placeholder="Not found"
                className="text-sm"
                rows={2}
              />
            ) : type === "number" ? (
               <Input
                 type="number"
                 value={data[key] || 0}
                 onChange={e => handleCostChange(key, e.target.value)}
                 step="0.01"
                 placeholder="0.00"
               />
            ) : (
              <Input
                value={data[key] || ""}
                onChange={e => onChange({ ...data, [key]: e.target.value })}
                placeholder="Not found"
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const alerts = [];
  if (!data.bid_amount || data.bid_amount === 0) alerts.push({ type: "warning", msg: "No bid amount detected. Please enter manually." });
  if (!data.client_name) alerts.push({ type: "error", msg: "Client name not found. This is required." });
  if (data.material_cost && !data.labor_hours) alerts.push({ type: "info", msg: "Materials found but labor appears incomplete." });
  if (!data.payment_schedule) alerts.push({ type: "info", msg: "Payment schedule not detected in document." });

  return (
    <Tabs defaultValue="fields" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="fields">Extracted Fields</TabsTrigger>
        <TabsTrigger value="alerts">Review Items</TabsTrigger>
      </TabsList>

      <TabsContent value="fields" className="mt-4 space-y-6">
        {fieldGroup("Client & Project", [
          ["client_name", "Client Name"],
          ["client_last_name", "Client Last Name"],
          ["project_name", "Project Name"],
          ["project_address", "Project Address"],
        ])}

        <div className="space-y-3">
          <p className="font-semibold text-sm">Project Details</p>
          {fieldGroup("Project Info", [
            ["project_description", "Project Description", "textarea"],
            ["project_address", "Project Address"],
          ])}

          <p className="font-semibold text-sm mt-4">Scope of Work</p>
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setScopeExpanded(!scopeExpanded)}
              className="w-full p-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
            >
              <div className="text-left">
                <Label className="text-xs font-semibold">Scope of Work</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {parseScopeItems(data.scope_summary).length} items detected
                </p>
              </div>
              {scopeExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            
            {scopeExpanded && (
              <div className="p-4 space-y-4 bg-white border-t">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-blue-900 mb-3">Extracted Items:</p>
                  <ScopePreview text={data.scope_summary} />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-2">Edit Raw Text:</p>
                  <Textarea
                    value={data.scope_summary || ""}
                    onChange={e => onChange({ ...data, scope_summary: e.target.value })}
                    placeholder="Enter scope items, one per line or separated by • - *"
                    className="text-sm h-32 font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Tip: Use line breaks or • - * to separate items</p>
                </div>
              </div>
            )}
          </div>

          {fieldGroup("What's Included & Excluded", [
            ["included_in_bid", "Included in This Bid", "textarea"],
            ["material_responsibility", "Material Responsibility", "textarea"],
            ["exclusions", "Exclusions (NOT Included)", "textarea"],
          ])}
        </div>

        {fieldGroup("Costs", [
          ["material_cost", "Material Costs", "number"],
          ["labor_hours", "Labor Hours", "number"],
          ["labor_rate", "Labor Rate ($/hr)", "number"],
          ["subcontractor_cost", "Subcontractor Costs", "number"],
          ["equipment_cost", "Equipment Costs", "number"],
          ["permit_cost", "Permit Costs", "number"],
        ])}

        {fieldGroup("Cost Details", [
          ["material_description", "Material Details", "textarea"],
          ["equipment_description", "Equipment & Rentals", "textarea"],
          ["subcontractor_description", "Subcontractor Work", "textarea"],
          ["permit_description", "Permits & Inspections", "textarea"],
        ])}

        {(() => {
          const laborCost = (data.labor_hours || 0) * (data.labor_rate || 0);
          const totalCosts = (data.material_cost || 0) + laborCost + (data.subcontractor_cost || 0) + (data.equipment_cost || 0) + (data.permit_cost || 0);
          const profit = (data.bid_amount || 0) - totalCosts;

          return (
            <div className="space-y-3">
              <p className="font-semibold text-sm">Bid Calculations</p>
              <div className="space-y-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Material Costs:</span>
                  <span className="font-medium">{formatCurrency(data.material_cost || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Labor Costs:</span>
                  <span className="font-medium">{formatCurrency(laborCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subcontractor Costs:</span>
                  <span className="font-medium">{formatCurrency(data.subcontractor_cost || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Equipment Costs:</span>
                  <span className="font-medium">{formatCurrency(data.equipment_cost || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Permit Costs:</span>
                  <span className="font-medium">{formatCurrency(data.permit_cost || 0)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-sm font-semibold">
                  <span>Total Costs:</span>
                  <span>{formatCurrency(totalCosts)}</span>
                </div>
              </div>

              {fieldGroup("Bid Amount", [
                ["bid_amount", "Total Bid Amount", "number"],
              ])}

              <div className={`p-3 rounded-lg border text-sm space-y-2 ${profit > 0 ? "bg-green-50 border-green-200" : profit < 0 ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}`}>
                <div className="flex justify-between font-semibold text-base">
                  <span className={profit > 0 ? "text-green-700" : profit < 0 ? "text-red-700" : "text-yellow-700"}>Profit:</span>
                  <span className={profit > 0 ? "text-green-700" : profit < 0 ? "text-red-700" : "text-yellow-700"}>{formatCurrency(profit)}</span>
                </div>
                {profit > 0 && (
                  <p className="text-xs text-green-600">Profit Margin: {((profit / (data.bid_amount || 1)) * 100).toFixed(1)}%</p>
                )}
                {profit < 0 && (
                  <p className="text-xs text-red-600">⚠ Costs exceed bid amount</p>
                )}
              </div>
            </div>
          );
        })()}

        <div className="space-y-3">
          <p className="font-semibold text-sm">Payment Schedule</p>
          <div className="space-y-3">
            {!data.payment_schedule || data.payment_schedule.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                <p className="text-xs text-amber-800">Using legacy payment fields (no custom schedule yet):</p>
                {fieldGroup("Legacy Payment Fields", [
                  ["deposit_percent", "Deposit %", "number"],
                  ["deposit_amount", "Deposit (Upon Acceptance)", "number"],
                  ["deposit_condition", "Deposit — When?", "textarea"],
                  ["start_of_construction_amount", "Start of Construction", "number"],
                  ["start_of_construction_condition", "Start of Construction — When?", "textarea"],
                  ["final_payment_amount", "Final Payment (Upon Completion)", "number"],
                  ["final_payment_condition", "Final Payment — When?", "textarea"],
                ])}
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onChange({ ...data, payment_schedule: [
                    { milestone: "Deposit", condition: data.deposit_condition || "Upon acceptance", percent: data.deposit_percent || 50, amount: 0 },
                    { milestone: "Start of Construction", condition: data.start_of_construction_condition || "Upon start", percent: 0, amount: data.start_of_construction_amount || 0 },
                    { milestone: "Final Payment", condition: data.final_payment_condition || "Upon completion", percent: 0, amount: data.final_payment_amount || 0 }
                  ] })}
                  className="w-full"
                >
                  <Plus className="w-3 h-3 mr-1" /> Switch to Custom Payment Schedule
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {data.payment_schedule.map((payment, idx) => (
                  <Card key={idx} className="p-4 space-y-3 bg-muted/30 border-l-4 border-l-primary">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-semibold block mb-1">Payment #{idx + 1} Description</Label>
                        <Input 
                          value={payment.milestone || ""} 
                          onChange={e => {
                            const updated = [...data.payment_schedule];
                            updated[idx].milestone = e.target.value;
                            onChange({ ...data, payment_schedule: updated });
                          }} 
                          placeholder="e.g., Deposit, Progress, Final" 
                          className="h-9 text-sm" 
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold block mb-1">When (Condition/Timing)</Label>
                        <Input 
                          value={payment.condition || ""} 
                          onChange={e => {
                            const updated = [...data.payment_schedule];
                            updated[idx].condition = e.target.value;
                            onChange({ ...data, payment_schedule: updated });
                          }} 
                          placeholder="e.g., Upon acceptance" 
                          className="h-9 text-sm" 
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs block mb-1">Type</Label>
                        <select 
                          value={payment.percent > 0 ? "percent" : "amount"}
                          onChange={e => {
                            const updated = [...data.payment_schedule];
                            if (e.target.value === "percent") {
                              updated[idx] = { ...payment, percent: payment.percent || 25, amount: 0 };
                            } else {
                              updated[idx] = { ...payment, amount: payment.amount || 0, percent: 0 };
                            }
                            onChange({ ...data, payment_schedule: updated });
                          }}
                          className="h-9 w-full px-2 border rounded text-xs bg-white"
                        >
                          <option value="percent">% of Total</option>
                          <option value="amount">Fixed $</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs block mb-1">Value</Label>
                        <Input 
                          type="number" 
                          value={payment.percent > 0 ? payment.percent : payment.amount} 
                          onChange={e => {
                            const updated = [...data.payment_schedule];
                            if (payment.percent > 0) {
                              updated[idx].percent = parseFloat(e.target.value) || 0;
                            } else {
                              updated[idx].amount = parseFloat(e.target.value) || 0;
                            }
                            onChange({ ...data, payment_schedule: updated });
                          }} 
                          className="h-9 text-sm" 
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive h-9" 
                          onClick={() => {
                            const updated = data.payment_schedule.filter((_, i) => i !== idx);
                            onChange({ ...data, payment_schedule: updated });
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    const updated = [...data.payment_schedule, { milestone: "", condition: "", percent: 0, amount: 0 }];
                    onChange({ ...data, payment_schedule: updated });
                  }}
                  className="w-full"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Payment
                </Button>
              </div>
            )}
          </div>
        </div>

        {fieldGroup("Timeline", [
          ["project_timeline", "Project Timeline", "textarea"],
          ["estimated_duration", "Estimated Duration"],
        ])}

        {fieldGroup("Terms & Conditions", [
          ["terms_and_conditions", "Terms & Conditions", "textarea"],
          ["unforeseen_conditions", "Unforeseen Conditions", "textarea"],
          ["change_orders", "Change Orders Policy", "textarea"],
          ["permits_inspections", "Permits & Inspections", "textarea"],
          ["weather_delays", "Weather Delays", "textarea"],
          ["site_access", "Site Access", "textarea"],
        ])}

        {fieldGroup("Additional", [
          ["notes", "Additional Notes / Disclaimers", "textarea"],
        ])}
      </TabsContent>

      <TabsContent value="alerts" className="mt-4 space-y-3">
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            <span className="text-sm text-green-700">All critical fields extracted. Ready to save.</span>
          </div>
        ) : (
          alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                alert.type === "error"
                  ? "bg-red-50 border-red-200"
                  : alert.type === "warning"
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              {alert.type === "error" ? (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              ) : alert.type === "warning" ? (
                <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
              ) : (
                <Eye className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              )}
              <span className={`text-sm ${alert.type === "error" ? "text-red-700" : alert.type === "warning" ? "text-yellow-700" : "text-blue-700"}`}>
                {alert.msg}
              </span>
            </div>
          ))
        )}

        <Card className="p-4 mt-4 bg-gray-50">
          <p className="text-xs text-muted-foreground mb-2"><strong>Source File:</strong> {fileName}</p>
          <p className="text-xs text-muted-foreground">
            Review the extracted data above. Edit any fields that need correction before saving.
          </p>
        </Card>
      </TabsContent>
    </Tabs>
  );
}