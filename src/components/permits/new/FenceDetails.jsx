import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import GuidedPrompt from "@/components/shared/GuidedPrompt";

export default function FenceDetails({ data, onChange }) {
  return (
    <div className="space-y-4">
      <GuidedPrompt message="Total linear footage and height are the two most common fields on a fence permit application." variant="info" />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Total Linear Footage (ft)</Label>
          <Input type="number" value={data.fenceTotalLinearFt || ""} onChange={e => onChange("fenceTotalLinearFt", Number(e.target.value))} placeholder="100" />
        </div>
        <div>
          <Label>Fence Height (ft)</Label>
          <Select value={String(data.fenceHeight || 6)} onValueChange={v => onChange("fenceHeight", Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[3, 4, 5, 6, 7, 8].map(h => (
                <SelectItem key={h} value={String(h)}>{h} ft</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="p-3 bg-yellow-50 border-yellow-200 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
        <div className="text-xs text-yellow-800">
          <p className="font-semibold">Property Survey Required</p>
          <p className="mt-1">Contractor must verify property survey before installation. Most fence permit applications require a copy of the recorded survey plat. Installing on or over the property line can result in forced removal.</p>
        </div>
      </Card>
    </div>
  );
}