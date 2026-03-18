import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GuidedPrompt from "@/components/shared/GuidedPrompt";

export default function WorkflowStep1ProjectInfo({ data, onChange }) {
  return (
    <div className="space-y-4">
      <GuidedPrompt message="Enter basic project information. This will be used throughout the workflow." variant="info" />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Project Type *</Label>
          <Select value={data.projectType} onValueChange={(v) => onChange("projectType", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Deck">Deck</SelectItem>
              <SelectItem value="Porch Roof">Porch Roof</SelectItem>
              <SelectItem value="Roof Over Existing Deck">Roof Over Existing Deck</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Customer Name *</Label>
          <Input
            value={data.customerName}
            onChange={(e) => onChange("customerName", e.target.value)}
            placeholder="John Smith"
          />
        </div>

        <div className="col-span-2">
          <Label>Project Description (optional)</Label>
          <Input
            value={data.projectDescription || ""}
            onChange={(e) => onChange("projectDescription", e.target.value)}
            placeholder="e.g., New ground-level deck, 12x12 composite with stairs"
          />
        </div>
      </div>

      <Card className="p-3 bg-blue-50 border-blue-200">
        <p className="text-xs font-semibold text-blue-900 mb-1">📋 Next Step</p>
        <p className="text-xs text-blue-800">
          You'll enter the full project address and municipality in the next step. This helps the system identify local code requirements and likely permit needs.
        </p>
      </Card>
    </div>
  );
}