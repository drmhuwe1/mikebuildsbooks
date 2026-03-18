import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GuidedPrompt from "@/components/shared/GuidedPrompt";

export default function WorkflowStep2Municipality({ data, onChange }) {
  return (
    <div className="space-y-4">
      <GuidedPrompt
        message="Enter the project address and municipality. This is used to identify local code requirements and permit needs."
        variant="info"
      />

      <div className="space-y-3">
        <div>
          <Label>Street Address *</Label>
          <Input
            value={data.projectAddress}
            onChange={(e) => onChange("projectAddress", e.target.value)}
            placeholder="123 Main Street"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>City / Municipality *</Label>
            <Input
              value={data.municipality}
              onChange={(e) => onChange("municipality", e.target.value)}
              placeholder="Springfield"
            />
          </div>
          <div>
            <Label>County</Label>
            <Input
              value={data.county || ""}
              onChange={(e) => onChange("county", e.target.value)}
              placeholder="County name"
            />
          </div>
          <div>
            <Label>ZIP Code *</Label>
            <Input
              value={data.zipCode}
              onChange={(e) => onChange("zipCode", e.target.value)}
              placeholder="12345"
            />
          </div>
        </div>
      </div>

      <Card className="p-3 bg-yellow-50 border-yellow-200">
        <p className="text-xs font-semibold text-yellow-900 mb-1">💡 Why This Matters</p>
        <p className="text-xs text-yellow-800">
          Different municipalities have different code requirements, inspection procedures, and permit fees. The system will use this location to provide targeted guidance.
        </p>
      </Card>

      <Card className="p-3 bg-blue-50 border-blue-200">
        <p className="text-xs font-semibold text-blue-900 mb-1">✅ Next: Design Measurements</p>
        <p className="text-xs text-blue-800">
          Enter your deck or roof dimensions. As you enter measurements, the system will show real-time code guidance and structural recommendations.
        </p>
      </Card>
    </div>
  );
}