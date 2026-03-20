import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, RefreshCw, CheckCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";

const CATEGORY_COLORS = {
  materials: "bg-blue-50 border-blue-200 text-blue-700",
  labor: "bg-green-50 border-green-200 text-green-700",
  subcontractor: "bg-purple-50 border-purple-200 text-purple-700",
  permit: "bg-orange-50 border-orange-200 text-orange-700",
  equipment: "bg-yellow-50 border-yellow-200 text-yellow-700",
  overhead: "bg-gray-50 border-gray-200 text-gray-700",
  contingency: "bg-red-50 border-red-200 text-red-700",
};

export default function QuickGenerateTab({ settings, onLineItemsGenerated, onAIDataGenerated }) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const s = settings || {};
      const contextPrompt = `Company defaults: overhead=${s.default_overhead_percent ?? 10}%, contingency=${s.default_contingency_percent ?? 5}%, profit margin=${s.default_profit_margin ?? 20}%, labor rate=$${s.default_labor_rate ?? 45}/hr.

Project description: ${description}

Return ONLY valid JSON (no markdown, no extra text):
{
  "projectType": "string",
  "projectDescription": "string",
  "estimatedSqFt": null,
  "location": "string",
  "lineItems": [
    { "category": "materials|labor|subcontractor|permit|equipment|overhead|contingency", "description": "string", "estimatedCost": 0 }
  ],
  "riskFlags": ["string"],
  "permitRequired": true,
  "estimatedDuration": "string"
}`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: contextPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            projectType: { type: "string" },
            projectDescription: { type: "string" },
            estimatedSqFt: { type: "number" },
            location: { type: "string" },
            lineItems: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  description: { type: "string" },
                  estimatedCost: { type: "number" },
                }
              }
            },
            riskFlags: { type: "array", items: { type: "string" } },
            permitRequired: { type: "boolean" },
            estimatedDuration: { type: "string" },
          }
        }
      });

      const data = res;
      if (!data || !data.lineItems) {
        setError("We couldn't fully parse your description. Try adding square footage, location, or material preferences.");
        return;
      }
      setResult(data);
    } catch (e) {
      setError("We couldn't fully parse your description. Try adding square footage, location, or material preferences.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAll = () => {
    if (!result) return;
    onLineItemsGenerated(result.lineItems);
    onAIDataGenerated && onAIDataGenerated(result);
  };

  const totalEstimate = result?.lineItems?.reduce((s, i) => s + (i.estimatedCost || 0), 0) || 0;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Describe this project in plain English</label>
        <Textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={4}
          placeholder="e.g. Replace roof on a 2,400 sq ft colonial, asphalt shingles, 2-story, Pittsburgh PA, homeowner wants 30-year warranty"
          className="resize-none text-sm"
        />
        <Button
          onClick={handleGenerate}
          disabled={loading || !description.trim()}
          className="w-full gap-2 bg-primary"
        >
          {loading ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Generating Line Items...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Generate Line Items</>
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* AI Context Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 grid grid-cols-2 gap-2 text-xs text-blue-800">
            <div><span className="font-semibold">Type:</span> {result.projectType}</div>
            <div><span className="font-semibold">Location:</span> {result.location || "—"}</div>
            <div><span className="font-semibold">Duration:</span> {result.estimatedDuration || "—"}</div>
            <div><span className="font-semibold">Permit Required:</span> {result.permitRequired ? "Yes" : "No"}</div>
            {result.estimatedSqFt && <div><span className="font-semibold">Sq Ft:</span> {result.estimatedSqFt}</div>}
          </div>

          {/* Risk Flags */}
          {result.riskFlags?.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-orange-800 mb-1.5">⚠ Risk Flags</p>
              <ul className="space-y-1">
                {result.riskFlags.map((f, i) => (
                  <li key={i} className="text-xs text-orange-700">• {f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Line Items Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Generated Line Items</p>
              <span className="text-xs text-muted-foreground">{result.lineItems.length} items · Est. {formatCurrency(totalEstimate)}</span>
            </div>
            {result.lineItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 border rounded-lg bg-card gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge className={`text-xs shrink-0 ${CATEGORY_COLORS[item.category] || "bg-muted text-muted-foreground"}`}>
                    {item.category}
                  </Badge>
                  <span className="text-sm truncate">{item.description}</span>
                </div>
                <span className="text-sm font-semibold shrink-0">{formatCurrency(item.estimatedCost)}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={handleGenerate} className="flex-1 gap-2">
              <RefreshCw className="w-4 h-4" /> Regenerate
            </Button>
            <Button onClick={handleAcceptAll} className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
              <CheckCheck className="w-4 h-4" /> Accept All & Build Bid
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}