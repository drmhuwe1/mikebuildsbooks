import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GuidedPrompt from "@/components/shared/GuidedPrompt";

export default function GarageDoorsWindows({ data, onChange }) {
  return (
    <div className="space-y-4">
      <GuidedPrompt message="Specify door and window placement. This information is required for the front elevation drawing." variant="info" />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Overhead Doors</Label>
          <Input type="number" min={0} max={4} value={data.overheadDoors ?? 2} onChange={e => onChange("overheadDoors", Number(e.target.value))} />
          <p className="text-xs text-muted-foreground mt-1">Typical width: 8 ft (single), 16 ft (double)</p>
        </div>
        <div>
          <Label>Overhead Door Width (ft each)</Label>
          <Input type="number" value={data.overheadDoorWidth || 9} onChange={e => onChange("overheadDoorWidth", Number(e.target.value))} placeholder="9" />
        </div>
        <div>
          <Label>Entry / Walk-Through Doors</Label>
          <Input type="number" min={0} max={4} value={data.entryDoors ?? 1} onChange={e => onChange("entryDoors", Number(e.target.value))} />
        </div>
        <div>
          <Label>Windows</Label>
          <Input type="number" min={0} max={12} value={data.garageWindows ?? 1} onChange={e => onChange("garageWindows", Number(e.target.value))} />
        </div>
      </div>
      <div>
        <Label>Notes on Placement <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input
          value={data.garageOpeningNotes || ""}
          onChange={e => onChange("garageOpeningNotes", e.target.value)}
          placeholder="e.g. Entry door on south wall, windows on east wall"
        />
      </div>
    </div>
  );
}