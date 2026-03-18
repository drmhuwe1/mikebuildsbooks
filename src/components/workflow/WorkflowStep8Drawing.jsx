import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { FileText, Download, Edit2 } from "lucide-react";

export default function WorkflowStep8Drawing({ data, company }) {
  return (
    <div className="space-y-4">
      <GuidedPrompt
        message="Generate permit-ready drawings with all code and structural notes built in. You can edit the drawing visually or adjust dimensions."
        variant="info"
      />

      <div className="grid grid-cols-2 gap-3">
        <Button className="h-20 flex flex-col items-center justify-center gap-2">
          <FileText className="w-5 h-5" />
          <span className="text-sm">Generate Drawings</span>
        </Button>
        <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
          <Edit2 className="w-5 h-5" />
          <span className="text-sm">Edit Drawing</span>
        </Button>
      </div>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-sm text-blue-900 mb-2">Drawing Contents</h3>
        <ul className="text-xs text-blue-800 space-y-1 ml-3">
          <li>✓ Top-view plan with dimensions</li>
          <li>✓ Side-elevation view</li>
          <li>✓ Code-related notes</li>
          <li>✓ Structural recommendations</li>
          <li>✓ Detail callouts (if applicable)</li>
          <li>✓ Company branding and contact info</li>
        </ul>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-2">🖨️ Output Options</h3>
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            <Download className="w-4 h-4 mr-2" />
            Export as PDF
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Download className="w-4 h-4 mr-2" />
            Print to Printer
          </Button>
        </div>
      </Card>

      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <p className="text-xs font-semibold text-yellow-900 mb-1">📝 Important Note</p>
        <p className="text-xs text-yellow-800">
          These drawings are permit-support documents for submission assistance. Your building department may require additional stamped engineering drawings or site plans. Check with them before submitting.
        </p>
      </Card>
    </div>
  );
}