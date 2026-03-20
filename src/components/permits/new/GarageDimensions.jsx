import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GuidedPrompt from "@/components/shared/GuidedPrompt";

export default function GarageDimensions({ data, onChange }) {
  const sqft = (data.garageWidth || 0) * (data.garageDepth || 0);
  return (
    <div className="space-y-4">
      <GuidedPrompt message="Enter garage footprint dimensions. Standard single bay is 12–14 ft wide; double bay is 20–24 ft wide." variant="info" />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Width (ft)</Label>
          <Input type="number" value={data.garageWidth || ""} onChange={e => onChange("garageWidth", Number(e.target.value))} placeholder="24" />
        </div>
        <div>
          <Label>Depth (ft)</Label>
          <Input type="number" value={data.garageDepth || ""} onChange={e => onChange("garageDepth", Number(e.target.value))} placeholder="24" />
        </div>
        <div>
          <Label>Wall Height (ft)</Label>
          <Input type="number" value={data.garageHeight || ""} onChange={e => onChange("garageHeight", Number(e.target.value))} placeholder="10" />
        </div>
        <div>
          <Label>Number of Bays</Label>
          <Select value={String(data.garageBays || 2)} onValueChange={v => onChange("garageBays", Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Bay</SelectItem>
              <SelectItem value="2">2 Bays</SelectItem>
              <SelectItem value="3">3 Bays</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Setback — Front (ft)</Label>
          <Input type="number" value={data.setbackFront || ""} onChange={e => onChange("setbackFront", e.target.value)} placeholder="25" />
        </div>
        <div>
          <Label className="text-xs">Setback — Side (ft)</Label>
          <Input type="number" value={data.setbackSide || ""} onChange={e => onChange("setbackSide", e.target.value)} placeholder="5" />
        </div>
        <div>
          <Label className="text-xs">Setback — Rear (ft)</Label>
          <Input type="number" value={data.setbackRear || ""} onChange={e => onChange("setbackRear", e.target.value)} placeholder="5" />
        </div>
      </div>
      {sqft > 0 && (
        <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
          Footprint: <strong className="text-foreground">{sqft.toLocaleString()} sq ft</strong>
        </div>
      )}
    </div>
  );
}