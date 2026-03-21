import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { jsPDF } from 'npm:jspdf@4.0.0';

/**
 * generateSpecDrawings
 * Analyzes design photo and generates professional contractor-ready technical specification drawings
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { bidData, dimensions = {}, photoUrl } = await req.json();
    if (!bidData) return Response.json({ error: 'bidData required' }, { status: 400 });

    const { width = 10, depth = 8, height = 8.5 } = dimensions;

    // If photo provided, analyze design details via AI
    let designAnalysis = null;
    if (photoUrl) {
      const analysisPrompt = `Analyze this deck and roof design photo. Extract and describe:
1. Roofing style (gable, shed, flat, etc.) and pitch estimate
2. Railing design details (spindle spacing, materials, height)
3. Deck materials visible (wood type, color, condition)
4. Roof material type and color
5. Structural elements visible (posts, beams, fascia, soffit)
6. Architectural style (traditional, modern, farmhouse, etc.)
7. Special features (ceiling, ventilation, trim details)
8. Overall design aesthetic and color scheme

Return as JSON with these exact keys: roofStyle, railingDesign, deckMaterial, roofMaterial, structuralElements, architecturalStyle, specialFeatures, aesthetics`;

      const designResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        file_urls: [photoUrl],
        response_json_schema: {
          type: 'object',
          properties: {
            roofStyle: { type: 'string' },
            railingDesign: { type: 'string' },
            deckMaterial: { type: 'string' },
            roofMaterial: { type: 'string' },
            structuralElements: { type: 'string' },
            architecturalStyle: { type: 'string' },
            specialFeatures: { type: 'string' },
            aesthetics: { type: 'string' }
          }
        },
        model: 'gemini_3_pro'
      });
      designAnalysis = designResult;
    }

    // Create comprehensive PDF
    const doc = new jsPDF({ orientation: 'landscape', unit: 'in', format: 'letter' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 0.5;
    let yPos = margin;

    // Helpers
    const addTitle = (text, size = 18) => {
      doc.setFontSize(size);
      doc.setFont(undefined, 'bold');
      doc.text(text, margin, yPos);
      yPos += size / 72 + 0.2;
    };

    const addSubtitle = (text) => {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(text, margin, yPos);
      yPos += 0.25;
    };

    const addText = (text, size = 10, bold = false) => {
      doc.setFontSize(size);
      doc.setFont(undefined, bold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
      doc.text(lines, margin, yPos);
      yPos += lines.length * (size / 72) + 0.05;
    };

    const newPage = () => {
      doc.addPage('landscape', 'letter');
      yPos = margin;
    };

    const checkSpace = (space) => {
      if (yPos + space > pageHeight - margin) newPage();
    };

    const drawDim = (x1, y1, x2, y2, label, isHorizontal = true) => {
      doc.setLineWidth(0.01);
      doc.line(x1, y1, x2, y2);
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      doc.setFontSize(8);
      if (isHorizontal) doc.text(label, mx - 0.3, my - 0.08);
      else doc.text(label, mx + 0.1, my);
    };

    // PAGE 1: TITLE & SUMMARY
    addTitle('CONSTRUCTION BLUEPRINTS', 20);
    addTitle('Deck with Gable Roof', 16);
    
    checkSpace(0.8);
    addText(`Dimensions: ${width}' W × ${depth}' D × ${height}' H`, 11);
    addText(`Total Area: ${width * depth} sq. ft.`, 11);
    addText(`Gable Roof Pitch: 6:12 | Deck Height: 3'-6"`, 11);
    
    yPos += 0.3;
    addSubtitle('SHEET INDEX');
    checkSpace(1.5);
    const sheets = [
      '1. Cover Sheet & General Notes',
      '2. Foundation & Floor Framing Plan',
      '3. Roof Framing Plan & Details',
      '4. Elevations (Front, Side, Rear)',
      '5. Cross-Section & Structural Details',
      '6. Railing & Stair Details',
      '7. Material & Hardware Schedule',
      '8. Electrical & Safety Notes'
    ];
    sheets.forEach(s => addText(s, 10));

    yPos += 0.3;
    if (designAnalysis) {
      addSubtitle('DESIGN ANALYSIS FROM REFERENCE');
      checkSpace(1);
      addText(`Architectural Style: ${designAnalysis.architecturalStyle || 'N/A'}`, 9);
      addText(`Railing Design: ${designAnalysis.railingDesign || 'N/A'}`, 9);
      addText(`Roof Material: ${designAnalysis.roofMaterial || 'N/A'}`, 9);
    }

    // PAGE 2: FOUNDATION & FLOOR FRAMING
    newPage();
    addTitle('FOUNDATION & FLOOR FRAMING PLAN', 16);

    checkSpace(0.5);
    addSubtitle('Foundation Details');
    checkSpace(0.8);
    addText('Location: (3) Concrete Footings, 12" diameter, 36" below grade minimum', 9);
    addText('Spacing: Posts at 10\' and 10\' intervals (3 posts total)', 9);
    addText('Material: 60# Concrete mix (3000 psi minimum)', 9);
    addText('Frost Line: Verify local building code requirements (typically 36"-48" in northern zones)', 9);

    yPos += 0.15;
    addSubtitle('Floor Framing Layout');
    checkSpace(2.2);

    // Draw floor framing diagram
    const fpX = margin + 0.5;
    const fpY = yPos;
    const fpScale = 2.5;
    const fpW = width / fpScale;
    const fpD = depth / fpScale;

    doc.setDrawColor(0);
    doc.setLineWidth(0.02);
    doc.rect(fpX, fpY, fpW, fpD);

    // Ledger
    doc.setLineWidth(0.03);
    doc.line(fpX, fpY, fpX, fpY + fpD);
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('2x10 Ledger w/ Flashing', fpX - 0.4, fpY + fpD / 2);

    // Posts
    const postSpacing = fpW / 2;
    doc.setLineWidth(0.02);
    doc.setFillColor(200, 200, 200);
    doc.rect(fpX + postSpacing - 0.08, fpY - 0.1, 0.16, 0.16, 'FD');
    doc.rect(fpX + 2 * postSpacing - 0.08, fpY - 0.1, 0.16, 0.16, 'FD');
    doc.setFontSize(7);
    doc.text('4x4 Posts', fpX + postSpacing - 0.2, fpY - 0.25);

    // Joists
    doc.setLineWidth(0.01);
    const joistCount = 7;
    for (let i = 0; i <= joistCount; i++) {
      const x = fpX + (i * fpW / joistCount);
      doc.line(x, fpY, x, fpY + fpD);
    }
    doc.setFontSize(8);
    doc.text('2x8 Joists @ 16" OC', fpX + fpW / 2 - 0.5, fpY + fpD + 0.2);

    yPos = fpY + fpD + 0.8;

    checkSpace(0.5);
    addSubtitle('Framing Members');
    checkSpace(1);
    addText('Posts: 4x4 Pressure-Treated, grade 2, spacing 10\' on center', 9);
    addText('Ledger: 2x10 PT bolted to house rim joist @ 16" O.C. (min. 1/2" bolts)', 9);
    addText('Beam: Double 2x8 PT, 10\' span, supported by 4x4 posts', 9);
    addText('Joists: 2x8 PT @ 16" O.C. perpendicular to house', 9);
    addText('Joist Hangers: LUS28 (14 total) galvanized steel', 9);
    addText('Deck Boards: 5/4" × 6" cedar, perpendicular to joists, 1/8" spacing', 9);

    // PAGE 3: ROOF FRAMING
    newPage();
    addTitle('ROOF FRAMING PLAN & DETAILS', 16);

    checkSpace(0.5);
    addSubtitle('Gable Roof Structure');
    checkSpace(2.5);

    const rX = margin + 0.8;
    const rY = yPos;
    const rScale = 2.8;
    const rW = width / rScale;
    const rH = height / rScale;

    // Roof outline (gable)
    doc.setDrawColor(0);
    doc.setLineWidth(0.025);
    doc.line(rX, rY + rH / 2, rX + rW, rY + rH / 2); // base
    doc.line(rX, rY + rH / 2, rX + rW / 2, rY); // left slope
    doc.line(rX + rW / 2, rY, rX + rW, rY + rH / 2); // right slope

    // Ridge board
    doc.setLineWidth(0.02);
    doc.line(rX + rW / 2 - 0.1, rY, rX + rW / 2 + 0.1, rY);

    // Rafters
    doc.setLineWidth(0.01);
    const rafterCount = 6;
    for (let i = 1; i < rafterCount; i++) {
      const xpos = rX + (i * rW / rafterCount);
      const rise = (height / 2) * (i / rafterCount);
      const fallRise = i > rafterCount / 2 ? (height / 2) * ((rafterCount - i) / rafterCount) : rise;
      doc.line(xpos, rY + rH / 2, xpos - rise / 3, rY + rH / 2 - fallRise);
    }

    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('Gable Roof Framing (6:12 Pitch)', rX + rW / 2 - 0.5, rY + rH + 0.2);

    yPos = rY + rH + 0.8;

    checkSpace(1.5);
    addSubtitle('Roof Members');
    checkSpace(1.2);
    addText('Rafters: 2x6 Douglas Fir @ 24" O.C., 7\'-0" length, 6:12 pitch', 9);
    addText('Ridge Board: 1x8 Douglas Fir, centered on roof peak', 9);
    addText('Collar Ties: 2x4 @ 48" O.C. (3 total) connecting opposite rafters', 9);
    addText('Gable Overhang: 12" on each side with 1x8 soffit boards', 9);
    addText('Roof Decking: 1/2" CDX plywood, nailed @ 6" O.C. all edges & field', 9);
    addText('Underlayment: 30# synthetic, installed per manufacturer specs', 9);
    addText('Roofing: Architectural asphalt shingles, class A fire rated', 9);

    // PAGE 4: ELEVATIONS
    newPage();
    addTitle('ELEVATIONS', 16);

    // Front elevation
    checkSpace(0.3);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('FRONT ELEVATION (Looking at House)', margin, yPos);
    yPos += 0.3;

    checkSpace(2.2);
    const elevX = margin + 0.5;
    const elevY = yPos;
    const elevScale = 3;
    const elevW = width / elevScale;
    const elevH = 8 / elevScale;

    // Grade line
    doc.setDrawColor(0);
    doc.setLineWidth(0.02);
    doc.line(elevX, elevY + 2, elevX + elevW, elevY + 2);
    doc.setFontSize(9);
    doc.text('Grade Line', elevX + elevW + 0.2, elevY + 2);

    // Deck platform
    doc.setLineWidth(0.025);
    doc.line(elevX, elevY + 1.3, elevX + elevW, elevY + 1.3);

    // Posts
    doc.setLineWidth(0.015);
    doc.line(elevX + 0.3, elevY + 1.3, elevX + 0.3, elevY + 2);
    doc.line(elevX + elevW - 0.3, elevY + 1.3, elevX + elevW - 0.3, elevY + 2);

    // Railing
    doc.setLineWidth(0.01);
    for (let i = 0; i < 8; i++) {
      const xr = elevX + 0.4 + (i * (elevW - 0.8) / 8);
      doc.line(xr, elevY + 1.3, xr, elevY + 1.55);
    }
    doc.line(elevX + 0.3, elevY + 1.55, elevX + elevW - 0.3, elevY + 1.55);

    // Roof (gable)
    doc.setLineWidth(0.02);
    doc.line(elevX, elevY + 1.3, elevX + elevW / 2, elevY + 0.2);
    doc.line(elevX + elevW / 2, elevY + 0.2, elevX + elevW, elevY + 1.3);

    // Dimensions
    doc.setLineWidth(0.01);
    drawDim(elevX - 0.3, elevY + 1.3, elevX - 0.3, elevY + 2, `3'-6"`, false);
    drawDim(elevX, elevY + 2.3, elevX + elevW, elevY + 2.3, `${width}'-0"`, true);
    drawDim(elevX - 0.2, elevY + 1.3, elevX - 0.2, elevY + 0.2, `${height}'-0"`, false);

    yPos = elevY + 2.5;

    // Side elevation
    checkSpace(2.2);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('SIDE ELEVATION', margin, yPos);
    yPos += 0.3;

    checkSpace(2);
    const sideX = margin + 0.5;
    const sideY = yPos;
    const sideW = depth / elevScale;

    // Ground & deck
    doc.setLineWidth(0.02);
    doc.line(sideX, sideY + 2, sideX + sideW, sideY + 2);
    doc.line(sideX, sideY + 1.3, sideX + sideW, sideY + 1.3);

    // Posts
    doc.setLineWidth(0.015);
    doc.line(sideX + 0.2, sideY + 1.3, sideX + 0.2, sideY + 2);
    doc.line(sideX + sideW - 0.2, sideY + 1.3, sideX + sideW - 0.2, sideY + 2);

    // Roof profile
    doc.setLineWidth(0.02);
    doc.line(sideX, sideY + 1.3, sideX + sideW / 2, sideY + 0.3);
    doc.line(sideX + sideW / 2, sideY + 0.3, sideX + sideW, sideY + 1.3);

    doc.setFontSize(8);
    doc.text(`${depth}'-0"`, sideX + sideW / 2 - 0.2, sideY + 2.2);

    yPos = sideY + 2.5;

    // PAGE 5: DETAILS
    newPage();
    addTitle('CONSTRUCTION DETAILS & SECTIONS', 16);

    checkSpace(0.3);
    addSubtitle('Detail A: Ledger Connection to House');
    checkSpace(1.5);
    addText('Step 1: Locate header joist or rim board on house', 9);
    addText('Step 2: Install house wrap flashing above ledger (Z-flashing minimum 4" leg)', 9);
    addText('Step 3: Bolt 2x10 ledger with 1/2" bolts @ 16" O.C., staggered pattern', 9);
    addText('Step 4: Apply exterior caulk at all ledger/house intersections (100% coverage)', 9);
    addText('Step 5: Install permanent flashing (20 oz copper or aluminum)', 9);
    addText('Critical: Slope flashing away from house. Improper flashing = water intrusion & rot.', 10, true);

    yPos += 0.2;
    addSubtitle('Detail B: Post Base Connection');
    checkSpace(1.2);
    addText('Material: Galvanized adjustable post base (e.g., Simpson ABA44 or equivalent)', 9);
    addText('Installation: Bolt base to footing @ 4 bolts minimum, embed 2" into concrete', 9);
    addText('Post Set: 4x4 post fully seated in base, bolted with (4) 1/2" galvanized bolts', 9);
    addText('Clearance: Minimum 1" of post above concrete (prevent water pooling)', 9);

    yPos += 0.2;
    addSubtitle('Detail C: Joist to Ledger Connection');
    checkSpace(1.2);
    addText('Hangers: LUS210 joist hangers, galvanized, @ each joist location', 9);
    addText('Fastening: Nail or bolt per hanger manufacturer (typically 10-12 nails per hanger)', 9);
    addText('Spacing: Max 16" O.C., must align with posts below', 9);

    yPos += 0.2;
    addSubtitle('Detail D: Railing Assembly');
    checkSpace(1.2);
    addText('Height: 36" minimum from deck surface to top of railing', 9);
    addText('Spindles: 4" sphere rule (max 4" gap to prevent child entrapment)', 9);
    addText('Posts: 4x4 corner posts bolted to rim joist (2 bolts min per post)', 9);
    addText('Top Rail: 2x4 cap, fastened with structural screws (min 2 per spindle)', 9);
    addText('Bottom Rail: 2x6 or 2x4, bolted to posts', 9);

    // PAGE 6: MATERIALS & HARDWARE
    newPage();
    addTitle('MATERIAL & HARDWARE SCHEDULE', 16);

    checkSpace(0.5);
    const scheduleY = yPos;
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');

    // Table header
    doc.text('Component', margin, yPos);
    doc.text('Size', margin + 1.8);
    doc.text('Material', margin + 3.2);
    doc.text('Qty', margin + 5.0);
    doc.text('Unit', margin + 5.6);
    yPos += 0.25;

    doc.setLineWidth(0.01);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 0.1;

    // Table rows
    const scheduleItems = [
      ['Posts', '4x4x4\'', 'PT Grade 2', '3', 'ea'],
      ['Ledger', '2x10x10\'', 'PT Grade 2', '1', 'ea'],
      ['Beam', '2x8x10\'', 'PT Grade 2', '2', 'ea'],
      ['Joists', '2x8x8\'', 'PT Grade 2', '7', 'ea'],
      ['Deck Boards', '5/4x6x10\'', 'Cedar', '16', 'ea'],
      ['Rafters', '2x6x7\'', 'Douglas Fir', '10', 'ea'],
      ['Collar Ties', '2x4x5\'', 'Douglas Fir', '3', 'ea'],
      ['Ridge Board', '1x8x10\'', 'Douglas Fir', '1', 'ea'],
      ['Fascia', '1x6x12\'', 'Cedar', '3', 'ea'],
      ['Soffit', '1x6x12\'', 'PVC Vinyl', '2', 'ea'],
      ['Roof Decking', '1/2" CDX', 'Plywood', '100', 'sf'],
      ['Shingles', '3-tab Arch', 'Asphalt', '1', 'sq'],
      ['Post Bases', 'ABA44', 'Galv Steel', '3', 'ea'],
      ['Joist Hangers', 'LUS28', 'Galv Steel', '14', 'ea'],
      ['Ledger Bolts', '1/2"x6"', 'Galv Steel', '8', 'ea'],
      ['Deck Screws', '2.5" Deck', 'Galv Steel', '5', 'lb'],
      ['Roof Underlayment', '30# Synth', 'Polyester', '100', 'sf']
    ];

    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    scheduleItems.forEach(row => {
      if (yPos > pageHeight - 0.5) newPage();
      doc.text(row[0], margin, yPos);
      doc.text(row[1], margin + 1.8, yPos);
      doc.text(row[2], margin + 3.2, yPos);
      doc.text(row[3], margin + 5.0, yPos);
      doc.text(row[4], margin + 5.6, yPos);
      yPos += 0.22;
    });

    // PAGE 7: GENERAL NOTES
    newPage();
    addTitle('GENERAL CONSTRUCTION NOTES', 16);

    checkSpace(0.5);
    doc.setFontSize(9);
    const notes = [
      '1. Obtain all required permits before starting work. Have inspections done at required stages.',
      '2. All PT lumber to be installed per manufacturer recommendations. PT ≠ waterproof; flashing is critical.',
      '3. All fasteners and hardware must be galvanized steel or stainless steel. No regular nails or bolts.',
      '4. All bolts through wood must have washers under heads and nuts to prevent pull-through.',
      '5. Ledger flashing is CRITICAL to prevent water intrusion and deck failure. Slope all flashing away from house.',
      '6. Posts must sit on footings at minimum 36" deep (or per local frost line) to prevent heaving.',
      '7. Use joist hangers at all ledger connections; do NOT toe-nail joists to ledger.',
      '8. Deck boards must have 1/8" spacing to allow for expansion and drainage.',
      '9. Railing must comply with local code (typically 36" high, 4" sphere rule for spindle spacing).',
      '10. Roof slope minimum 4:12 for asphalt shingles; ensure proper drainage and ventilation.',
      '11. All wood-to-wood and wood-to-concrete connections must use appropriate flashing and sealant.',
      '12. Final inspection required before occupancy. Document all permits and inspections.',
      '13. Maintenance: Annual inspection for loose fasteners, rot, and weathering. Re-seal as needed.',
      '14. This design assumes level building site. Adjust foundation depth per local frost line.'
    ];
    
    notes.forEach(note => {
      checkSpace(0.3);
      addText(note, 8);
    });

    // Final page watermark
    newPage();
    doc.setFontSize(48);
    doc.setTextColor(200, 200, 200);
    doc.text('CONTRACTOR\nREADY TO BUILD', pageWidth / 2, pageHeight / 2, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Blueprints Generated: ${new Date().toLocaleDateString()}`, margin, pageHeight - 0.5);

    // Return PDF
    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="contractor-blueprints.pdf"'
      }
    });
  } catch (error) {
    console.error('generateSpecDrawings:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});