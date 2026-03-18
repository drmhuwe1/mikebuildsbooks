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
            <p className="text-xs text-muted-foreground">{data.projectAddress}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <GuidedPrompt
            message="Select which sections to include in your permit packet. Required sections are always included."
            variant="info"
          />

          <Card className="p-3 bg-blue-50 border-blue-200">
            <p className="text-xs text-blue-900">
              <strong>Permit-Support Documentation:</strong> This packet assembles basic permit-support documentation from your project inputs. Additional municipality-specific forms, engineering review, or stamped drawings may be required. Always verify with your local building department before submission.
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

          {/* Summary */}
          <Card className="p-3 bg-muted/40 border">
            <p className="text-sm">
              <strong>Packet includes:</strong>
            </p>
            <ul className="text-xs text-muted-foreground mt-2 ml-2 space-y-1">
              {sections.filter(s => s.included).map(s => (
                <li key={s.id}>• {s.label}</li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-2 justify-end shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleGeneratePacket} disabled={generating}>
            <Download className="w-4 h-4 mr-2" />
            {generating ? "Generating Packet..." : "Generate & Print Packet"}
          </Button>
        </div>
      </Card>
    </div>
  );
}