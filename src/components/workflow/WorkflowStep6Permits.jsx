import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { CheckCircle, Circle, FileText, CheckSquare } from "lucide-react";

export default function WorkflowStep6Permits({ data, checklist }) {
  const [expandedSection, setExpandedSection] = useState("documentation");

  if (!checklist) {
    return (
      <div className="space-y-4">
        <GuidedPrompt message="Permit requirements will appear here." variant="info" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GuidedPrompt
        message="Review likely documentation and inspection requirements for your project. These are based on project type and design—always confirm with your local building department."
        variant="info"
      />

      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <FileText className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-900 mb-1">📋 Location: {data.municipality || "Not specified"}</p>
            <p className="text-xs text-amber-800">
              Permit requirements vary by municipality. This list is based on your project type—confirm all requirements with {data.municipality || "your local"} building department before applying.
            </p>
          </div>
        </div>
      </Card>

      {/* Documentation requirements */}
      <div className="space-y-3">
        <button
          onClick={() => setExpandedSection(expandedSection === "documentation" ? null : "documentation")}
          className="w-full flex items-center justify-between p-4 rounded-lg border bg-muted hover:bg-muted/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4" />
            <h3 className="font-semibold text-sm">Required Documentation</h3>
          </div>
          {expandedSection === "documentation" ? "▼" : "▶"}
        </button>

        {expandedSection === "documentation" && (
          <div className="space-y-2 ml-4">
            {checklist.documentation.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                {item.required ? (
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                  {item.required && (
                    <p className="text-xs text-muted-foreground">Required</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inspection requirements */}
      <div className="space-y-3">
        <button
          onClick={() => setExpandedSection(expandedSection === "inspections" ? null : "inspections")}
          className="w-full flex items-center justify-between p-4 rounded-lg border bg-muted hover:bg-muted/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <CheckSquare className="w-4 h-4" />
            <h3 className="font-semibold text-sm">Required Inspections</h3>
          </div>
          {expandedSection === "inspections" ? "▼" : "▶"}
        </button>

        {expandedSection === "inspections" && (
          <div className="space-y-2 ml-4">
            {checklist.inspections.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">Required</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm">What Comes Next</h3>
        <ul className="text-xs text-muted-foreground space-y-1 ml-3">
          <li>→ <strong>Permit Fees (Step 7):</strong> See estimated cost for permits and inspections</li>
          <li>→ <strong>Drawing Generation (Step 8):</strong> Create permit-ready drawings with code notes</li>
          <li>→ <strong>Permit Packet (Step 9):</strong> Assemble all documentation for submission</li>
          <li>→ <strong>Bid Integration (Step 10):</strong> Add permit costs to your project bid</li>
        </ul>
      </Card>

      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <p className="text-xs font-semibold text-yellow-900 mb-1">⚠️ Confirm Before Applying</p>
        <p className="text-xs text-yellow-800">
          Contact your local building/zoning office at least 2-3 weeks before you plan to submit. Requirements can change, and you want to confirm what's needed for your specific location and project scope.
        </p>
      </Card>
    </div>
  );
}