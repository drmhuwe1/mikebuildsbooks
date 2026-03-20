import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import GuidedPrompt from "@/components/shared/GuidedPrompt";

const FOUNDATION_INFO = {
  slab: { label: "Concrete Slab", notes: "Most common for additions. Requires footings below frost line." },
  crawl_space: { label: "Crawl Space", notes: "Allows access to plumbing/electrical. Requires ventilation per code." },
  basement: { label: "Full Basement", notes: "Adds significant cost. May require engineered plans and waterproofing." },
  concrete_pad: { label: "Concrete Pad", notes: "Suitable for lightweight structures." },
  gravel: { label: "Gravel Base", notes: "Often used for sheds. May not require a permit depending on municipality." },
  skids: { label: "Skid / Timber Base", notes: "Common for prefab sheds. Considered temporary in many jurisdictions." },
};

export default function AdditionFoundation({ data, onChange }) {
  const info = FOUNDATION_INFO[data.foundationType] || {};
  return (
    <div className="space-y-4">
      <GuidedPrompt message="Foundation type affects structural requirements and permit complexity." variant="info" />
      <div>
        <Label>Foundation Type</Label>
        <Select value={data.foundationType || "slab"} onValueChange={v => onChange("foundationType", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="slab">Concrete Slab</SelectItem>
            <SelectItem value="crawl_space">Crawl Space</SelectItem>
            <SelectItem value="basement">Full Basement</SelectItem>
            <SelectItem value="concrete_pad">Concrete Pad</SelectItem>
            <SelectItem value="gravel">Gravel Base</SelectItem>
            <SelectItem value="skids">Skid / Timber Base</SelectItem>
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