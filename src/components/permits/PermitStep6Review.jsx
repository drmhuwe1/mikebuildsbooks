import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Printer, Edit2, FileText } from "lucide-react";
import PermitDrawingPreview from "./PermitDrawingPreview";
import InteractiveDrawingCanvas from "./InteractiveDrawingCanvas";
import PermitPacketBuilder from "./PermitPacketBuilder";
import GuidedPrompt from "@/components/shared/GuidedPrompt";

export default function PermitStep6Review({ data }) {
  const [generating, setGenerating] = useState(false);
  const [editingDrawing, setEditingDrawing] = useState(false);
  const [drawingElements, setDrawingElements] = useState(null);

  const handlePrintPDF = async () => {
    setGenerating(true);
    try {
      const printWindow = window.open('', '', 'width=1200,height=800');
      const html = generatePermitPDF(data);
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => printWindow.close(), 500);
      }, 1000);
    } catch (error) {
      console.error('Print error:', error);
      alert('Error generating PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <GuidedPrompt message="Review your permit drawings. Export as PDF when ready." variant="success" />

      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-xs font-semibold text-blue-900 mb-2">DISCLAIMER</p>
        <p className="text-xs text-blue-800">
          These are basic permit-support drawings generated from measurement input. Additional engineered or stamped plans may be required depending on your municipality and project type. Always verify with your local building department before submission.
        </p>
      </Card>

      <div className="border rounded-lg p-4 bg-background">
        <h3 className="font-semibold mb-3">Project Summary</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Type:</span> <strong>{data.projectType}</strong></div>
          <div><span className="text-muted-foreground">Customer:</span> <strong>{data.customerName || "—"}</strong></div>
          <div><span className="text-muted-foreground">Address:</span> <strong>{data.projectAddress}</strong></div>
          <div><span className="text-muted-foreground">Municipality:</span> <strong>{data.municipality || "—"}</strong></div>
        </div>
      </div>

      <PermitDrawingPreview data={data} elements={drawingElements} />

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setEditingDrawing(true)} className="flex-1">
          <Edit2 className="w-4 h-4 mr-2" />
          Edit Drawing
        </Button>
        <Button onClick={handlePrintPDF} disabled={generating} className="flex-1">
          <Printer className="w-4 h-4 mr-2" />
          {generating ? "Generating..." : "Print / Save as PDF"}
        </Button>
      </div>

      {editingDrawing && (
        <InteractiveDrawingCanvas
          data={data}
          onUpdate={(result) => setDrawingElements(result.elements)}
          onClose={() => setEditingDrawing(false)}
        />
      )}
    </div>
  );
}

function generatePermitPDF(data) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Permit Drawing - ${data.projectAddress}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: letter; margin: 0.5in; }
  body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #333; }
  .page { page-break-after: always; padding: 20px; min-height: 10.5in; }
  .page:last-of-type { page-break-after: avoid; }
  h1 { font-size: 18pt; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px; }
  h2 { font-size: 14pt; margin-top: 15px; margin-bottom: 8px; }
  .header { margin-bottom: 20px; }
  .section { margin-bottom: 15px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  td, th { border: 1px solid #999; padding: 6px; text-align: left; }
  th { background-color: #f0f0f0; font-weight: bold; }
  .drawing { border: 1px solid #000; margin: 10px 0; padding: 10px; background: #fafafa; }
  svg { max-width: 100%; height: auto; }
  .notes { font-size: 9pt; line-height: 1.3; color: #666; margin-top: 10px; }
  .disclaimer { background-color: #fff3cd; border: 1px solid #ffc107; padding: 10px; margin: 15px 0; font-size: 9pt; }
</style>
</head>
<body>

<div class="page">
  <div class="header">
    <h1>PERMIT SUPPORT DRAWING</h1>
    <h2>${data.projectType} Construction</h2>
  </div>

  <div class="section">
    <h3>Project Information</h3>
    <table>
      <tr><td><strong>Customer Name:</strong></td><td>${data.customerName || "Not provided"}</td></tr>
      <tr><td><strong>Project Address:</strong></td><td>${data.projectAddress}</td></tr>
      <tr><td><strong>Municipality:</strong></td><td>${data.municipality || "Not specified"}</td></tr>
      <tr><td><strong>Project Type:</strong></td><td>${data.projectType}</td></tr>
      <tr><td><strong>Date Prepared:</strong></td><td>${new Date().toLocaleDateString()}</td></tr>
    </table>
  </div>

  <div class="section">
    <h3>Deck Specifications</h3>
    <table>
      <tr><td><strong>Width:</strong></td><td>${data.deckWidth} ft</td><td><strong>Depth:</strong></td><td>${data.deckDepth} ft</td></tr>
      <tr><td><strong>Height Off Ground:</strong></td><td>${data.deckHeight} ft</td><td><strong>Attached:</strong></td><td>${data.isDeckAttached ? "Yes" : "No"}</td></tr>
      <tr><td><strong>Railing:</strong></td><td>${data.hasRailing ? "Yes" : "No"}</td><td><strong>Stairs:</strong></td><td>${data.numStairs}</td></tr>
      <tr><td><strong>Stair Width:</strong></td><td>${data.stairWidth} ft</td><td><strong>Stair Location:</strong></td><td>${data.stairLocation}</td></tr>
      <tr><td><strong>Decking Material:</strong></td><td colspan="3">${data.deckingMaterial}</td></tr>
    </table>
  </div>

  ${["Porch Roof", "Covered Deck", "Roof Over Existing Deck"].some(t => t.toLowerCase().includes(data.projectType)) ? `
  <div class="section">
    <h3>Roof Specifications</h3>
    <table>
      <tr><td><strong>Roof Width:</strong></td><td>${data.roofWidth} ft</td><td><strong>Projection:</strong></td><td>${data.roofProjection} ft</td></tr>
      <tr><td><strong>Roof Height:</strong></td><td>${data.roofHeight} ft</td><td><strong>Pitch:</strong></td><td>${data.roofPitch}</td></tr>
      <tr><td><strong>Overhang:</strong></td><td>${data.overhang} ft</td><td><strong>Support Posts:</strong></td><td>${data.supportPostCount}</td></tr>
      <tr><td><strong>Roofing Material:</strong></td><td colspan="3">${data.roofingMaterial}</td></tr>
      <tr><td><strong>Tied to Existing:</strong></td><td colspan="3">${data.tiedToExisting ? "Yes" : "No"}</td></tr>
    </table>
  </div>
  ` : ''}

  <div class="section">
    <h3>Structural Details</h3>
    <table>
      <tr><td><strong>Footing Count:</strong></td><td>${data.footingCount}</td><td><strong>Material Type:</strong></td><td>${data.materialType}</td></tr>
    </table>
  </div>

  <div class="disclaimer">
    <strong>IMPORTANT DISCLAIMER:</strong><br>
    These drawings are basic permit-support sketches generated from measurement input. They are provided for planning and submission assistance only. Additional engineered or stamped plans may be required depending on your municipality and project type. Always contact your local building department for specific requirements before submission. All work must comply with applicable local building codes.
  </div>

  <div class="notes">
    <strong>General Notes:</strong><br>
    • Dimensions shown are approximate and based on user input<br>
    • Contractor to verify all field conditions<br>
    • Local municipality may require additional structural or engineering review<br>
    • All work to comply with applicable local building code requirements<br>
    • Support post locations and footing depths to be determined per local code
  </div>
</div>

</body>
</html>`;
}