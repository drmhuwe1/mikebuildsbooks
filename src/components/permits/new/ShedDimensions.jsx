import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CheckCircle, AlertTriangle } from "lucide-react";
import GuidedPrompt from "@/components/shared/GuidedPrompt";

export default function ShedDimensions({ data, onChange }) {
  const sqft = (data.shedWidth || 0) * (data.shedDepth || 0);
  const isExemptCandidate = sqft > 0 && sqft < 200;

  return (
    <div className="space-y-4">
      <GuidedPrompt message="Enter shed dimensions. Many municipalities exempt structures under 200 sq ft from permit requirements — we'll check this automatically." variant="info" />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Width (ft)</Label>
          <Input type="number" value={data.shedWidth || ""} onChange={e => onChange("shedWidth", Number(e.target.value))} placeholder="12" />
        </div>
        <div>
          <Label>Depth (ft)</Label>
          <Input type="number" value={data.shedDepth || ""} onChange={e => onChange("shedDepth", Number(e.target.value))} placeholder="16" />
        </div>
        <div>
          <Label>Wall Height (ft)</Label>
          <Input type="number" value={data.shedHeight || ""} onChange={e => onChange("shedHeight", Number(e.target.value))} placeholder="10" />
        </div>
      </div>

      {sqft > 0 && (
        <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
          Calculated area: <strong className="text-foreground">{sqft} sq ft</strong>
        </div>
      )}

      {isExemptCandidate && (
        <Card className="p-3 bg-green-50 border-green-200 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <p className="text-xs text-green-800">
            <strong>Possible permit exemption:</strong> This shed is under 200 sq ft. Many municipalities exempt accessory structures this size from permit requirements. The code check step will verify for your specific location.
          </p>
        </Card>
      )}

      {sqft >= 200 && (
        <Card className="p-3 bg-yellow-50 border-yellow-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-800">
            At {sqft} sq ft, a permit is likely required. The code check step will confirm local requirements.
          </p>
        </Card>
      )}
    </div>
  );
}