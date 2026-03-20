import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle, Search } from "lucide-react";
import GuidedPrompt from "@/components/shared/GuidedPrompt";

export default function MunicipalityCodeCheck({ data, onChange, projectTypeLabel }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(data.codeCheckResult || null);

  const runCheck = async () => {
    if (!data.projectAddress) return;
    setLoading(true);

    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt: `For a ${projectTypeLabel} permit at: ${data.projectAddress}, ${data.projectZipCode || ""} ${data.projectState || ""}
Municipality detected: ${data.municipality || "unknown"}

Return JSON with permit requirements specific to this project type and location. Be specific about common local code requirements.`,
      response_json_schema: {
        type: "object",
        properties: {
          municipality: { type: "string" },
          county: { type: "string" },
          permitRequired: { type: "boolean" },
          estimatedFeeRange: { type: "string" },
          typicalRequirements: { type: "array", items: { type: "string" } },
          commonFlags: { type: "array", items: { type: "string" } },
          inspectionStages: { type: "array", items: { type: "string" } },
          notes: { type: "string" },
        },
      },
    });

    setLoading(false);
    if (aiResult) {
      setResult(aiResult);
      onChange("codeCheckResult", aiResult);
      if (aiResult.municipality) onChange("municipality", aiResult.municipality);
    }
  };

  return (
    <div className="space-y-4">
      <GuidedPrompt message={`AI will identify your municipality and flag common ${projectTypeLabel.toLowerCase()} permit requirements for your location.`} variant="info" />

      {!data.projectAddress && (
        <Card className="p-3 bg-yellow-50 border-yellow-200 text-xs text-yellow-800">
          No address was entered in Step 1. Go back and add a project address to enable AI municipality lookup.
        </Card>
      )}

      {data.projectAddress && !result && (
        <Button onClick={runCheck} disabled={loading} className="w-full gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? "Checking local requirements..." : `Check ${projectTypeLabel} Permit Requirements`}
        </Button>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground text-center">Analyzing municipality codes for {data.projectAddress}…</p>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{result.municipality || data.municipality}</p>
              {result.county && <p className="text-xs text-muted-foreground">{result.county} County</p>}
            </div>
            <div className="flex items-center gap-2">
              {result.permitRequired === false ? (
                <Badge className="bg-green-100 text-green-700">Permit May Not Be Required</Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-700">Permit Likely Required</Badge>
              )}
              <Button variant="ghost" size="sm" onClick={runCheck} disabled={loading}>Re-check</Button>
            </div>
          </div>

          {result.estimatedFeeRange && (
            <Card className="p-3 bg-muted/40 text-sm">
              <span className="text-muted-foreground">Estimated permit fee range: </span>
              <strong>{result.estimatedFeeRange}</strong>
            </Card>
          )}

          {result.typicalRequirements?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Typical Requirements</p>
              <div className="space-y-1.5">
                {result.typicalRequirements.map((req, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.commonFlags?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Common Issues to Watch</p>
              <div className="space-y-1.5">
                {result.commonFlags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                    <span className="text-yellow-900">{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.inspectionStages?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Inspection Stages</p>
              <div className="flex flex-wrap gap-2">
                {result.inspectionStages.map((stage, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{stage}</Badge>
                ))}
              </div>
            </div>
          )}

          {result.notes && (
            <Card className="p-3 bg-blue-50 border-blue-200 text-xs text-blue-800">{result.notes}</Card>
          )}
        </div>
      )}
    </div>
  );
}