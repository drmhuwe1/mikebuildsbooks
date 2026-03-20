import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import GuidedPrompt from "@/components/shared/GuidedPrompt";

const FENCE_INFO = {
  wood_privacy: { label: "Wood Privacy", notes: "Most common residential fence. Many municipalities limit height to 6 ft in rear yard, 4 ft in front yard." },
  chain_link: { label: "Chain Link", notes: "Often used for security/boundary fencing. Typically exempt from HOA rules if not visible from street." },
  vinyl: { label: "Vinyl / PVC", notes: "Low maintenance. Permit requirements similar to wood privacy." },
  wrought_iron: { label: "Wrought Iron / Aluminum Ornamental", notes: "Often requires HOA approval in upscale neighborhoods." },
  split_rail: { label: "Split Rail", notes: "Decorative only. Often exempt from permit in many jurisdictions due to open design." },
  composite: { label: "Composite / Wood-Plastic", notes: "Similar requirements to wood privacy." },
};

export default function FenceType({ data, onChange }) {
  const info = FENCE_INFO[data.fenceType] || {};
  return (
    <div className="space-y-4">
      <GuidedPrompt message="Select the fence material type. This affects permit requirements and HOA approval processes." variant="info" />
      <div>
        <Label>Fence Type / Material</Label>
        <Select value={data.fenceType || "wood_privacy"} onValueChange={v => onChange("fenceType", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(FENCE_INFO).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {info.notes && (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <p className="text-xs font-semibold text-blue-800">{info.label}</p>
          <p className="text-xs text-blue-700 mt-1">{info.notes}</p>
        </Card>
      )}
    </div>
  );
}