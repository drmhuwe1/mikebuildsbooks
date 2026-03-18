import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import GuidedPrompt from "@/components/shared/GuidedPrompt";

export default function PermitStep2Deck({ data, onChange }) {
  return (
    <div className="space-y-4">
      <GuidedPrompt message="Enter measurements for the deck structure." variant="info" />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Deck Width (ft) *</Label>
          <Input type="number" value={data.deckWidth} onChange={(e) => onChange("deckWidth", parseFloat(e.target.value))} />
        </div>
        <div>
          <Label>Deck Depth (ft) *</Label>
          <Input type="number" value={data.deckDepth} onChange={(e) => onChange("deckDepth", parseFloat(e.target.value))} />
        </div>
        <div>
          <Label>Height Off Ground (ft) *</Label>
          <Input type="number" step="0.5" value={data.deckHeight} onChange={(e) => onChange("deckHeight", parseFloat(e.target.value))} />
        </div>
        <div>
          <Label>Number of Stairs</Label>
          <Input type="number" value={data.numStairs} onChange={(e) => onChange("numStairs", parseInt(e.target.value))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Stair Width (ft)</Label>
          <Input type="number" step="0.5" value={data.stairWidth} onChange={(e) => onChange("stairWidth", parseFloat(e.target.value))} />
        </div>
        <div>
          <Label>Stair Location</Label>
          <Select value={data.stairLocation} onValueChange={(v) => onChange("stairLocation", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="front">Front</SelectItem>
              <SelectItem value="side">Side</SelectItem>
              <SelectItem value="back">Back</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between border p-3 rounded-lg">
        <Label>Has Railing?</Label>
        <Switch checked={data.hasRailing} onCheckedChange={(v) => onChange("hasRailing", v)} />
      </div>

      <div className="flex items-center justify-between border p-3 rounded-lg">
        <Label>Attached to House?</Label>
        <Switch checked={data.isDeckAttached} onCheckedChange={(v) => onChange("isDeckAttached", v)} />
      </div>
    </div>
  );
}