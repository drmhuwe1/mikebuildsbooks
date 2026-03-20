import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GuidedPrompt from "@/components/shared/GuidedPrompt";

export default function AdditionStructural({ data, onChange }) {
  return (
    <div className="space-y-4">
      <GuidedPrompt message="Structural details help identify load path and connection requirements for the permit drawing." variant="info" />
      <div>
        <Label>Wall Framing Type</Label>
        <Select value={data.wallFraming || "wood"} onValueChange={v => onChange("wallFraming", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="wood">Wood (2x4 or 2x6 stud)</SelectItem>
            <SelectItem value="steel">Light Gauge Steel</SelectItem>
            <SelectItem value="sip">SIP Panels</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Roof Connection Method</Label>
        <Select value={data.roofConnectionMethod || "gable"} onValueChange={v => onChange("roofConnectionMethod", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="gable">Gable (independent)</SelectItem>
            <SelectItem value="hip">Hip Extension</SelectItem>
            <SelectItem value="shed">Shed / Single Slope</SelectItem>
            <SelectItem value="tied_existing">Tied to Existing Roof</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Load-Bearing Wall Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input
          value={data.loadBearingWalls || ""}
          onChange={e => onChange("loadBearingWalls", e.target.value)}
          placeholder="e.g. North exterior wall is load-bearing, requires beam at opening"
        />
      </div>
      <div>
        <Label>Contractor License Number <span className="text-muted-foreground text-xs">(for permit form)</span></Label>
        <Input
          value={data.contractorLicense || ""}
          onChange={e => onChange("contractorLicense", e.target.value)}
          placeholder="e.g. PA-123456"
        />
      </div>
    </div>
  );
}