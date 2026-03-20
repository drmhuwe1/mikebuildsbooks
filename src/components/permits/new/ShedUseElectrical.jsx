import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import GuidedPrompt from "@/components/shared/GuidedPrompt";

const USE_NOTES = {
  storage: "Basic storage generally has the most lenient permit requirements.",
  workshop: "Workshop use often requires electrical, ventilation, and may increase occupancy classification.",
  studio: "Studio / habitable space typically requires insulation, egress windows, and heating — significantly more permit complexity.",
  gym: "Home gym — generally similar requirements to workshop.",
  other: "Describe use in notes for the permit application.",
};

export default function ShedUseElectrical({ data, onChange }) {
  return (
    <div className="space-y-4">
      <GuidedPrompt message="Intended use affects occupancy classification and permit requirements. Workshop and studio use add complexity." variant="info" />
      <div>
        <Label>Intended Use</Label>
        <Select value={data.shedUse || "storage"} onValueChange={v => onChange("shedUse", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="storage">Storage</SelectItem>
            <SelectItem value="workshop">Workshop / Garage</SelectItem>
            <SelectItem value="studio">Studio / Habitable Space</SelectItem>
            <SelectItem value="gym">Home Gym</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {USE_NOTES[data.shedUse] && (
          <p className="text-xs text-muted-foreground mt-1.5">{USE_NOTES[data.shedUse]}</p>
        )}
      </div>

      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div>
          <Label className="font-medium">Include Electrical</Label>
          <p className="text-xs text-muted-foreground mt-0.5">Outlets, lighting, or sub-panel</p>
        </div>
        <Switch checked={!!data.shedElectrical} onCheckedChange={v => onChange("shedElectrical", v)} />
      </div>

      {data.shedElectrical && (
        <Card className="p-3 bg-yellow-50 border-yellow-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-800">Electrical in an accessory structure typically requires a separate electrical permit and licensed electrician. Confirm with your local building department.</p>
        </Card>
      )}

      {data.shedUse === "studio" && (
        <Card className="p-3 bg-red-50 border-red-200 text-xs text-red-800">
          <p className="font-semibold">Habitable Space Warning</p>
          <p className="mt-1">Converting a shed into livable/studio space dramatically increases permit complexity. Insulation, egress windows, heating, and potentially a separate utility permit will be required. Consult with your building department early.</p>
        </Card>
      )}
    </div>
  );
}