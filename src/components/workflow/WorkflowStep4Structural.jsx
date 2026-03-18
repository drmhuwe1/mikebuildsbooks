import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

export default function WorkflowStep4Structural({ data, guidance }) {
  if (!guidance || guidance.length === 0) {
    return (
      <div className="space-y-4">
        <GuidedPrompt
          message="Structural guidance will appear here based on your design measurements."
          variant="info"
        />
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Enter deck or roof details in the previous step to see structural recommendations.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GuidedPrompt
        message="Review structural recommendations for your design. These are guidance only—engineering may be required for final approval."
        variant="info"
      />

      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-yellow-900 mb-1">Important Disclaimer</p>
            <p className="text-xs text-yellow-800">
              Structural recommendations are based on standard residential design guidance and may not replace professional engineering review. Always verify with local building department and engage a structural engineer for large or complex designs.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {guidance.map((rec, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-sm">{rec.category}</h3>
              <Badge variant="outline">{rec.current || "User input"}</Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Recommended:</p>
                <p className="font-medium">{rec.recommended}</p>
              </div>

              {rec.note && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground flex items-start gap-2">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>{rec.note}</span>
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-xs font-semibold text-blue-900 mb-2">📋 What's Next</p>
        <ul className="text-xs text-blue-800 space-y-1 ml-3">
          <li>→ Review code-based guidance for your specific design</li>
          <li>→ Identify permit and inspection requirements</li>
          <li>→ Get fee estimates for your location</li>
        </ul>
      </Card>
    </div>
  );
}