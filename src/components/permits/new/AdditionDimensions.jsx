import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GuidedPrompt from "@/components/shared/GuidedPrompt";

export default function AdditionDimensions({ data, onChange }) {
  const sqft = (data.additionLength || 0) * (data.additionWidth || 0);
  return (
    <div className="space-y-4">
      <GuidedPrompt message="Enter the dimensions of the addition footprint. These will be used for drawings and permit calculations." variant="info" />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Length (ft)</Label>
          <Input type="number" value={data.additionLength || ""} onChange={e => onChange("additionLength", Number(e.target.value))} placeholder="20" />
        </div>
        <div>
          <Label>Width (ft)</Label>
          <Input type="number" value={data.additionWidth || ""} onChange={e => onChange("additionWidth", Number(e.target.value))} placeholder="16" />
        </div>
        <div>
          <Label>Ceiling Height (ft)</Label>
          <Input type="number" value={data.ceilingHeight || ""} onChange={e => onChange("ceilingHeight", Number(e.target.value))} placeholder="9" />
        </div>
        <div>
          <Label>Number of Stories</Label>
          <Select value={String(data.additionStories || 1)} onValueChange={v => onChange("additionStories", Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Story</SelectItem>
              <SelectItem value="2">2 Stories</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {sqft > 0 && (
        <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
          Calculated area: <strong className="text-foreground">{sqft.toLocaleString()} sq ft</strong>
        </div>
      )}
    </div>
  );
}