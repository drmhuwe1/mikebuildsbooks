export function generatePermitPacketPDF(data, company, includedSections) {
  const sections = {
    cover: generateCoverPage(data, company),
    projectInfo: generateProjectInfo(data, company),
    drawings: generateDrawingsPage(data),
    dimensions: generateDimensions(data),
    materials: generateMaterials(data),
    footings: generateFootings(data),
    stairs: generateStairs(data),
    roof: generateRoof(data),
    checklist: generateChecklist(data),
    signature: generateSignaturePage(data),
    attachments: generateAttachmentsList(),
  };

  let pageNumber = 1;
  let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Permit Packet - ${data.projectAddress}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: letter; margin: 0.75in; }
  body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #333; }
  .page { page-break-after: always; padding: 0.75in; min-height: 9in; display: flex; flex-direction: column; }
  .page:last-of-type { page-break-after: avoid; }
  .page-header { text-align: center; margin-bottom: 0.5in; border-bottom: 2px solid #000; padding-bottom: 0.25in; }
  .page-header h1 { font-size: 18pt; margin-bottom: 5px; }
  .page-header p { font-size: 9pt; color: #666; }
  .page-footer { text-align: center; font-size: 9pt; color: #999; margin-top: auto; border-top: 1px solid #ccc; padding-top: 0.25in; }
  h1 { font-size: 20pt; margin-bottom: 0.3in; }
  h2 { font-size: 14pt; margin-top: 0.2in; margin-bottom: 0.15in; color: #1a1a1a; border-bottom: 1px solid #ddd; padding-bottom: 0.05in; }
  h3 { font-size: 12pt; margin-top: 0.15in; margin-bottom: 0.1in; color: #333; }
  p { margin: 0.1in 0; }
  .section { margin-bottom: 0.3in; }
  table { width: 100%; border-collapse: collapse; margin: 0.1in 0; font-size: 10pt; }
  td, th { border: 1px solid #999; padding: 0.1in; text-align: left; }
  th { background-color: #f0f0f0; font-weight: bold; }
  .drawing-box { border: 1px solid #000; margin: 0.1in 0; padding: 0.1in; text-align: center; min-height: 2in; }
  .checklist-item { margin: 0.08in 0; display: flex; align-items: center; }
  .checklist-box { width: 0.15in; height: 0.15in; border: 1px solid #000; margin-right: 0.1in; }
  .disclaimer { background-color: #fff3cd; border: 1px solid #ffc107; padding: 0.15in; margin: 0.2in 0; font-size: 9pt; line-height: 1.4; }
  .bold { font-weight: bold; }
  .italic { font-style: italic; }
  .centered { text-align: center; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0.2in; }
  .signature-line { border-bottom: 1px solid #000; width: 2in; display: inline-block; margin: 0 0.2in; }
  @media print { body { margin: 0; padding: 0; } }
</style>
</head>
<body>`;

  // Add selected sections
  includedSections.forEach((sectionId) => {
    if (sections[sectionId]) {
      html += sections[sectionId];
      pageNumber++;
    }
  });

  html += `
</body>
</html>`;

  return html;
}

function generateCoverPage(data, company) {
  return `
<div class="page">
  <div class="page-header">
    <h1>PERMIT PACKET</h1>
    <p>Deck & Roof Construction Project</p>
  </div>

  <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
    <h2 style="border: none; font-size: 24pt; margin: 0.2in 0;">${data.projectAddress || "Project Address"}</h2>
    <p style="margin: 0.1in 0; font-size: 12pt;">${data.customerName || "Customer Name"}</p>
    <p style="margin: 0.3in 0; color: #666;">${data.projectType} Construction</p>
    
    <div style="margin-top: 0.5in; font-size: 10pt;">
      <p><strong>Municipality:</strong> ${data.municipality || "Not specified"}</p>
      <p><strong>County:</strong> ${data.county || "Not specified"}</p>
      <p><strong>Date Prepared:</strong> ${new Date().toLocaleDateString()}</p>
    </div>

    ${company.company_name ? `<p style="margin-top: 0.5in; font-size: 10pt;"><strong>Prepared by:</strong><br>${company.company_name}${company.company_phone ? '<br>' + company.company_phone : ''}</p>` : ''}
  </div>

  <div class="page-footer">
    <p>Page 1 of X</p>
  </div>
</div>`;
}

function generateProjectInfo(data, company) {
  return `
<div class="page">
  <h1>Project Information</h1>

  <div class="section">
    <h2>Project Details</h2>
    <table>
      <tr>
        <td style="width: 30%;"><strong>Customer Name:</strong></td>
        <td>${data.customerName || "—"}</td>
      </tr>
      <tr>
        <td><strong>Project Address:</strong></td>
        <td>${data.projectAddress || "—"}</td>
      </tr>
      <tr>
        <td><strong>Municipality:</strong></td>
        <td>${data.municipality || "—"}</td>
      </tr>
      <tr>
        <td><strong>County:</strong></td>
        <td>${data.county || "—"}</td>
      </tr>
      <tr>
        <td><strong>Project Type:</strong></td>
        <td>${data.projectType || "—"}</td>
      </tr>
      <tr>
        <td><strong>Date Prepared:</strong></td>
        <td>${new Date().toLocaleDateString()}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>Contractor Information</h2>
    <table>
      <tr>
        <td style="width: 30%;"><strong>Company:</strong></td>
        <td>${company.company_name || "—"}</td>
      </tr>
      <tr>
        <td><strong>Contact:</strong></td>
        <td>${company.company_phone || "—"}</td>
      </tr>
      <tr>
        <td><strong>Email:</strong></td>
        <td>${company.company_email || "—"}</td>
      </tr>
      <tr>
        <td><strong>Owner:</strong></td>
        <td>${company.owner_name || "—"}</td>
      </tr>
    </table>
  </div>

  <div class="disclaimer">
    <strong>PERMIT-SUPPORT DOCUMENTATION</strong><br>
    This packet contains basic permit-support drawings and specifications assembled from project measurement inputs. Additional municipality-specific forms, professional engineering review, or stamped drawings may be required. Always verify specific requirements with your local building department before submission.
  </div>
</div>`;
}

function generateDrawingsPage(data) {
  return `
<div class="page">
  <h1>Permit Drawings</h1>

  <div class="section">
    <h2>Top View</h2>
    <div class="drawing-box">
      <p style="color: #999; padding: 0.5in; font-size: 10pt;">
        [Deck/Roof Plan - Not to Scale]<br>
        ${data.deckWidth || "?"} ft × ${data.deckDepth || "?"} ft
      </p>
    </div>
  </div>

  <div class="section">
    <h2>Side Elevation</h2>
    <div class="drawing-box">
      <p style="color: #999; padding: 0.5in; font-size: 10pt;">
        [Elevation View - Not to Scale]<br>
        Height: ${data.deckHeight || "?"} ft
      </p>
    </div>
  </div>

  <div style="margin-top: 0.3in; font-size: 9pt; color: #666;">
    <p><strong>Note:</strong> Detailed CAD drawings may be required by your municipality.</p>
  </div>
</div>`;
}

function generateDimensions(data) {
  return `
<div class="page">
  <h1>Dimension Details</h1>

  <div class="section">
    <h2>${data.projectType} Dimensions</h2>
    <table>
      <tr>
        <th>Dimension</th>
        <th>Value</th>
      </tr>
      ${data.deckWidth ? `<tr><td>Width</td><td>${data.deckWidth} feet</td></tr>` : ''}
      ${data.deckDepth ? `<tr><td>Depth</td><td>${data.deckDepth} feet</td></tr>` : ''}
      ${data.deckHeight ? `<tr><td>Height Off Ground</td><td>${data.deckHeight} feet</td></tr>` : ''}
      ${data.roofWidth ? `<tr><td>Roof Width</td><td>${data.roofWidth} feet</td></tr>` : ''}
      ${data.roofProjection ? `<tr><td>Roof Projection</td><td>${data.roofProjection} feet</td></tr>` : ''}
      ${data.roofPitch ? `<tr><td>Roof Pitch</td><td>${data.roofPitch}</td></tr>` : ''}
      ${data.overhang ? `<tr><td>Overhang</td><td>${data.overhang} feet</td></tr>` : ''}
    </table>
  </div>

  <div class="section">
    <h2>Notes</h2>
    <ul>
      <li>All dimensions shown are approximate based on project measurement inputs.</li>
      <li>Contractor to verify all field conditions before construction.</li>
      <li>Local municipality may require additional structural verification.</li>
    </ul>
  </div>
</div>`;
}

function generateMaterials(data) {
  return `
<div class="page">
  <h1>Materials & Framing Notes</h1>

  <div class="section">
    ${data.deckingMaterial ? `
    <h2>Decking Material</h2>
    <p>${data.deckingMaterial}</p>
    ` : ''}

    ${data.roofingMaterial ? `
    <h2>Roofing Material</h2>
    <p>${data.roofingMaterial}</p>
    ` : ''}

    ${data.materialType ? `
    <h2>Support Material</h2>
    <p>${data.materialType}</p>
    ` : ''}
  </div>

  <div class="section">
    <h2>General Notes</h2>
    <ul>
      <li>All materials must comply with local building code requirements.</li>
      <li>Structural framing to be inspected by building official.</li>
      <li>All connections and fasteners per applicable code standards.</li>
    </ul>
  </div>
</div>`;
}

function generateFootings(data) {
  return `
<div class="page">
  <h1>Footing & Support Details</h1>

  <div class="section">
    <h2>Support Structure</h2>
    <table>
      <tr>
        <th>Item</th>
        <th>Specification</th>
      </tr>
      ${data.footingCount ? `<tr><td>Footing Count</td><td>${data.footingCount}</td></tr>` : ''}
      ${data.supportPostCount ? `<tr><td>Support Posts</td><td>${data.supportPostCount}</td></tr>` : ''}
      ${data.materialType ? `<tr><td>Material Type</td><td>${data.materialType}</td></tr>` : ''}
    </table>
  </div>

  <div class="section">
    <h2>Important Requirements</h2>
    <ul>
      <li>Footing depth to be determined per local building code.</li>
      <li>Frost line depth: Verify with local building department.</li>
      <li>All footings must extend below frost line in your area.</li>
      <li>Support posts must be set on proper footings and secure.</li>
    </ul>
  </div>
</div>`;
}

function generateStairs(data) {
  return `
<div class="page">
  <h1>Stair & Railing Notes</h1>

  <div class="section">
    <h2>Stair Specifications</h2>
    ${data.numStairs ? `
    <table>
      <tr>
        <th>Item</th>
        <th>Value</th>
      </tr>
      <tr><td>Number of Stairs</td><td>${data.numStairs}</td></tr>
      ${data.stairWidth ? `<tr><td>Stair Width</td><td>${data.stairWidth} feet</td></tr>` : ''}
      ${data.stairLocation ? `<tr><td>Location</td><td>${data.stairLocation}</td></tr>` : ''}
    </table>
    ` : '<p>No stairs specified for this project.</p>'}
  </div>

  <div class="section">
    <h2>Railing Requirements</h2>
    ${data.hasRailing ? `
    <ul>
      <li>Railing required for deck height over 30 inches.</li>
      <li>Railing height: 36-42 inches above deck surface.</li>
      <li>Baluster spacing: No more than 4 inches (sphere rule).</li>
      <li>Railing must support 200 lbs horizontal load.</li>
    </ul>
    ` : '<p>Railing requirements may vary by local code for lower platforms.</p>'}
  </div>
</div>`;
}

function generateRoof(data) {
  return `
<div class="page">
  <h1>Roof Specifications</h1>

  <div class="section">
    <h2>Roof Details</h2>
    ${data.roofWidth || data.roofPitch ? `
    <table>
      <tr>
        <th>Item</th>
        <th>Value</th>
      </tr>
      ${data.roofWidth ? `<tr><td>Roof Width</td><td>${data.roofWidth} feet</td></tr>` : ''}
      ${data.roofPitch ? `<tr><td>Roof Pitch</td><td>${data.roofPitch}</td></tr>` : ''}
      ${data.overhang ? `<tr><td>Overhang</td><td>${data.overhang} feet</td></tr>` : ''}
      ${data.tiedToExisting ? `<tr><td>Tied to Existing Structure</td><td>${data.tiedToExisting ? 'Yes' : 'No'}</td></tr>` : ''}
    </table>
    ` : '<p>Roof specifications to be confirmed with local building department.</p>'}
  </div>

  <div class="section">
    <h2>Roof Tie-In Notes</h2>
    ${data.tiedToExisting ? `
    <ul>
      <li>Roof must be properly tied into existing structure.</li>
      <li>Flashing and waterproofing at tie-in points.</li>
      <li>All connections per applicable building code.</li>
    </ul>
    ` : '<p>This structure does not tie into existing building.</p>'}
  </div>
</div>`;
}

function generateChecklist(data) {
  return `
<div class="page">
  <h1>Permit Packet Checklist</h1>

  <div class="section">
    <h2>Included in This Packet</h2>
    <div class="checklist-item"><div class="checklist-box">✓</div> Cover Page</div>
    <div class="checklist-item"><div class="checklist-box">✓</div> Project Information</div>
    <div class="checklist-item"><div class="checklist-box">✓</div> Permit Drawings (Top View & Elevation)</div>
    <div class="checklist-item"><div class="checklist-box">✓</div> Dimension Details</div>
    <div class="checklist-item"><div class="checklist-box">✓</div> Materials & Framing Notes</div>
    <div class="checklist-item"><div class="checklist-box">✓</div> Support & Footing Details</div>
  </div>

  <div class="section">
    <h2>Typical Additional Requirements</h2>
    <p style="font-size: 10pt;">Contact your local building department to verify what additional documents may be needed:</p>
    <div class="checklist-item"><div class="checklist-box"></div> Completed permit application forms</div>
    <div class="checklist-item"><div class="checklist-box"></div> Property survey or site plan</div>
    <div class="checklist-item"><div class="checklist-box"></div> Proof of property ownership</div>
    <div class="checklist-item"><div class="checklist-box"></div> Homeowner's liability insurance certificate</div>
    <div class="checklist-item"><div class="checklist-box"></div> Professional engineering drawings (if required)</div>
    <div class="checklist-item"><div class="checklist-box"></div> Structural calculations (if required)</div>
    <div class="checklist-item"><div class="checklist-box"></div> Zoning compliance letter</div>
    <div class="checklist-item"><div class="checklist-box"></div> Setback verification</div>
  </div>

  <div class="disclaimer" style="margin-top: 0.3in;">
    <strong>IMPORTANT:</strong> This is a basic permit-support packet. Additional municipality-specific forms, professional engineering review, or stamped drawings may be required. Contact your local building/permit office for complete requirements.
  </div>
</div>`;
}

function generateSignaturePage(data) {
  return `
<div class="page">
  <h1>Signature Page</h1>

  <div style="margin-top: 1in;">
    <p style="margin-bottom: 0.5in;">
      I certify that the information and dimensions provided in this permit packet are accurate to the best of my knowledge, and that the proposed construction will comply with applicable local building codes and regulations.
    </p>

    <div style="margin-top: 0.7in;">
      <p><strong>Contractor/Builder:</strong></p>
      <p style="margin-top: 0.4in;">Signature: <span class="signature-line"></span></p>
      <p style="margin-top: 0.3in;">Printed Name: <span class="signature-line"></span></p>
      <p style="margin-top: 0.3in;">Date: <span class="signature-line"></span></p>
    </div>

    <div style="margin-top: 0.7in;">
      <p><strong>Property Owner/Applicant:</strong></p>
      <p style="margin-top: 0.4in;">Signature: <span class="signature-line"></span></p>
      <p style="margin-top: 0.3in;">Printed Name: <span class="signature-line"></span></p>
      <p style="margin-top: 0.3in;">Date: <span class="signature-line"></span></p>
    </div>
  </div>
</div>`;
}

function generateAttachmentsList() {
  return `
<div class="page">
  <h1>Attachments & References</h1>

  <div class="section">
    <h2>Included Files</h2>
    <ul>
      <li>Permit Packet - Permit-support documentation (this file)</li>
      <li>Permit Drawing Sketches - Deck/Roof layout and elevation</li>
    </ul>
  </div>

  <div class="section">
    <h2>Additional Documents to Provide</h2>
    <ul>
      <li>Completed municipal permit application forms</li>
      <li>Property survey or site plan showing setbacks</li>
      <li>Proof of property ownership</li>
      <li>Homeowner's liability insurance documentation</li>
      <li>Professional engineering drawings (if required by your municipality)</li>
      <li>Structural calculations (if required by your municipality)</li>
    </ul>
  </div>

  <div class="section">
    <h2>Contact Your Local Building Department</h2>
    <p style="font-size: 10pt;">
      Before submitting your application, contact your local building/permit office to:
    </p>
    <ul style="font-size: 10pt;">
      <li>Confirm all required documents and forms</li>
      <li>Verify footing depth requirements for your area</li>
      <li>Determine if professional stamped drawings are required</li>
      <li>Ask about inspection scheduling and requirements</li>
      <li>Confirm any additional local regulations or restrictions</li>
    </ul>
  </div>

  <div class="disclaimer">
    <strong>DISCLAIMER:</strong> This permit packet is provided for informational purposes to assist with permit application preparation. It is not a substitute for professional engineering or architectural services. All work must comply with applicable building codes and local regulations. Always consult with the building official for specific requirements.
  </div>
</div>`;
}