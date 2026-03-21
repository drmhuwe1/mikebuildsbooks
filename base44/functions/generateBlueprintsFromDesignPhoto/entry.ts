import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { jsPDF } from 'npm:jspdf@4.0.0';

/**
 * generateBlueprintsFromDesignPhoto
 * Analyzes a design photo and generates professional working blueprints
 * Output: Multi-page PDF with floor plans, elevations, sections, framing details
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { photoUrl, width = 8, depth = 10, designNotes = '' } = await req.json();
    if (!photoUrl) return Response.json({ error: 'photoUrl required' }, { status: 400 });

    // Step 1: Analyze design photo with AI
    const designAnalysisPrompt = `Analyze this design photo of a covered deck with gable roof. Extract design specifications:

DIMENSIONS: ${width}' W x ${depth}' D
DESIGN FEATURES TO IDENTIFY:
1. Gable roof pitch and style (steep, moderate, etc.)
2. Deck height from ground
3. Railing style (balusters, horizontal rails, composite vs wood)
4. Roof covering (shingles, metal, etc.)
5. Posts/columns (style, spacing, materials)
6. Steps/stairs (number, style, width)
7. Ceiling details (open or soffit, ventilation)
8. Color scheme and exterior materials
9. Decorative elements (trim, brackets, etc.)
10. Overall coverage and overhang

Return JSON with design specifications:
{
  "deckHeight": "feet",
  "roofPitch": "X:12 format",
  "roofCovering": "material",
  "postStyle": "description",
  "postSpacing": "feet",
  "railingType": "balusters/horizontal/cable",
  "railingMaterial": "wood/composite/metal",
  "stairCount": number,
  "stairWidth": "feet",
  "ceilingType": "open/soffit",
  "colorScheme": "description",
  "overallStyle": "description",
  "specialFeatures": ["feature1", "feature2"],
  "recommendations": "construction recommendations"
}`;

    const designAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: designAnalysisPrompt,
      file_urls: [photoUrl],
      model: 'gemini_3_pro',
      response_json_schema: {
        type: 'object',
        properties: {
          deckHeight: { type: 'string' },
          roofPitch: { type: 'string' },
          roofCovering: { type: 'string' },
          postStyle: { type: 'string' },
          postSpacing: { type: 'string' },
          railingType: { type: 'string' },
          railingMaterial: { type: 'string' },
          stairCount: { type: 'number' },
          stairWidth: { type: 'string' },
          ceilingType: { type: 'string' },
          colorScheme: { type: 'string' },
          overallStyle: { type: 'string' },
          specialFeatures: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'string' },
        },
      },
    });

    // Step 2: Create technical blueprints
    const doc = new jsPDF({ orientation: 'landscape', unit: 'in', format: 'tabloid' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    let y = 0.5;

    // Title block
    const titleBoxX = pageW - 4;
    const titleBoxY = pageH - 1.5;
    doc.setDrawColor(0);
    doc.rect(titleBoxX, titleBoxY, 3.5, 1.3);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('CONSTRUCTION BLUEPRINTS', titleBoxX + 0.15, titleBoxY + 0.25);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text(`${width}' × ${depth}' Deck w/ Gable Roof`, titleBoxX + 0.15, titleBoxY + 0.45);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, titleBoxX + 0.15, titleBoxY + 0.65);
    doc.text('Scale: 1/4" = 1\'', titleBoxX + 0.15, titleBoxY + 0.85);
    doc.text('Sheet 1 of 4', titleBoxX + 0.15, titleBoxY + 1.05);

    // PAGE 1: FLOOR PLAN
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('FLOOR PLAN', 0.5, y);
    y += 0.4;

    const scale = 0.35; // 1/4" = 1'
    const planW = width * scale;
    const planD = depth * scale;
    const planX = 0.75;
    const planY = y;

    // Draw deck outline
    doc.setLineWidth(0.03);
    doc.rect(planX, planY, planW, planD);

    // Draw ledger
    doc.setLineWidth(0.02);
    doc.line(planX, planY, planX + planW, planY);
    doc.setFontSize(7);
    doc.text('HOUSE', planX + planW / 2 - 0.3, planY - 0.15);

    // Draw joists (2x8 @ 16" OC)
    const joistCount = Math.floor(depth / 1.33) - 1;
    const joistSpacing = planD / (joistCount + 1);
    doc.setLineWidth(0.01);
    for (let i = 1; i <= joistCount; i++) {
      doc.line(planX, planY + i * joistSpacing, planX + planW, planY + i * joistSpacing);
    }

    // Draw posts
    doc.setLineWidth(0.02);
    const postOffsets = [0.3, planW - 0.3];
    postOffsets.forEach(offset => {
      doc.circle(planX + offset, planY + planD - 0.3, 0.15);
      doc.circle(planX + offset, planY + planD - 0.3, 0.15, 'F');
    });

    // Add dimensions
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    
    // Width dimension
    doc.line(planX - 0.15, planY - 0.4, planX + planW + 0.15, planY - 0.4);
    doc.line(planX - 0.15, planY - 0.35, planX - 0.15, planY - 0.45);
    doc.line(planX + planW + 0.15, planY - 0.35, planX + planW + 0.15, planY - 0.45);
    doc.text(`${width}'`, planX + planW / 2 - 0.2, planY - 0.55);

    // Depth dimension
    doc.line(planX - 0.4, planY, planX - 0.4, planY + planD);
    doc.line(planX - 0.35, planY, planX - 0.45, planY);
    doc.line(planX - 0.35, planY + planD, planX - 0.45, planY + planD);
    doc.text(`${depth}'`, planX - 0.65, planY + planD / 2);

    // Material callouts
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.text('2x8 Joists @ 16" OC', planX + planW + 0.3, planY + 0.3);
    doc.text('4x4 Posts', planX + planW + 0.3, planY + planD - 0.4);
    doc.text('2x10 Ledger w/ Flashing', planX + 0.2, planY - 0.8);

    // PAGE 2: ELEVATIONS
    doc.addPage('landscape', 'tabloid');
    y = 0.5;

    // Title block
    doc.setDrawColor(0);
    doc.rect(pageW - 4, pageH - 1.5, 3.5, 1.3);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('ELEVATION VIEWS', pageW - 3.85, pageH - 1.25);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('Sheet 2 of 4', pageW - 3.85, pageH - 0.55);

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('FRONT ELEVATION', 0.5, y);
    y += 0.35;

    const elevScale = 0.3;
    const deckH = parseFloat(designAnalysis.deckHeight || '3.5');
    const roofPitch = designAnalysis.roofPitch || '6:12';
    const roofRise = (parseFloat(roofPitch.split(':')[0]) / 12) * width;
    const totalH = deckH + roofRise;

    const elevX = 1;
    const elevY = y;
    const elevW = width * elevScale;
    const elevH = totalH * elevScale;

    // Ground line
    doc.setLineWidth(0.02);
    doc.line(elevX, elevY + elevH, elevX + elevW, elevY + elevH);
    
    // Deck platform
    const deckLineY = elevY + elevH - (deckH * elevScale);
    doc.line(elevX, deckLineY, elevX + elevW, deckLineY);
    
    // Posts
    const postW = 0.2;
    doc.rect(elevX + 0.3, deckLineY, postW, deckH * elevScale);
    doc.rect(elevX + elevW - 0.5, deckLineY, postW, deckH * elevScale);
    
    // Roof - gable
    const roofX = elevX + elevW / 2;
    const roofTopY = elevY + elevH - (totalH * elevScale);
    doc.line(elevX, deckLineY, roofX, roofTopY);
    doc.line(roofX, roofTopY, elevX + elevW, deckLineY);
    
    // Railing
    doc.setLineWidth(0.01);
    for (let i = 0; i < 8; i++) {
      const x = elevX + 0.3 + (i * (elevW - 0.6) / 7);
      doc.line(x, deckLineY, x, deckLineY - 0.25);
    }
    
    // Dimensions
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text(`${width}'`, elevX + elevW / 2 - 0.15, elevY + elevH + 0.25);
    doc.text(`${deckH}'`, elevX - 0.35, deckLineY + (deckH * elevScale) / 2);
    doc.text(`Pitch ${roofPitch}`, roofX - 0.35, roofTopY - 0.2);

    // SIDE ELEVATION
    y = elevY + elevH + 1.2;
    doc.setFont(undefined, 'bold');
    doc.text('SIDE ELEVATION', 0.5, y);
    y += 0.35;

    const sideX = 1;
    const sideY = y;
    const sideW = depth * elevScale;

    // Ground
    doc.line(sideX, sideY + elevH, sideX + sideW, sideY + elevH);
    // Deck platform
    doc.line(sideX, deckLineY, sideX + sideW, deckLineY);
    // Post
    doc.rect(sideX + 0.3, deckLineY, 0.2, deckH * elevScale);
    // Roof
    doc.line(sideX, deckLineY, sideX + sideW / 2, sideY + elevH - (totalH * elevScale));
    doc.line(sideX + sideW / 2, sideY + elevH - (totalH * elevScale), sideX + sideW, deckLineY);

    // Dimension
    doc.setFontSize(8);
    doc.text(`${depth}'`, sideX + sideW / 2 - 0.15, sideY + elevH + 0.25);

    // PAGE 3: SECTIONS & DETAILS
    doc.addPage('landscape', 'tabloid');
    y = 0.5;

    // Title block
    doc.setDrawColor(0);
    doc.rect(pageW - 4, pageH - 1.5, 3.5, 1.3);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('SECTIONS & DETAILS', pageW - 3.85, pageH - 1.25);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('Sheet 3 of 4', pageW - 3.85, pageH - 0.55);

    // Cross-section detail
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('CROSS-SECTION (Looking from House)', 0.5, y);
    y += 0.35;

    const xsectX = 0.75;
    const xsectY = y;

    // Ground
    doc.setLineWidth(0.02);
    doc.line(xsectX, xsectY + 1.5, xsectX + 3, xsectY + 1.5);
    
    // Foundation
    doc.rect(xsectX + 0.3, xsectY + 1.3, 0.3, 0.2, 'F');
    doc.rect(xsectX + 2.4, xsectY + 1.3, 0.3, 0.2, 'F');
    
    // Posts and beam
    doc.rect(xsectX + 0.4, xsectY + 0.9, 0.15, 0.4);
    doc.rect(xsectX + 2.5, xsectY + 0.9, 0.15, 0.4);
    doc.rect(xsectX + 0.35, xsectY + 0.9, 2.3, 0.15);
    
    // Deck platform
    doc.setLineWidth(0.015);
    doc.line(xsectX + 0.3, xsectY + 0.9, xsectX + 2.7, xsectY + 0.9);
    
    // Joists
    for (let i = 1; i < 5; i++) {
      doc.line(xsectX + 0.3 + (i * 0.6), xsectY + 0.85, xsectX + 0.3 + (i * 0.6), xsectY + 0.9);
    }
    
    // Roof section (right side)
    const roofSecX = xsectX + 3.5;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('ROOF DETAIL', roofSecX, xsectY);
    
    doc.setFontSize(8);
    doc.setLineWidth(0.02);
    doc.line(roofSecX + 0.3, xsectY + 0.6, roofSecX + 1.2, xsectY + 0.3);
    doc.line(roofSecX + 1.2, xsectY + 0.3, roofSecX + 2.1, xsectY + 0.6);
    
    // Shingles pattern
    doc.setLineWidth(0.01);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const x = roofSecX + 0.35 + (col * 0.4);
        const ry = xsectY + 0.4 + (row * 0.08);
        doc.line(x, ry, x + 0.35, ry);
      }
    }
    
    doc.setFont(undefined, 'normal');
    doc.text('Architectural Shingles', roofSecX + 0.3, xsectY + 1);
    doc.text('Roof Sheathing', roofSecX + 0.3, xsectY + 1.2);
    doc.text('Rafter', roofSecX + 0.8, xsectY + 0.15);

    // PAGE 4: MATERIAL SCHEDULE & NOTES
    doc.addPage('landscape', 'tabloid');
    y = 0.5;

    // Title block
    doc.setDrawColor(0);
    doc.rect(pageW - 4, pageH - 1.5, 3.5, 1.3);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('SPECIFICATIONS', pageW - 3.85, pageH - 1.25);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('Sheet 4 of 4', pageW - 3.85, pageH - 0.55);

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('MATERIAL SCHEDULE', 0.5, y);
    y += 0.35;

    const materials = [
      ['ITEM', 'QUANTITY', 'SIZE', 'MATERIAL', 'NOTES'],
      ['Foundation/Footings', '3', '12" dia x 36" deep', 'Concrete', 'Per frost line'],
      ['Posts', '3', '4x4', 'Pressure Treated', '12 ft centers'],
      ['Ledger Board', '1', '2x10', 'Pressure Treated', 'House attachment w/ flashing'],
      ['Main Beam', '1', '2x8 double', 'Pressure Treated', 'Built-up beam'],
      ['Floor Joists', '7', '2x8', 'Pressure Treated', '16" on center'],
      ['Decking', '32', '5/4x6', designAnalysis.railingMaterial === 'composite' ? 'Composite' : 'Cedar', 'Staggered pattern'],
      ['Rafters', '10', '2x6', 'Douglas Fir', '24" on center'],
      ['Roof Sheathing', '1', '7/16"', 'OSB', '8ft x 4ft sheets'],
      ['Roofing', '1 sq', 'Architectural Shingles', designAnalysis.roofCovering, 'Match house'],
      ['Railing', '28', '1.5"x1.5"', designAnalysis.railingMaterial, 'Code spacing'],
    ];

    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    let tableY = y + 0.1;
    
    materials.forEach((row, idx) => {
      if (idx === 0) {
        row.forEach((cell, col) => {
          doc.text(cell, 0.5 + (col * 1.5), tableY);
        });
        doc.line(0.5, tableY + 0.15, 7.5, tableY + 0.15);
        tableY += 0.25;
      } else {
        doc.setFont(undefined, 'normal');
        row.forEach((cell, col) => {
          doc.text(String(cell), 0.5 + (col * 1.5), tableY);
        });
        tableY += 0.2;
      }
    });

    // General notes
    y = tableY + 0.3;
    doc.setFont(undefined, 'bold');
    doc.text('GENERAL NOTES', 0.5, y);
    y += 0.25;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    const notes = [
      '1. All work shall be performed in accordance with local building codes and zoning ordinances.',
      '2. Contractor is responsible for obtaining all necessary permits and scheduling inspections.',
      '3. All dimensions are to finished surfaces unless otherwise noted.',
      '4. All framing lumber shall be pressure-treated or naturally decay-resistant where exposed.',
      '5. All fasteners shall be galvanized or stainless steel to prevent corrosion.',
      `6. Design specifications based on ${width}' × ${depth}' footprint with ${roofPitch} gable roof.`,
      `7. Deck height: ${deckH}' from grade. Railing: ${designAnalysis.railingType} style ${designAnalysis.railingMaterial}.`,
      `8. Roof covering: ${designAnalysis.roofCovering}. Ceiling type: ${designAnalysis.ceilingType}.`,
      '9. All work must comply with IRC building codes for decks and roof structures.',
      '10. Site-specific conditions (frost line, soil bearing, wind load) may require modifications.'
    ];

    notes.forEach(note => {
      const lines = doc.splitTextToSize(note, 7.5);
      lines.forEach(line => {
        doc.text(line, 0.5, y);
        y += 0.15;
      });
    });

    // Convert to blob
    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="blueprints.pdf"'
      }
    });
  } catch (error) {
    console.error('generateBlueprintsFromDesignPhoto:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});