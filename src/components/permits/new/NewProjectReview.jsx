import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Printer, Save, CheckSquare, DollarSign, FileText, AlertTriangle, Zap
} from "lucide-react";
import PermitFeeChecker from "@/components/permits/PermitFeeChecker";
import PermitRequirementsChecker from "@/components/permits/PermitRequirementsChecker";
import PermitPacketBuilder from "@/components/permits/PermitPacketBuilder";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const CHECKLISTS = {
  addition: [
    "Foundation plan included",
    "Floor plan with dimensions",
    "Front and side elevations",
    "Roof framing plan",
    "Wall section detail",
    "MEP rough-in locations noted",
    "Load path documented",
    "Energy compliance (insulation values)",
  ],
  garage: [
    "Foundation / footing plan",
    "Floor plan with door/window locations",
    "Front elevation drawing",
    "Setback dimensions from property lines",
    "Electrical panel location (if applicable)",
    "Overhead door sizes labeled",
  ],
  fence: [
    "Survey plat copy obtained",
    "Total linear footage documented",
    "Gate locations and widths noted",
    "Fence height clearly stated",
    "HOA approval obtained (if applicable)",
    "Property line verification complete",
  ],
  shed: [
    "Overall dimensions on drawing",
    "Foundation type noted",
    "Setbacks from property lines",
    "Intended use documented",
    "Electrical details included (if applicable)",
    "Permit exemption verified (if under 200 sq ft)",
  ],
};

