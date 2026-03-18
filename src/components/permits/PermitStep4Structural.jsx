import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GuidedPrompt from "@/components/shared/GuidedPrompt";

export default function PermitStep4Structural({ data, onChange, projectType }) {
  return (
    <div className="space-y-4">
      <GuidedPrompt message="Specify structural materials and configuration." variant="info" />

      <div>
        <Label>Footing Count *</Label>
        <Input type="number" value={data.footingCount} onChange={(e) => onChange("footingCount", parseInt(e.target.value))} />
      </div>

      <div>
        <Label>Material Type *</Label>
        <Select value={data.materialType} onValueChange={(v) => onChange("materialType", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pressure-treated">Pressure Treated Wood</SelectItem>
            <SelectItem value="cedar">Cedar</SelectItem>
            <SelectItem value="composite">Composite</SelectItem>
            <SelectItem value="vinyl">Vinyl</SelectItem>
            <SelectItem value="metal">Metal Frame</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Decking Material *</Label>
        <Select value={data.deckingMaterial} onValueChange={(v) => onChange("deckingMaterial", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pressure-treated">Pressure Treated 2x6</SelectItem>
            <SelectItem value="composite">Composite Decking</SelectItem>
            <SelectItem value="cedar">Cedar Decking</SelectItem>
            <SelectItem value="vinyl">Vinyl Decking</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {["Porch Roof", "Covered Deck", "Roof Over Existing Deck"].some(t => t.toLowerCase().includes(projectType)) && (
        <div>
          <Label>Roofing Material *</Label>
          <Select value={data.roofingMaterial} onValueChange={(v) => onChange("roofingMaterial", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asphalt">Asphalt Shingles</SelectItem>
              <SelectItem value="metal">Metal Roofing</SelectItem>
              <SelectItem value="membrane">TPO Membrane</SelectItem>
              <SelectItem value="standing-seam">Standing Seam Metal</SelectItem>
              <SelectItem value="corrugated">Corrugated Polycarbonate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}