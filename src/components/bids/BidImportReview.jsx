import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, AlertTriangle, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/formatters";

export default function BidImportReview({ data, onChange, original, fileName }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [scopeExpanded, setScopeExpanded] = useState(false);

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
                onChange={e => onChange({ ...data, [key]: parseFloat(e.target.value) || 0 })}
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

        {fieldGroup("Bid Calculations", [
          ["contingency_percent", "Contingency %", "number"],
          ["overhead_percent", "Overhead %", "number"],
          ["total_estimated_cost", "Total Estimated Cost", "number"],
          ["bid_amount", "Total Bid Amount", "number"],
        ])}

        {fieldGroup("Payment Milestones", [
          ["deposit_percent", "Deposit %", "number"],
          ["deposit_amount", "Deposit (Upon Acceptance)", "number"],
          ["start_of_construction_amount", "Start of Construction", "number"],
          ["final_payment_amount", "Final Payment (Upon Completion)", "number"],
        ])}

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