export default function NewProjectReview({ data, company, projectType, onSave }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [checkingFees, setCheckingFees] = useState(false);
  const [checkingReqs, setCheckingReqs] = useState(false);
  const [buildingPacket, setBuildingPacket] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checklist, setChecklist] = useState(() => {
    const items = CHECKLISTS[projectType] || [];
    return items.reduce((acc, item) => ({ ...acc, [item]: false }), {});
  });

  const checklistItems = CHECKLISTS[projectType] || [];
  const completedCount = Object.values(checklist).filter(Boolean).length;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave();
      toast({ title: "Permit project saved successfully" });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateBid = () => {
    // Navigate to QuickBid with project context pre-filled via state
    navigate("/QuickBid", {
      state: {
        prefill: buildBidPrompt(data, projectType),
      },
    });
  };

  const handlePrint = () => {
    const win = window.open("", "", "width=1200,height=800");
    win.document.write(generatePrintHTML(data, projectType, company));
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); setTimeout(() => win.close(), 500); }, 800);
  };

  return (
    <div className="space-y-4">
      <GuidedPrompt message="Review your project details, complete the permit checklist, and export your permit packet." variant="success" />

      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-xs font-semibold text-blue-900 mb-1">DISCLAIMER</p>
        <p className="text-xs text-blue-800">These are basic permit-support drawings generated from measurement input. Additional engineered or stamped plans may be required. Always verify with your local building department before submission.</p>
      </Card>

      {/* Summary */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-3">Project Summary</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Type:</span> <strong className="capitalize">{projectType}</strong></div>
          <div><span className="text-muted-foreground">Customer:</span> <strong>{data.customerName || "—"}</strong></div>
          <div className="col-span-2"><span className="text-muted-foreground">Address:</span> <strong>{data.projectAddress}</strong></div>
          <div><span className="text-muted-foreground">Municipality:</span> <strong>{data.municipality || "—"}</strong></div>
          {data.codeCheckResult?.permitRequired === false && (
            <div><Badge className="bg-green-100 text-green-700 text-xs">Permit may not be required</Badge></div>
          )}
        </div>
        <ProjectSpecificSummary data={data} projectType={projectType} />
      </Card>

      {/* Permit Checklist */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Permit Checklist</h3>
          <Badge variant={completedCount === checklistItems.length ? "default" : "outline"} className="text-xs">
            {completedCount}/{checklistItems.length} complete
          </Badge>
        </div>
        <div className="space-y-2">
          {checklistItems.map(item => (
            <div key={item} className="flex items-center gap-3 p-2 border rounded-lg">
              <Checkbox
                checked={checklist[item] || false}
                onCheckedChange={v => setChecklist(c => ({ ...c, [item]: v }))}
              />
              <Label className="cursor-pointer flex-1 m-0 text-sm font-normal">{item}</Label>
            </div>
          ))}
        </div>
      </Card>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-1.5" /> Print Drawing
        </Button>
        <Button variant="outline" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-1.5" /> {saving ? "Saving..." : "Save Project"}
        </Button>
        <Button onClick={() => setCheckingReqs(true)} className="bg-amber-600 hover:bg-amber-700">
          <CheckSquare className="w-4 h-4 mr-1.5" /> Check Reqs
        </Button>
        <Button onClick={() => setCheckingFees(true)} className="bg-green-600 hover:bg-green-700">
          <DollarSign className="w-4 h-4 mr-1.5" /> Fee Check
        </Button>
        <Button onClick={() => setBuildingPacket(true)} className="bg-blue-600 hover:bg-blue-700">
          <FileText className="w-4 h-4 mr-1.5" /> Build Packet
        </Button>
        <Button onClick={handleGenerateBid} className="bg-primary">
          <Zap className="w-4 h-4 mr-1.5" /> Generate Bid
        </Button>
      </div>

      {checkingFees && <PermitFeeChecker open={checkingFees} onClose={() => setCheckingFees(false)} permitData={data} onFeesDetected={() => {}} />}
      {checkingReqs && <PermitRequirementsChecker open={checkingReqs} onClose={() => setCheckingReqs(false)} permitData={data} packetSections={{}} />}
      {buildingPacket && <PermitPacketBuilder data={data} company={company} onClose={() => setBuildingPacket(false)} />}
    </div>
  );
}

function ProjectSpecificSummary({ data, projectType }) {
  if (projectType === "addition") return (
    <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs text-muted-foreground">
      <span>Dimensions: <strong className="text-foreground">{data.additionLength}×{data.additionWidth} ft</strong></span>
      <span>Foundation: <strong className="text-foreground capitalize">{(data.foundationType || "").replace("_", " ")}</strong></span>
      <span>MEP: <strong className="text-foreground">{[data.newHVAC && "HVAC", data.newElectrical && "Electrical", data.newPlumbing && "Plumbing"].filter(Boolean).join(", ") || "None"}</strong></span>
    </div>
  );
  if (projectType === "garage") return (
    <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs text-muted-foreground">
      <span>Size: <strong className="text-foreground">{data.garageWidth}×{data.garageDepth} ft ({data.garageBays}-bay)</strong></span>
      <span>Electrical: <strong className="text-foreground">{data.garageElectrical ? `Yes (${data.garagePanelSize}A)` : "No"}</strong></span>
    </div>
  );
  if (projectType === "fence") return (
    <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs text-muted-foreground">
      <span>Type: <strong className="text-foreground capitalize">{(data.fenceType || "").replace("_", " ")}</strong></span>
      <span>Length / Height: <strong className="text-foreground">{data.fenceTotalLinearFt} LF × {data.fenceHeight} ft</strong></span>
      <span>Gates: <strong className="text-foreground">{data.numGates} ({data.gateWidth} ft wide)</strong></span>
      <span>HOA: <strong className="text-foreground">{data.hasHOA ? "Yes" : "No"}</strong></span>
    </div>
  );
  if (projectType === "shed") return (
    <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs text-muted-foreground">
      <span>Size: <strong className="text-foreground">{data.shedWidth}×{data.shedDepth} ft ({(data.shedWidth || 0) * (data.shedDepth || 0)} sq ft)</strong></span>
      <span>Use: <strong className="text-foreground capitalize">{data.shedUse}</strong></span>
      <span>Foundation: <strong className="text-foreground capitalize">{(data.shedFoundation || "").replace("_", " ")}</strong></span>
      <span>Electrical: <strong className="text-foreground">{data.shedElectrical ? "Yes" : "No"}</strong></span>
    </div>
  );
  return null;
}

function buildBidPrompt(data, projectType) {
  const labels = { addition: "room addition", garage: "detached garage", fence: "fence", shed: "shed" };
  const label = labels[projectType] || projectType;
  if (projectType === "addition") {
    return `Build a ${label} at ${data.projectAddress}. Dimensions: ${data.additionLength}×${data.additionWidth} ft, ${data.ceilingHeight} ft ceilings, ${data.additionStories} story. Foundation: ${data.foundationType}. MEP: ${[data.newHVAC && "HVAC", data.newElectrical && "electrical", data.newPlumbing && "plumbing"].filter(Boolean).join(", ") || "none"}.`;
  }
  if (projectType === "garage") {
    return `Build a detached ${data.garageBays}-bay garage at ${data.projectAddress}. ${data.garageWidth}×${data.garageDepth} ft, ${data.garageHeight} ft walls. ${data.overheadDoors} overhead doors. Foundation: ${data.foundationType}. Electrical: ${data.garageElectrical ? `yes, ${data.garagePanelSize}A sub-panel` : "no"}.`;
  }
  if (projectType === "fence") {
    return `Install ${data.fenceTotalLinearFt} linear feet of ${(data.fenceType || "").replace("_", " ")} fence, ${data.fenceHeight} ft tall, at ${data.projectAddress}. ${data.numGates} gate(s) at ${data.gateWidth} ft wide.`;
  }
  if (projectType === "shed") {
    return `Build a ${data.shedWidth}×${data.shedDepth} ft shed at ${data.projectAddress}. Foundation: ${data.shedFoundation}. Use: ${data.shedUse}. Electrical: ${data.shedElectrical ? "yes" : "no"}.`;
  }
  return `${label} permit project at ${data.projectAddress}`;
}

function generatePrintHTML(data, projectType, company) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Permit Drawing — ${data.projectAddress}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: letter; margin: 0.5in; }
  body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #333; }
  h1 { font-size: 16pt; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
  h2 { font-size: 13pt; margin: 15px 0 8px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  td, th { border: 1px solid #999; padding: 5px 8px; text-align: left; }
  th { background: #f0f0f0; font-weight: bold; }
  .disclaimer { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; margin: 15px 0; font-size: 9pt; }
  .section { margin-bottom: 15px; }
</style></head>
<body>
<h1>PERMIT SUPPORT DRAWING — ${(projectType || "").toUpperCase()}</h1>
<div class="section">
  <table>
    <tr><th>Customer</th><td>${data.customerName || "—"}</td><th>Address</th><td>${data.projectAddress}</td></tr>
    <tr><th>Municipality</th><td>${data.municipality || "—"}</td><th>Date</th><td>${new Date().toLocaleDateString()}</td></tr>
    <tr><th>Contractor License</th><td>${data.contractorLicense || "—"}</td><th>Company</th><td>${company.company_name || "—"}</td></tr>
  </table>
</div>
<div class="section">
  <h2>Project Specifications</h2>
  <table>
    ${projectType === "addition" ? `
      <tr><th>Dimensions</th><td>${data.additionLength}×${data.additionWidth} ft</td><th>Ceiling Height</th><td>${data.ceilingHeight} ft</td></tr>
      <tr><th>Stories</th><td>${data.additionStories}</td><th>Foundation</th><td>${data.foundationType}</td></tr>
      <tr><th>Wall Framing</th><td>${data.wallFraming}</td><th>Roof Connection</th><td>${data.roofConnectionMethod}</td></tr>
      <tr><th>HVAC</th><td>${data.newHVAC ? "Yes" : "No"}</td><th>Electrical</th><td>${data.newElectrical ? "Yes" : "No"}</td></tr>
      <tr><th>Plumbing</th><td>${data.newPlumbing ? "Yes" : "No"}</td><td colspan="2"></td></tr>` : ""}
    ${projectType === "garage" ? `
      <tr><th>Dimensions</th><td>${data.garageWidth}×${data.garageDepth} ft</td><th>Wall Height</th><td>${data.garageHeight} ft</td></tr>
      <tr><th>Bays</th><td>${data.garageBays}</td><th>Foundation</th><td>${data.foundationType}</td></tr>
      <tr><th>Overhead Doors</th><td>${data.overheadDoors}</td><th>Entry Doors</th><td>${data.entryDoors}</td></tr>
      <tr><th>Electrical</th><td>${data.garageElectrical ? `Yes — ${data.garagePanelSize}A` : "No"}</td><td colspan="2"></td></tr>` : ""}
    ${projectType === "fence" ? `
      <tr><th>Type</th><td>${(data.fenceType || "").replace("_", " ")}</td><th>Height</th><td>${data.fenceHeight} ft</td></tr>
      <tr><th>Total Length</th><td>${data.fenceTotalLinearFt} LF</td><th>Gates</th><td>${data.numGates} × ${data.gateWidth} ft</td></tr>
      <tr><th>HOA</th><td>${data.hasHOA ? "Yes" : "No"}</td><td colspan="2"></td></tr>` : ""}
    ${projectType === "shed" ? `
      <tr><th>Dimensions</th><td>${data.shedWidth}×${data.shedDepth} ft (${(data.shedWidth || 0) * (data.shedDepth || 0)} sq ft)</td><th>Wall Height</th><td>${data.shedHeight} ft</td></tr>
      <tr><th>Foundation</th><td>${(data.shedFoundation || "").replace("_", " ")}</td><th>Intended Use</th><td>${data.shedUse}</td></tr>
      <tr><th>Electrical</th><td>${data.shedElectrical ? "Yes" : "No"}</td><td colspan="2"></td></tr>` : ""}
  </table>
</div>
<div class="disclaimer">
  <strong>DISCLAIMER:</strong> These drawings are basic permit-support sketches generated from measurement input and are provided for planning and submission assistance only. Additional engineered or stamped plans may be required depending on your municipality and project type. Always verify with your local building department before submission. All work must comply with applicable local building codes.
</div>
</body></html>`;
}