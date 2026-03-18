import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GuidedPrompt from "@/components/shared/GuidedPrompt";

export default function PermitStep1Project({ data, onChange }) {
  return (
    <div className="space-y-4">
      <GuidedPrompt message="Start by identifying the project type and location." variant="info" />
      
      <div>
        <Label>Project Type *</Label>
        <Select value={data.projectType} onValueChange={(v) => onChange("projectType", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deck">Deck</SelectItem>
            <SelectItem value="covered-deck">Covered Deck</SelectItem>
            <SelectItem value="porch-roof">Porch Roof</SelectItem>
            <SelectItem value="roof-existing">Roof Over Existing Deck</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Customer Name</Label>
        <Input value={data.customerName} onChange={(e) => onChange("customerName", e.target.value)} placeholder="John Smith" />
      </div>

      <div>
        <Label>Project Address *</Label>
        <Input value={data.projectAddress} onChange={(e) => onChange("projectAddress", e.target.value)} placeholder="123 Main Street" />
      </div>

      <div>
        <Label>Township / Municipality</Label>
        <Input value={data.municipality} onChange={(e) => onChange("municipality", e.target.value)} placeholder="e.g., Springfield Township" />
      </div>
    </div>
  );
}