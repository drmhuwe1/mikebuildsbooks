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

        {fieldGroup("Scope", [
          ["job_description", "Job Description", "textarea"],
          ["scope_summary", "Scope of Work", "textarea"],
        ])}

        {fieldGroup("Costs", [
          ["material_cost", "Material Costs", "number"],
          ["labor_hours", "Labor Hours", "number"],
          ["labor_rate", "Labor Rate ($/hr)", "number"],
          ["subcontractor_cost", "Subcontractor Costs", "number"],
          ["equipment_cost", "Equipment Costs", "number"],
          ["permit_cost", "Permit Costs", "number"],
        ])}

        {fieldGroup("Bid Details", [
          ["contingency_percent", "Contingency %", "number"],
          ["overhead_percent", "Overhead %", "number"],
          ["total_estimated_cost", "Total Estimated Cost", "number"],
          ["bid_amount", "Total Bid Amount", "number"],
        ])}

        {fieldGroup("Terms", [
          ["payment_schedule", "Payment Schedule", "textarea"],
          ["exclusions", "Exclusions/Notes", "textarea"],
          ["estimated_duration", "Estimated Duration"],
        ])}

        {fieldGroup("Additional", [
          ["notes", "Additional Notes", "textarea"],
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