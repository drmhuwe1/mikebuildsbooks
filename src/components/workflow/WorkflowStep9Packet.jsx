import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { FileText, Download, CheckCircle, Circle } from "lucide-react";

const DEFAULT_SECTIONS = [
  { id: "cover", label: "Cover Page", included: true, required: true },
  { id: "projectInfo", label: "Project Information", included: true, required: true },
  { id: "drawings", label: "Permit Drawings (Plan & Elevation)", included: true, required: true },
  { id: "codeNotes", label: "Code-Related Notes", included: true, required: false },
  { id: "structuralNotes", label: "Structural Recommendations", included: true, required: false },
  { id: "checklist", label: "Permit Packet Checklist", included: true, required: true },
  { id: "attachments", label: "Attachments List", included: true, required: false },
  { id: "disclaimer", label: "Disclaimer & Verification Note", included: true, required: true },
];

export default function WorkflowStep9Packet({ data, company, checklist }) {
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [step, setStep] = useState(1);

  const toggleSection = (id) => {
    setSections(sections.map(s => s.id === id && !s.required ? { ...s, included: !s.included } : s));
  };

  const includedCount = sections.filter(s => s.included).length;

  return (
    <div className="space-y-4">
      <GuidedPrompt
        message="Assemble all documentation into a complete permit packet for submission."
        variant="info"
      />

      {step === 1 && (
        <>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Select Packet Sections</h3>
              <span className="text-xs text-muted-foreground">{includedCount} of {DEFAULT_SECTIONS.length}</span>
            </div>

            {sections.map((section) => (
              <div
                key={section.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <Checkbox
                  checked={section.included}
                  onCheckedChange={() => toggleSection(section.id)}
                  disabled={section.required}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{section.label}</p>
                  {section.required && (
                    <p className="text-xs text-muted-foreground">Required</p>
                  )}
                </div>
                {section.included && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                    ✓
                  </span>
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={() => setStep(2)}
            className="w-full"
          >
            Next: Review & Generate →
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-sm text-blue-900 mb-2">Your Packet Includes:</h3>
            <ul className="text-xs text-blue-800 space-y-1 ml-3">
              {sections.filter(s => s.included).map(s => (
                <li key={s.id}>✓ {s.label}</li>
              ))}
            </ul>
          </Card>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              ← Back
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              Generate Packet
            </Button>
          </div>
        </>
      )}

      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <p className="text-xs font-semibold text-yellow-900 mb-1">📋 Before Submitting</p>
        <ul className="text-xs text-yellow-800 space-y-1 ml-3">
          <li>→ Confirm all required documents with your building department</li>
          <li>→ Verify correct number of copies needed (usually 2-3)</li>
          <li>→ Check if forms need to be printed on specific paper (often required)</li>
          <li>→ Include cover letter with your contact info and project details</li>
        </ul>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-2">📮 Submission</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Most municipalities now accept submissions:
        </p>
        <div className="space-y-1 text-xs">
          <p>• <strong>In person:</strong> Building/zoning office during business hours</p>
          <p>• <strong>By mail:</strong> Check address on building department website</p>
          <p>• <strong>Online portal:</strong> Many cities have digital submission systems</p>
          <p>• <strong>By email:</strong> Some accept PDF submissions (verify first)</p>
        </div>
      </Card>
    </div>
  );
}