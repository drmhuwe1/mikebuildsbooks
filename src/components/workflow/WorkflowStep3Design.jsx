import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { AlertTriangle } from "lucide-react";

export default function WorkflowStep3Design({ data, onChange, isRoof, warnings }) {
  const designWarnings = warnings.filter(w => w.type === "code" || w.type === "structural");

  return (
    <div className="space-y-4">
      <GuidedPrompt
        message="Enter your design measurements. Real-time guidance will appear as you update values."
        variant="info"
      />

      {/* Live warnings */}
      {designWarnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-amber-900 mb-2">⚠️ Live Code Guidance</p>
          <ul className="space-y-1">
            {designWarnings.map((w, i) => (
              <li key={i} className="text-xs text-amber-800 flex items-start gap-2">
                <span className="mt-0.5">→</span>
                <span>{w.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isRoof ? (
        // DECK MEASUREMENTS
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Deck Width (ft) *</Label>
              <Input
                type="number"
                value={data.deckWidth}
                onChange={(e) => onChange("deckWidth", parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label>Deck Depth (ft) *</Label>
              <Input
                type="number"
                value={data.deckDepth}
                onChange={(e) => onChange("deckDepth", parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label>Height Off Ground (ft) *</Label>
              <Input
                type="number"
                value={data.deckHeight}
                onChange={(e) => onChange("deckHeight", parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-3">Stairs</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Number of Stair Runs *</Label>
                <Input
                  type="number"
                  value={data.numStairs}
                  onChange={(e) => onChange("numStairs", Math.max(0, parseInt(e.target.value)))}
                />
              </div>
              <div>
                <Label>Stair Width (ft) *</Label>
                <Input
                  type="number"
                  value={data.stairWidth}
                  onChange={(e) => onChange("stairWidth", parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Select value={data.stairLocation} onValueChange={(v) => onChange("stairLocation", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="front">Front</SelectItem>
                    <SelectItem value="side">Side</SelectItem>
                    <SelectItem value="rear">Rear</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-3">Safety & Attachment</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <Label className="mb-0">Requires Guardrail (36"+ height) *</Label>
                <Switch
                  checked={data.hasRailing}
                  onCheckedChange={(v) => onChange("hasRailing", v)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <Label className="mb-0">Attached to House *</Label>
                <Switch
                  checked={data.isDeckAttached}
                  onCheckedChange={(v) => onChange("isDeckAttached", v)}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-3">Structure</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Number of Support Footings *</Label>
                <Input
                  type="number"
                  value={data.footingCount}
                  onChange={(e) => onChange("footingCount", parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Material Type</Label>
                <Select value={data.materialType} onValueChange={(v) => onChange("materialType", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pressure-treated">Pressure Treated</SelectItem>
                    <SelectItem value="composite">Composite</SelectItem>
                    <SelectItem value="cedar">Cedar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ROOF MEASUREMENTS
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Roof Width (ft) *</Label>
              <Input
                type="number"
                value={data.roofWidth}
                onChange={(e) => onChange("roofWidth", parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label>Projection Forward (ft) *</Label>
              <Input
                type="number"
                value={data.roofProjection}
                onChange={(e) => onChange("roofProjection", parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label>Support Post Count *</Label>
              <Input
                type="number"
                value={data.supportPostCount}
                onChange={(e) => onChange("supportPostCount", parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Roof Pitch (e.g., 4:12) *</Label>
              <Input
                value={data.roofPitch}
                onChange={(e) => onChange("roofPitch", e.target.value)}
                placeholder="4:12"
              />
            </div>
            <div>
              <Label>Overhang (ft) *</Label>
              <Input
                type="number"
                value={data.overhang}
                onChange={(e) => onChange("overhang", parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label>Roofing Material</Label>
              <Select value={data.roofingMaterial} onValueChange={(v) => onChange("roofingMaterial", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asphalt">Asphalt Shingles</SelectItem>
                  <SelectItem value="metal">Metal</SelectItem>
                  <SelectItem value="cedar">Cedar Shake</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-3">Connection</h3>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <Label className="mb-0">Tied to Existing Structure *</Label>
              <Switch
                checked={data.tiedToExisting}
                onCheckedChange={(v) => onChange("tiedToExisting", v)}
              />
            </div>
          </div>
        </div>
      )}

      <Card className="p-3 bg-green-50 border-green-200">
        <p className="text-xs font-semibold text-green-900 mb-1">✅ Design measurements captured</p>
        <p className="text-xs text-green-800">
          Next, you'll see structural recommendations and code-based guidance for your design.
        </p>
      </Card>
    </div>
  );
}