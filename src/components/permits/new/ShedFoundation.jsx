import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import GuidedPrompt from "@/components/shared/GuidedPrompt";

const OPTIONS = {
  concrete_pad: { label: "Concrete Pad", notes: "Most durable. Requires forming and curing time. Usually required for permanent structures." },
  gravel: { label: "Gravel Base", notes: "Lower cost. Good drainage. Common for storage sheds." },
  skids: { label: "Pressure-Treated Skids", notes: "Simplest option. Typically used for prefab sheds. Often considered 'temporary' — may not require permit in many areas." },
  deck_blocks: { label: "Deck Blocks / Piers", notes: "Simple installation. Keeps shed off ground for ventilation." },
};

export default function ShedFoundation({ data, onChange }) {
  const info = OPTIONS[data.shedFoundation] || {};
  return (
    <div className="space-y-4">
      <GuidedPrompt message="Foundation type determines whether the shed is considered permanent or temporary, which affects permit requirements." variant="info" />
      <div>
        <Label>Foundation Type</Label>
        <Select value={data.shedFoundation || "concrete_pad"} onValueChange={v => onChange("shedFoundation", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(OPTIONS).map(([key, { label }]) => (
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