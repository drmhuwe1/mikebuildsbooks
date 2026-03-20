import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle } from "lucide-react";
import GuidedPrompt from "@/components/shared/GuidedPrompt";

export default function FenceGatesHOA({ data, onChange }) {
  return (
    <div className="space-y-4">
      <GuidedPrompt message="Document gate placement and confirm HOA status before submitting for a permit." variant="info" />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Number of Gates</Label>
          <Input type="number" min={0} max={10} value={data.numGates ?? 1} onChange={e => onChange("numGates", Number(e.target.value))} />
        </div>
        <div>
          <Label>Gate Width (ft each)</Label>
          <Input type="number" value={data.gateWidth || 4} onChange={e => onChange("gateWidth", Number(e.target.value))} placeholder="4" />
        </div>
      </div>

      <div>
        <Label>Gate Location Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input value={data.gateNotes || ""} onChange={e => onChange("gateNotes", e.target.value)} placeholder="e.g. Double gate on north side for vehicle access" />
      </div>

      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div>
          <Label className="font-medium">Property is in an HOA</Label>
          <p className="text-xs text-muted-foreground mt-0.5">Homeowners Association restrictions may apply</p>
        </div>
        <Switch checked={!!data.hasHOA} onCheckedChange={v => onChange("hasHOA", v)} />
      </div>

      {data.hasHOA && (
        <Card className="p-3 bg-yellow-50 border-yellow-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
          <div className="text-xs text-yellow-800">
            <p className="font-semibold">HOA Approval Required</p>
            <p className="mt-1">This property is in an HOA. You must obtain HOA written approval before applying for a municipal permit. Many HOAs restrict fence type, height, color, and placement.</p>
          </div>
        </Card>
      )}

      {!data.hasHOA && (
        <Card className="p-3 bg-green-50 border-green-200 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <p className="text-xs text-green-800">No HOA — proceed directly to municipality permit application. Remember to include the survey plat copy.</p>
        </Card>
      )}
    </div>
  );
}