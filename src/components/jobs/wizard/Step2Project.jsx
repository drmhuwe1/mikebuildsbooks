import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const PROJECT_TYPES = [
  "Remodel", "Roofing", "Deck / Patio", "Addition", "New Construction",
  "Siding", "Windows & Doors", "Flooring", "Painting", "Plumbing",
  "Electrical", "HVAC", "Landscaping", "Driveway / Concrete", "Other",
];

export default function Step2Project({ data, onChange }) {
  const set = (k, v) => onChange({ ...data, [k]: v });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Project Name *</Label>
          <Input value={data.title || ""} onChange={e => set("title", e.target.value)} placeholder="e.g. Kitchen Remodel — Smith Residence" />
        </div>
        <div>
          <Label>Job Number</Label>
          <Input value={data.job_number || ""} onChange={e => set("job_number", e.target.value)} placeholder="Auto-generated" />
        </div>
      </div>
      <div>
        <Label>Project Type</Label>
        <Select value={data.project_type || ""} onValueChange={v => set("project_type", v)}>
          <SelectTrigger><SelectValue placeholder="Select project type" /></SelectTrigger>
          <SelectContent>
            {PROJECT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Scope of Work *</Label>
        <Textarea value={data.scope || ""} onChange={e => set("scope", e.target.value)} rows={4} placeholder="Describe the full scope of work to be performed..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Estimated Start Date <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input type="date" value={data.start_date || ""} onChange={e => set("start_date", e.target.value)} />
        </div>
        <div>
          <Label>Estimated Completion Date <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input type="date" value={data.projected_completion || ""} onChange={e => set("projected_completion", e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <Switch checked={data.permit_required || false} onCheckedChange={v => set("permit_required", v)} />
        <div>
          <p className="text-sm font-medium">Permit Required</p>
          <p className="text-xs text-muted-foreground">Will this job require a building permit?</p>
        </div>
      </div>
    </div>
  );
}