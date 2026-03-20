import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import GuidedPrompt from "@/components/shared/GuidedPrompt";

export default function AdditionMEP({ data, onChange }) {
  const hasAny = data.newHVAC || data.newElectrical || data.newPlumbing;
  return (
    <div className="space-y-4">
      <GuidedPrompt message="Check all mechanical, electrical, and plumbing systems that will be included in this addition. Each may require a separate sub-permit." variant="info" />
      <div className="space-y-3">
        {[
          { key: "newHVAC", label: "New HVAC / Mechanical", note: "Requires mechanical permit and duct layout drawings" },
          { key: "newElectrical", label: "New Electrical (panel or rough-in)", note: "Requires electrical permit and load calculation" },
          { key: "newPlumbing", label: "New Plumbing Rough-in", note: "Requires plumbing permit; may trigger DWV inspection" },
        ].map(item => (
          <div key={item.key} className="flex items-start justify-between gap-4 p-3 border rounded-lg">
            <div>
              <Label className="font-medium">{item.label}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{item.note}</p>
            </div>
            <Switch checked={!!data[item.key]} onCheckedChange={v => onChange(item.key, v)} />
          </div>
        ))}
      </div>
      {hasAny && (
        <Card className="p-3 bg-yellow-50 border-yellow-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-800">One or more sub-permits will likely be required in addition to the building permit. Confirm with your local building department.</p>
        </Card>
      )}
    </div>
  );
}