import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import GuidedPrompt from "@/components/shared/GuidedPrompt";

export default function GarageElectrical({ data, onChange }) {
  return (
    <div className="space-y-4">
      <GuidedPrompt message="Electrical in a detached garage typically requires a sub-panel. A separate electrical permit is usually required." variant="info" />
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div>
          <Label className="font-medium">Include Electrical</Label>
          <p className="text-xs text-muted-foreground mt-0.5">Outlets, lighting, or sub-panel in garage</p>
        </div>
        <Switch checked={!!data.garageElectrical} onCheckedChange={v => onChange("garageElectrical", v)} />
      </div>
      {data.garageElectrical && (
        <div className="space-y-3 pl-1">
          <div>
            <Label>Sub-Panel Size</Label>
            <Select value={data.garagePanelSize || "60"} onValueChange={v => onChange("garagePanelSize", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="60">60 Amp</SelectItem>
                <SelectItem value="100">100 Amp</SelectItem>
                <SelectItem value="125">125 Amp</SelectItem>
                <SelectItem value="200">200 Amp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Electrical Notes</Label>
            <Input value={data.garageElectricalNotes || ""} onChange={e => onChange("garageElectricalNotes", e.target.value)} placeholder="e.g. 4 outlets, 2 overhead fixtures, EV charger" />
          </div>
          <Card className="p-3 bg-yellow-50 border-yellow-200 text-xs text-yellow-800">
            A separate electrical permit and licensed electrician are typically required for sub-panel installation. Verify with your local building department.
          </Card>
        </div>
      )}
    </div>
  );
}