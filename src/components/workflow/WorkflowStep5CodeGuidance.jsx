import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { AlertTriangle, Info, CheckCircle } from "lucide-react";

export default function WorkflowStep5CodeGuidance({ data, guidance, warnings }) {
  const codeWarnings = warnings.filter(w => w.type === "code");
  const codeInfo = guidance.filter(g => g.type === "info");

  return (
    <div className="space-y-4">
      <GuidedPrompt
        message="Review code-related guidance for your design. This is based on standard residential building codes and may not reflect all local variations."
        variant="info"
      />

      {/* Critical warnings */}
      {codeWarnings.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-900 mb-2">⚠️ Code Violations or Concerns</p>
              <ul className="space-y-2">
                {codeWarnings.map((w, i) => (
                  <li key={i} className="text-sm text-red-800">
                    <strong>{w.category}:</strong> {w.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Informational guidance */}
      {codeInfo.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Code-Based Guidance</h3>
          {codeInfo.map((item, i) => (
            <Card key={i} className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">{item.category}</p>
                  <p className="text-sm text-blue-800">{item.message}</p>
                  {item.actionRequired && (
                    <Badge className="mt-2 bg-blue-600">Action Required</Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Deck-specific code checks */}
      {data.projectType === "Deck" && (
        <Card className="p-4 bg-green-50 border-green-200">
          <h3 className="font-semibold text-sm text-green-900 mb-3">✓ Deck Design Notes</h3>
          <ul className="text-xs text-green-800 space-y-2 ml-3">
            {data.deckHeight >= 3 && (
              <li>→ Guardrails required for decks over 30 inches. Plan for 4x4 posts and balusters (4" sphere rule)</li>
            )}
            {data.isDeckAttached && (
              <li>→ Ledger board connection is critical. Flash properly to prevent water intrusion. Consider a dedicated connection detail.</li>
            )}
            {data.numStairs > 0 && (
              <li>→ Stair risers, treads, and handrail heights are code-controlled. Verify exact rise/run dimensions.</li>
            )}
            {data.footingCount && (
              <li>→ Footing depth varies by climate. Check frost line depth in your area (typically 36-48" in cold regions).</li>
            )}
          </ul>
        </Card>
      )}

      {/* Roof-specific code checks */}
      {["Porch Roof", "Roof Over Existing Deck"].includes(data.projectType) && (
        <Card className="p-4 bg-green-50 border-green-200">
          <h3 className="font-semibold text-sm text-green-900 mb-3">✓ Roof Design Notes</h3>
          <ul className="text-xs text-green-800 space-y-2 ml-3">
            {data.tiedToExisting && (
              <li>→ Connection to existing structure is critical. Plan for proper tie-in details at the rim joist or existing roof line.</li>
            )}
            <li>→ Roof pitch, material, and support structure must be compatible. Low slopes may require additional drainage planning.</li>
            <li>→ Overhang and support posts must be properly sized and spaced for the roof load and local snow/wind conditions.</li>
            {data.roofingMaterial && (
              <li>→ Material selection ({data.roofingMaterial}) has specific installation requirements. Plan for flashing and edge details.</li>
            )}
          </ul>
        </Card>
      )}

      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <p className="text-xs font-semibold text-yellow-900 mb-1">⚠️ Always Verify Locally</p>
        <p className="text-xs text-yellow-800">
          Code requirements vary by jurisdiction. These guidelines are based on standard residential codes but may not reflect your specific local amendments, amendments for snow loads, wind speeds, seismic zones, or other regional variations. Always confirm final requirements with your local building department.
        </p>
      </Card>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-xs font-semibold text-blue-900 mb-2">📋 Next Steps</p>
        <ul className="text-xs text-blue-800 space-y-1 ml-3">
          <li>→ Review permit and inspection requirements for your location</li>
          <li>→ Get estimated permit fees</li>
          <li>→ Generate drawings with code notes built in</li>
        </ul>
      </Card>
    </div>
  );
}