import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Download, ChevronDown, ChevronUp } from "lucide-react";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { generatePermitPacketPDF } from "@/lib/permitPacketGenerator";

const DEFAULT_SECTIONS = [
  { id: "cover", label: "Cover Page", included: true, required: true },
  { id: "projectInfo", label: "Project Information", included: true, required: true },
  { id: "drawings", label: "Permit Drawings (Top View & Elevation)", included: true, required: true },
  { id: "dimensions", label: "Dimension Details", included: true, required: false },
  { id: "materials", label: "Materials & Framing Notes", included: true, required: false },
  { id: "footings", label: "Footing & Support Details", included: true, required: false },
  { id: "stairs", label: "Stair & Railing Notes", included: true, required: false },
  { id: "roof", label: "Roof Specifications (if applicable)", included: true, required: false },
  { id: "checklist", label: "Permit Packet Checklist", included: true, required: true },
  { id: "signature", label: "Signature Page", included: true, required: false },
  { id: "attachments", label: "Attachments List", included: true, required: false },
];

export default function PermitPacketBuilder({ data, company, onClose }) {
  const [step, setStep] = useState(1); // 1=Sections, 2=Review, 3=Generating
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [generating, setGenerating] = useState(false);

  const TOTAL_STEPS = 2;

  const toggleSection = (id) => {
    setSections(sections.map(s => s.id === id && !s.required ? { ...s, included: !s.included } : s));
  };

  const includedCount = sections.filter(s => s.included).length;
  const totalSections = DEFAULT_SECTIONS.length;

  const handleGeneratePacket = async () => {
    setStep(3);
    setGenerating(true);
    try {
      const includedSectionIds = sections.filter(s => s.included).map(s => s.id);
      const html = generatePermitPacketPDF(data, company || {}, includedSectionIds);
      
      const printWindow = window.open('', '', 'width=1200,height=800');
      printWindow.document.write(html);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
          onClose();
        }, 500);
      }, 1000);
    } catch (error) {
      console.error('Packet generation error:', error);
      alert('Error generating permit packet');
      setStep(2);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-auto">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-semibold text-lg">Permit Packet Builder</h3>
            <p className="text-xs text-muted-foreground">Step {step} of {TOTAL_STEPS} — {data.projectAddress}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} disabled={generating} aria-label="Close permit packet builder">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {step === 1 && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-900 mb-1">STEP 1: SELECT PACKET SECTIONS</p>
                <p className="text-xs text-blue-800">Choose which sections to include in your permit packet. Required sections are always included and cannot be removed.</p>
              </div>

              <Card className="p-3 bg-yellow-50 border-yellow-200">
                <p className="text-xs text-yellow-900">
                  <strong>Important:</strong> This packet assembles permit-support documentation from your project inputs. Additional municipality-specific forms, engineering review, or stamped drawings may be required. You will have a chance to review your selections before generating.
                </p>
              </Card>

              {/* Sections List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold">Packet Sections</p>
                  <span className="text-xs text-muted-foreground">{includedCount} of {totalSections}</span>
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
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{section.label}</p>
                      {section.required && (
                        <p className="text-xs text-muted-foreground">Required</p>
                      )}
                    </div>
                    {section.included && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                        Included
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-900 mb-1">STEP 2: REVIEW PACKET CONTENTS</p>
                <p className="text-xs text-amber-800">Please verify the sections below before we generate and print your permit packet.</p>
              </div>

              <Card className="p-3 bg-muted/40 border">
                <p className="text-sm font-semibold mb-3">Your Packet Contains:</p>
                <ul className="text-xs text-muted-foreground space-y-2">
                  {sections.filter(s => s.included).map(s => (
                    <li key={s.id} className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{s.label}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-3 bg-blue-50 border-blue-200">
                <p className="text-xs text-blue-900">
                  <strong>Next:</strong> Click "Generate & Print" to create your permit packet PDF. Your browser's print dialog will open automatically.
                </p>
              </Card>
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <p className="text-sm text-muted-foreground">Generating permit packet...</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-2 justify-between shrink-0">
          <Button variant="outline" onClick={onClose} disabled={generating}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {step === 2 && (
              <Button variant="outline" onClick={() => setStep(1)} disabled={generating}>
                ← Back
              </Button>
            )}
            {step === 1 && (
              <Button onClick={() => setStep(2)} disabled={generating}>
                Next →
              </Button>
            )}
            {step === 2 && (
              <Button onClick={handleGeneratePacket} disabled={generating}>
                <Download className="w-4 h-4 mr-2" />
                {generating ? "Generating..." : "Generate & Print"}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}