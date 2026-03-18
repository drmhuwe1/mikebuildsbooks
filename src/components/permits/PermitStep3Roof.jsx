import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import GuidedPrompt from "@/components/shared/GuidedPrompt";

export default function PermitStep3Roof({ data, onChange }) {
  return (
    <div className="space-y-4">
      <GuidedPrompt message="Enter roof measurements and specifications." variant="info" />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Roof Width (ft) *</Label>
          <Input type="number" value={data.roofWidth} onChange={(e) => onChange("roofWidth", parseFloat(e.target.value))} />
        </div>
        <div>
          <Label>Roof Projection/Depth (ft) *</Label>
          <Input type="number" value={data.roofProjection} onChange={(e) => onChange("roofProjection", parseFloat(e.target.value))} />
        </div>
        <div>
          <Label>Roof Height (ft)</Label>
          <Input type="number" value={data.roofHeight} onChange={(e) => onChange("roofHeight", parseFloat(e.target.value))} />
        </div>
        <div>
          <Label>Roof Pitch</Label>
          <Select value={data.roofPitch} onValueChange={(v) => onChange("roofPitch", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2:12">2:12 (Shallow)</SelectItem>
              <SelectItem value="4:12">4:12 (Standard)</SelectItem>
              <SelectItem value="6:12">6:12 (Steeper)</SelectItem>
              <SelectItem value="8:12">8:12 (Steep)</SelectItem>
              <SelectItem value="12:12">12:12 (Very Steep)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Overhang (ft)</Label>
          <Input type="number" step="0.5" value={data.overhang} onChange={(e) => onChange("overhang", parseFloat(e.target.value))} />
        </div>
        <div>
          <Label>Support Post Count</Label>
          <Input type="number" value={data.supportPostCount} onChange={(e) => onChange("supportPostCount", parseInt(e.target.value))} />
        </div>
      </div>

      <div className="flex items-center justify-between border p-3 rounded-lg">
        <Label>Tied to Existing Structure?</Label>
        <Switch checked={data.tiedToExisting} onCheckedChange={(v) => onChange("tiedToExisting", v)} />
      </div>
    </div>
  );
}