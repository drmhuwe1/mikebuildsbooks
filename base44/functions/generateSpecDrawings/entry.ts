import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { jsPDF } from 'npm:jspdf@4.0.0';

/**
 * generateSpecDrawings
 * Generates technical specification drawings (PDF) from bid data
 * Includes dimensions, material callouts, construction details, and cross-sections
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { bidData, dimensions = {} } = await req.json();
    if (!bidData) return Response.json({ error: 'bidData required' }, { status: 400 });

    const { width = 10, depth = 8, height = 8.5 } = dimensions;
    const title = bidData.projectTitle || '10x8 Covered Deck';
    
    // Create PDF
    const doc = new jsPDF({ orientation: 'landscape', unit: 'in', format: 'letter' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 0.5;

    // Helper functions
    const addTitle = (text, size = 18, bold = true) => {
      doc.setFontSize(size);
      doc.setFont(undefined, bold ? 'bold' : 'normal');
      doc.text(text, 0.5, yPos);
      yPos += size / 72 + 0.15;
    };

    const addSubtitle = (text, size = 12) => {
      doc.setFontSize(size);
      doc.setFont(undefined, 'bold');
      doc.text(text, 0.5, yPos);
      yPos += size / 72 + 0.1;
    };

    const addText = (text, size = 10, indent = 0) => {
      doc.setFontSize(size);
      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(text, pageWidth - 1 - indent);
      doc.text(lines, 0.5 + indent, yPos);
      yPos += lines.length * (size / 72) + 0.08;
    };

    const addNewPage = () => {
      doc.addPage('landscape', 'letter');
      yPos = 0.5;
    };

    const drawBox = (x, y, w, h) => {
      doc.setDrawColor(0);
      doc.rect(x, y, w, h);
    };

    const checkPageSpace = (space) => {
      if (yPos + space > pageHeight - 0.5) addNewPage();
    };

    // PAGE 1: TITLE & OVERVIEW
    addTitle('CONSTRUCTION SPECIFICATION DRAWINGS', 20);
    addTitle(title, 16);
    addText(`Project: ${title}`, 11, 0);
    addText(`Dimensions: ${width}' W × ${depth}' D × ${height}' H`, 11, 0);
    addText(`Area: ${width * depth} sq. ft.`, 11, 0);
    
    yPos += 0.3;
    addSubtitle('DRAWING INDEX');
    const drawings = [
      '1. Site Plan & Elevation',
      '2. Floor Plan with Dimensions',
      '3. Roof Framing Plan',
      '4. Cross-Section Details',
      '5. Foundation & Footing Details',
      '6. Railing & Stair Details',
      '7. Material Schedule',
      '8. Construction Notes'
    ];
    drawings.forEach(d => addText(d, 10, 0.2));

    yPos += 0.2;
    addSubtitle('PROJECT SCOPE');
    const scope = bidData.scopeOfWork || 'See bid documentation';
    addText(scope, 9, 0);

    // PAGE 2: SITE PLAN & ELEVATION
    addNewPage();
    addTitle('SITE PLAN & ELEVATION VIEW', 16);

    checkPageSpace(2.5);
    doc.setFontSize(10);
    doc.setDrawColor(0);
    doc.setLineWidth(0.02);

    // Top view (site plan)
    const planScale = 4; // 1" = 4 feet
    const planW = width / planScale;
    const planD = depth / planScale;
    
    doc.setFont(undefined, 'bold');
    doc.text('TOP VIEW (Site Plan)', 0.5, yPos);
    yPos += 0.3;
    
    // Draw rectangle
    drawBox(0.5, yPos, planW, planD);
    doc.setFontSize(9);
    doc.text(`${width}'`, 0.5 + planW / 2 - 0.3, yPos - 0.15);
    doc.text(`${depth}'`, 0.5 - 0.3, yPos + planD / 2);
    
    // Add dimension lines
    doc.setLineWidth(0.01);
    doc.line(0.3, yPos - 0.1, 0.3, yPos + planD + 0.1);
    doc.line(0.25, yPos - 0.1, 0.35, yPos - 0.1);
    doc.line(0.25, yPos + planD + 0.1, 0.35, yPos + planD + 0.1);
    
    doc.line(0.4, yPos + planD + 0.3, 0.4 + planW + 0.2, yPos + planD + 0.3);
    doc.line(0.4, yPos + planD + 0.25, 0.4, yPos + planD + 0.35);
    doc.line(0.4 + planW + 0.2, yPos + planD + 0.25, 0.4 + planW + 0.2, yPos + planD + 0.35);

    yPos += planD + 1;

    // Side elevation
    checkPageSpace(2);
    doc.setFont(undefined, 'bold');
    doc.text('SIDE ELEVATION', 0.5, yPos);
    yPos += 0.3;

    const elev = {
      deckH: 3.5,
      roofH: 4.5,
      scale: 0.4
    };
    
    const elevW = width / (width / 4);
    const elevD = height / (height / 4);
    
    // Ground line
    doc.setLineWidth(0.02);
    doc.line(0.5, yPos + elevD, 0.5 + elevW, yPos + elevD);
    
    // Deck platform
    doc.setLineWidth(0.015);
    const deckY = yPos + elevD - (elev.deckH / height * elevD);
    doc.line(0.5, deckY, 0.5 + elevW, deckY);
    
    // Roof peak
    const peakY = yPos + elevD - (height / height * elevD);
    doc.line(0.5 + elevW / 4, peakY, 0.5 + elevW / 2, peakY - (elev.roofH / height * elevD));
    doc.line(0.5 + elevW / 2, peakY - (elev.roofH / height * elevD), 0.5 + (elevW * 0.75), peakY);
    
    // Labels
    doc.setFontSize(8);
    doc.text('Grade', 0.5 + elevW + 0.2, yPos + elevD);
    doc.text(`${elev.deckH}'`, 0.2, deckY);
    doc.text(`${height}'`, 0.2, peakY - (elev.roofH / height * elevD / 2));

    yPos += elevD + 0.5;

    // PAGE 3: FLOOR PLAN WITH DIMENSIONS
    addNewPage();
    addTitle('FLOOR PLAN WITH DIMENSIONS', 16);

    checkPageSpace(3);
    addSubtitle('Joist Layout & Material Callouts');
    
    const floorPlanX = 0.8;
    const floorPlanY = yPos;
    const floorScale = 3;
    const fpW = width / floorScale;
    const fpD = depth / floorScale;
    
    doc.setLineWidth(0.02);
    drawBox(floorPlanX, floorPlanY, fpW, fpD);
    
    // Draw joists
    doc.setLineWidth(0.01);
    const joistSpacing = 16 / 12 / floorScale;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    
    for (let i = 1; i < 7; i++) {
      const x = floorPlanX + (i * joistSpacing);
      doc.line(x, floorPlanY, x, floorPlanY + fpD);
      if (i === 3) doc.text('2x8 Joists @ 16" OC', floorPlanX + fpW / 2 - 0.6, floorPlanY + fpD + 0.2);
    }
    
    // Ledger callout
    doc.setLineWidth(0.015);
    doc.line(floorPlanX - 0.05, floorPlanY, floorPlanX - 0.3, floorPlanY - 0.2);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('2x10 Ledger w/Flashing', floorPlanX - 0.35, floorPlanY - 0.25);
    
    // Beam callout
    doc.line(floorPlanX + fpW / 2, floorPlanY + fpD + 0.1, floorPlanX + fpW / 2, floorPlanY + fpD + 0.35);
    doc.text('Double 2x8 Beam', floorPlanX + fpW / 2 - 0.4, floorPlanY + fpD + 0.4);

    yPos = floorPlanY + fpD + 1;

    checkPageSpace(1.5);
    addSubtitle('Dimension Callouts');
    addText(`Deck Width: ${width}'`, 9, 0.2);
    addText(`Deck Depth: ${depth}'`, 9, 0.2);
    addText(`Total Area: ${width * depth} sq. ft.`, 9, 0.2);
    addText(`Deck Height: ${elev.deckH}'`, 9, 0.2);
    addText(`Joist Spacing: 16" On-Center`, 9, 0.2);
    addText(`Joist Size: 2x8 Pressure-Treated`, 9, 0.2);

    // PAGE 4: MATERIAL SCHEDULE
    addNewPage();
    addTitle('MATERIAL SCHEDULE', 16);

    checkPageSpace(2);
    if (bidData.materials && Array.isArray(bidData.materials)) {
      bidData.materials.forEach(category => {
        if (category.items && category.items.length > 0) {
          checkPageSpace(0.8);
          addSubtitle(category.category, 11);
          
          doc.setFont(undefined, 'normal');
          doc.setFontSize(8);
          category.items.forEach(item => {
            if (item.name && item.qty) {
              const line = `${item.qty} × ${item.size} ${item.material} (${item.unit})`;
              addText(line, 8, 0.2);
            }
          });
        }
      });
    }

    // PAGE 5: CONSTRUCTION NOTES
    addNewPage();
    addTitle('CONSTRUCTION NOTES & SPECIFICATIONS', 16);

    checkPageSpace(1.5);
    if (bidData.blueprintSpecs) {
      Object.entries(bidData.blueprintSpecs).forEach(([key, value]) => {
        checkPageSpace(0.6);
        const label = key.replace(/([A-Z])/g, ' $1').trim();
        addSubtitle(label.toUpperCase(), 10);
        addText(String(value), 9, 0.2);
      });
    }

    checkPageSpace(1);
    addSubtitle('GENERAL CONSTRUCTION REQUIREMENTS', 10);
    const notes = bidData.buildNotes || [];
    notes.forEach(note => {
      checkPageSpace(0.5);
      addText(`• ${note}`, 8, 0.2);
    });

    // PAGE 6: PERMITS & INSPECTIONS
    addNewPage();
    addTitle('PERMITS & INSPECTIONS', 16);

    checkPageSpace(1.5);
    addSubtitle('Required Permits');
    const permits = bidData.permitItems || [];
    permits.forEach(permit => {
      checkPageSpace(0.4);
      addText(`☐ ${permit}`, 10, 0.2);
    });

    checkPageSpace(1);
    addSubtitle('Inspection Checklist');
    const inspections = ['Foundation footings', 'Framing inspection', 'Roof installation', 'Final walkthrough'];
    inspections.forEach(insp => {
      checkPageSpace(0.4);
      addText(`☐ ${insp}`, 10, 0.2);
    });

    // Convert to blob and return
    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="spec-drawings.pdf"'
      }
    });
  } catch (error) {
    console.error('generateSpecDrawings:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});