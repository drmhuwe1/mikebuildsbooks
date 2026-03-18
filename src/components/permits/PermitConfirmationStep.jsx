import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle } from "lucide-react";

export default function PermitConfirmationStep({ data }) {
  const projectType = data.projectType || "Unknown";
  const isRoofProject = ["porch roof", "roof over existing deck"].some(t => 
    projectType.toLowerCase().includes(t)
  );

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-900">Ready to Generate Drawings</p>
            <p className="text-xs text-green-800 mt-1">
              Your permit drawing project has been configured. Review the summary below before closing.
            </p>
          </div>
        </div>
      </div>

      {/* Project Summary */}
      <Card className="p-4 space-y-4">
        <h3 className="font-semibold text-sm">Project Summary</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Customer Name</p>
            <p className="text-sm">{data.customerName || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Project Type</p>
            <p className="text-sm capitalize">{projectType}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground font-semibold">Address</p>
            <p className="text-sm">{data.projectAddress}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Municipality</p>
            <p className="text-sm">{data.municipality || "—"}</p>
          </div>
        </div>
      </Card>

      {/* Deck Details */}
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm">Deck Specifications</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Dimensions</p>
            <p className="text-sm">{data.deckWidth} ft × {data.deckDepth} ft</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Height</p>
            <p className="text-sm">{data.deckHeight} ft off ground</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Material</p>
            <p className="text-sm capitalize">{data.deckingMaterial}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Attached to Home</p>
            <p className="text-sm">{data.isDeckAttached ? "Yes" : "No"}</p>
          </div>
        </div>

        {/* Stairs & Railings */}
        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground font-semibold mb-2">Stairs & Railings</p>
          <div className="flex gap-2 flex-wrap">
            <Badge variant={data.numStairs > 0 ? "default" : "secondary"}>
              {data.numStairs} stair{data.numStairs !== 1 ? "s" : ""} ({data.stairWidth} ft wide)
            </Badge>
            <Badge variant={data.hasRailing ? "default" : "secondary"}>
              {data.hasRailing ? "✓ Railing included" : "No railing"}
            </Badge>
          </div>
        </div>

        {/* Footings */}
        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground font-semibold mb-2">Structural</p>
          <div className="flex gap-2">
            <Badge variant="secondary">{data.footingCount} footings</Badge>
            <Badge variant="secondary" className="capitalize">{data.materialType}</Badge>
          </div>
        </div>
      </Card>

      {/* Roof Specifications (if applicable) */}
      {isRoofProject && (
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-sm">Roof Specifications</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Dimensions</p>
              <p className="text-sm">{data.roofWidth} ft × {data.roofProjection} ft</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Pitch</p>
              <p className="text-sm">{data.roofPitch}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Height</p>
              <p className="text-sm">{data.roofHeight} ft</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Material</p>
              <p className="text-sm capitalize">{data.roofingMaterial}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Support Posts</p>
              <p className="text-sm">{data.supportPostCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Tied to Home</p>
              <p className="text-sm">{data.tiedToExisting ? "Yes" : "No"}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Checklist Status */}
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm">Permit Checklist</h3>
        <div className="space-y-2">
          {Object.entries(data.checklist || {}).map(([key, checked]) => {
            const labels = {
              dimensions: "Deck dimensions documented",
              footings: "Footing details specified",
              stairs: "Stair specifications complete",
              railings: "Railing requirements met",
              roofPitch: "Roof pitch documented",
              support: "Support structure noted",
              attachment: "Attachment method documented",
            };

            return (
              <div key={key} className="flex items-center gap-2 text-sm">
                <span className={checked ? "text-green-600" : "text-amber-600"}>
                  {checked ? "✓" : "○"}
                </span>
                <span className={checked ? "text-foreground" : "text-muted-foreground"}>
                  {labels[key]}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Next Steps */}
      <Card className="p-4 bg-blue-50 border-blue-200 space-y-3">
        <p className="text-sm font-semibold text-blue-900">Next Steps</p>
        <ol className="text-xs text-blue-800 space-y-2 ml-2">
          <li>1. <strong>Use the tools on the Review tab</strong> to edit drawings, check municipal requirements, or build a permit packet</li>
          <li>2. <strong>Run the AI Permit Requirements Checker</strong> to identify likely submission requirements for your location</li>
          <li>3. <strong>Build a Permit Packet</strong> to assemble all documentation</li>
          <li>4. <strong>Verify with your local building department</strong> before final submission</li>
        </ol>
      </Card>

      {/* Disclaimer */}
      <Card className="p-4 bg-yellow-50 border-yellow-200 space-y-2">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-yellow-900">Important Reminder</p>
            <p className="text-xs text-yellow-800 mt-1">
              These drawings are basic permit-support documentation. Additional engineered or stamped plans, site plans, and municipality-specific forms may be required. Always verify final requirements directly with your local building or zoning office before submission.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}