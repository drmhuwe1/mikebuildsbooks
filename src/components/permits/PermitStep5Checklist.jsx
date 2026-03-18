import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { AlertTriangle } from "lucide-react";

export default function PermitStep5Checklist({ data, onChange }) {
  const checklist = [
    { key: "dimensions", label: "Dimensions shown on drawings" },
    { key: "footings", label: "Footing locations marked" },
    { key: "stairs", label: "Stair details included" },
    { key: "railings", label: "Railing specifications noted" },
    { key: "roofPitch", label: "Roof pitch clearly marked" },
    { key: "support", label: "Support structure notes provided" },
    { key: "attachment", label: "Attachment to house details" },
  ];

  const missingItems = checklist.filter(item => !data.checklist[item.key]);

  return (
    <div className="space-y-4">
      <GuidedPrompt message="Verify that all required permit documentation elements are included." variant="info" />

      <div className="space-y-3">
        {checklist.map(item => (
          <div key={item.key} className="flex items-center gap-3 p-3 border rounded-lg">
            <Checkbox
              checked={data.checklist[item.key] || false}
              onCheckedChange={(checked) => onChange("checklist", { ...data.checklist, [item.key]: checked })}
            />
            <Label className="cursor-pointer flex-1 m-0">{item.label}</Label>
          </div>
        ))}
      </div>

      {missingItems.length > 0 && (
        <Card className="p-3 border-yellow-200 bg-yellow-50">
          <div className="flex gap-2 items-start">
            <AlertTriangle className="w-4 h-4 text-yellow-700 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-900">
              <p className="font-semibold mb-1">Missing permit elements:</p>
              <ul className="text-xs space-y-1">
                {missingItems.map(item => (
                  <li key={item.key}>• {item.label}</li>
                ))}
              </ul>
              <p className="text-xs mt-2 italic">You can still proceed, but ensure these details are added to drawings before submission.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}