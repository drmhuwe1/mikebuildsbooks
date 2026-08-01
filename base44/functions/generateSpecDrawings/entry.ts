import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { jsPDF } from 'npm:jspdf@4.0.0';

/**
 * generateSpecDrawings
 * Generates a contractor-ready multi-page PDF blueprint for a permit project.
 * Supports: deck, roof, addition, garage, fence, shed.
 * Body: { projectType, data, photoUrl? }  (legacy { bidData, dimensions, photoUrl } still accepted for deck/roof)
 * Returns: application/pdf binary.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const projectType = (body.projectType || body.bidData?.projectType || 'deck').toLowerCase();
    const data = body.data || body.bidData || {};

    // ---- Shared PDF scaffolding ----
    const doc = new jsPDF({ orientation: 'landscape', unit: 'in', format: 'letter' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 0.5;
    let yPos = margin;

    const newPage = () => { doc.addPage('landscape', 'letter'); yPos = margin; };
    const checkSpace = (space) => { if (yPos + space > pageHeight - margin) newPage(); };
    const addTitle = (text, size = 18) => {
      doc.setFontSize(size); doc.setFont('helvetica', 'bold');
      doc.text(String(text || ''), margin, yPos); yPos += size / 72 + 0.2;
    };
    const addSubtitle = (text) => {
      doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.text(String(text || ''), margin, yPos); yPos += 0.25;
    };
    const addText = (text, size = 10, bold = false) => {
      doc.setFontSize(size); doc.setFont('helvetica', bold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(String(text || ''), pageWidth - 2 * margin);
      lines.forEach(line => { checkSpace(size / 72 + 0.05); doc.text(line, margin, yPos); yPos += size / 72 + 0.05; });
    };
    const drawDim = (x1, y1, x2, y2, label, isHorizontal = true) => {
      doc.setLineWidth(0.01); doc.line(x1, y1, x2, y2);
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      if (isHorizontal) doc.text(String(label), mx - 0.3, my - 0.08);
      else doc.text(String(label), mx + 0.1, my);
    };

    const num = (v, dflt = 0) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : dflt;
    };

    // ---- Reference design photo analysis (optional) ----
    if (body.photoUrl) {
      try {
        const analysisResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Analyze this construction design photo. Describe roofing style, siding/materials, structural elements, and architectural style. Return JSON keys: roofStyle, primaryMaterial, structuralElements, architecturalStyle.`,
          file_urls: [body.photoUrl],
          response_json_schema: {
            type: 'object',
            properties: {
              roofStyle: { type: 'string' }, primaryMaterial: { type: 'string' },
              structuralElements: { type: 'string' }, architecturalStyle: { type: 'string' }
            }
          },
          model: 'gemini_3_1_pro'
        });
        if (analysisResult) data._designAnalysis = analysisResult;
      } catch (_e) { /* non-critical */ }
    }

    // ---- Cover sheet (common) ----
    const typeLabel = { deck: 'Deck', roof: 'Roof / Over Deck', addition: 'Room Addition', garage: 'Detached Garage', fence: 'Fence', shed: 'Shed / Accessory' }[projectType] || 'Project';
    addTitle('CONSTRUCTION BLUEPRINTS', 20);
    addTitle(`${typeLabel} — ${data.projectType || projectType}`, 16);
    checkSpace(0.6);
    addText(`Customer: ${data.customerName || '—'}`, 11);
    addText(`Address: ${data.projectAddress || '—'}  ${data.municipality ? '· ' + data.municipality : ''}`, 11);
    addText(`Prepared: ${new Date().toLocaleDateString()}`, 11);
    yPos += 0.2; addSubtitle('SHEET INDEX');
    checkSpace(1.2);
    addText('1. Cover Sheet & Project Information', 10);
    addText('2. Floor / Site Plan with Dimensions', 10);
    addText('3. Elevations', 10);
    addText('4. Foundation / Section Notes', 10);
    addText('5. Material & Hardware Schedule', 10);
    addText('6. General Construction Notes', 10);
    if (data._designAnalysis) {
      yPos += 0.2; addSubtitle('DESIGN ANALYSIS FROM REFERENCE PHOTO');
      checkSpace(1);
      addText(`Architectural Style: ${data._designAnalysis.architecturalStyle || 'N/A'}`, 9);
      addText(`Roof Style: ${data._designAnalysis.roofStyle || 'N/A'}`, 9);
      addText(`Primary Material: ${data._designAnalysis.primaryMaterial || 'N/A'}`, 9);
    }

    // ---- Per-type plan + elevation + section sheets ----
    const drawPlanRect = (wFt, dFt, scale, label) => {
      const px = margin + 0.6, py = yPos + 0.2;
      const w = wFt / scale, d = dFt / scale;
      doc.setDrawColor(0); doc.setLineWidth(0.025);
      doc.rect(px, py, w, d);
      // outer dim lines
      drawDim(px, py + d + 0.4, px + w, py + d + 0.4, `${wFt}'-0"`, true);
      drawDim(px - 0.4, py, px - 0.4, py + d, `${dFt}'-0"`, false);
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text(String(label || ''), px + w / 2 - 1, py + d / 2);
      return { px, py, w, d };
    };

    if (projectType === 'deck' || projectType === 'roof') {
      const w = num(data.deckWidth, 12), d = num(data.deckDepth, 12), h = num(data.deckHeight, 3);
      // Page 2: Floor framing plan
      newPage(); addTitle('FLOOR FRAMING PLAN', 16);
      checkSpace(0.4);
      const fp = drawPlanRect(w, d, 3, 'DECK FRAMING');
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      if (data.isDeckAttached !== false) doc.text('2x10 Ledger (bolts @ 16" O.C.)', fp.px - 0.3, fp.py + fp.d / 2);
      // posts
      const postCount = Math.max(2, Math.round(w / 8));
      for (let i = 1; i < postCount; i++) {
        const xp = fp.px + (i * fp.w / postCount);
        doc.setFillColor(200, 200, 200); doc.rect(xp - 0.08, fp.py - 0.06, 0.16, 0.16, 'FD');
      }
      // joists
      doc.setLineWidth(0.01);
      const joists = Math.max(4, Math.round(d * 12 / 16));
      for (let i = 1; i < joists; i++) {
        const yy = fp.py + (i * fp.d / joists);
        doc.line(fp.px, yy, fp.px + fp.w, yy);
      }
      doc.setFontSize(8); doc.text('2x8 Joists @ 16" O.C.', fp.px + fp.w + 0.1, fp.py + fp.d / 2);
      yPos = fp.py + fp.d + 0.9;
      checkSpace(0.4); addSubtitle('Framing Members');
      addText(`Posts: 4x4 PT, ${postCount + 1} total at ${Math.round(w * 12 / postCount)}" O.C.`, 9);
      addText('Ledger: 2x10 PT bolted to house rim joist (1/2" bolts @ 16" O.C.)', 9);
      addText('Beam: Double 2x8 PT spanning posts', 9);
      addText('Joists: 2x8 PT @ 16" O.C.', 9);
      addText('Decking: 5/4×6 boards, 1/8" gap', 9);
      if (typeof data.numStairs === 'number' && data.numStairs > 0) addText(`Stairs: ${data.numStairs} run(s), ${num(data.stairWidth, 3)}' wide at ${data.stairLocation || 'front'}`, 9);
      if (data.hasRailing) addText('Railing: 36" min height, 4" max spindle gap', 9);

      // Roof framing (if roof) — reuse on same/next page
      if (projectType === 'roof') {
        newPage(); addTitle('ROOF FRAMING PLAN', 16);
        const rw = num(data.roofWidth, w), rd = num(data.roofProjection, d), rh = num(data.roofHeight, 10);
        checkSpace(2.2);
        const rx = margin + 0.8, ry = yPos, sc = 3;
        const dw = rw / sc, dh = rh / sc;
        doc.setLineWidth(0.025);
        doc.line(rx, ry + dh / 2, rx + dw, ry + dh / 2);
        doc.line(rx, ry + dh / 2, rx + dw / 2, ry);
        doc.line(rx + dw / 2, ry, rx + dw, ry + dh / 2);
        doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text(`Gable Roof (${data.roofPitch || '4:12'} Pitch) — ${rw}' × ${rd}'`, rx, ry + dh + 0.2);
        yPos = ry + dh + 0.7;
        addSubtitle('Roof Members');
        addText('Rafters: 2x6 @ 24" O.C.', 9);
        addText('Ridge Board: 1x8', 9);
        addText(`Roofing: ${data.roofingMaterial || 'asphalt shingles'}, class A`, 9);
        addText('Decking: 1/2" CDX plywood, 30# underlayment', 9);
        addText(`Posts: ${data.supportPostCount || 4} 4x4 supporting beam`, 9);
      }
    } else if (projectType === 'addition') {
      const L = num(data.additionLength, 20), W = num(data.additionWidth, 16), H = num(data.ceilingHeight, 9);
      newPage(); addTitle('FLOOR PLAN — ROOM ADDITION', 16);
      checkSpace(2.6);
      const fp = drawPlanRect(L, W, 4, 'ADDITION');
      doc.setFontSize(8);
      doc.text(`Ceiling: ${H}'  ·  Stories: ${data.additionStories || 1}  ·  Foundation: ${data.foundationType || 'slab'}`, fp.px, fp.py + fp.d + 0.55);
      yPos = fp.py + fp.d + 0.9;
      addSubtitle('Wall & Roof Framing');
      addText(`Walls: ${data.wallFraming || 'wood'} studs @ 16" O.C.`, 9);
      addText(`Roof connection: ${data.roofConnectionMethod || 'gable'} to existing structure`, 9);
      addText('Floor: 3/4" T&G plywood on 2x10 joists @ 16" O.C. (per foundation type)', 9);
      addText('Sheathing: 1/2" OSB wall sheathing, house wrap, per code', 9);
      const mep = [data.newHVAC && 'HVAC', data.newElectrical && 'Electrical', data.newPlumbing && 'Plumbing'].filter(Boolean).join(', ');
      addText(`MEP rough-in: ${mep || 'none'}`, 9);
    } else if (projectType === 'garage') {
      const W = num(data.garageWidth, 24), D = num(data.garageDepth, 24), H = num(data.garageHeight, 10);
      const bays = Math.max(1, parseInt(data.garageBays) || 2);
      newPage(); addTitle('FLOOR PLAN — DETACHED GARAGE', 16);
      checkSpace(2.8);
      const fp = drawPlanRect(W, D, 4, 'GARAGE');
      // bay divisions on front wall
      const doorW = (W / bays) - 0.5;
      for (let i = 0; i < bays; i++) {
        const dx = fp.px + (i * fp.w / bays) + (fp.w / bays - doorW / 4) / 2;
        doc.setLineWidth(0.03); doc.line(dx, fp.py, dx + doorW / 4, fp.py);
        doc.setFontSize(7); doc.text(`OH Door ${i + 1}`, dx, fp.py - 0.12);
      }
      doc.setFontSize(8);
      doc.text(`Walls: ${H}'  ·  Bays: ${bays}  ·  Foundation: ${data.foundationType || 'slab'}`, fp.px, fp.py + fp.d + 0.55);
      yPos = fp.py + fp.d + 0.9;
      addSubtitle('Framing & MEP');
      addText(`Walls: 2x4 studs @ 16" O.C., ${H}' tall`, 9);
      addText('Roof: prefab trusses @ 24" O.C., 4:12 min pitch', 9);
      addText('Sheathing: 1/2" OSB, house wrap, siding per spec', 9);
      addText(`Electrical: ${data.garageElectrical ? `Yes, ${data.garagePanelSize || ''}A sub-panel` : 'No'}`, 9);
      addText('Foundation: 6" reinforced slab with thickened edge / footings', 9);
    } else if (projectType === 'fence') {
      const L = num(data.fenceTotalLinearFt, 100), Hh = num(data.fenceHeight, 6);
      newPage(); addTitle('FENCE PLAN & LAYOUT', 16);
      checkSpace(1.6);
      // Linear run with posts
      const lx = margin + 0.4, ly = yPos + 0.4, scale = (pageWidth - 2 * margin - 1) / L;
      doc.setLineWidth(0.03); doc.line(lx, ly, lx + L * scale, ly);
      const postSpacing = 8;
      const postCount = Math.floor(L / postSpacing) - 1;
      for (let i = 1; i <= postCount; i++) {
        const px2 = lx + i * postSpacing * scale;
        doc.setFillColor(120, 120, 120); doc.rect(px2 - 0.06, ly - 0.1, 0.12, 0.2, 'FD');
      }
      doc.setFontSize(8); doc.text(`Total: ${L} LF  ·  Posts @ ${postSpacing}' O.C. (4x4)`, lx, ly - 0.3);
      drawDim(lx, ly + 0.45, lx + L * scale, ly + 0.45, `${L}'-0"`, true);
      yPos = ly + 1.1;
      addSubtitle('Fence Specifications');
      addText(`Type: ${data.fenceType || 'wood_privacy'}  ·  Height: ${Hh}'`, 9);
      addText(`Gates: ${data.numGates || 1} × ${data.gateWidth || 4}' wide`, 9);
      addText('Posts: 4x4 PT set 24-36" deep in concrete, 8\' O.C.', 9);
      addText('Rails: 2x4 PT (2-3 rails), stringers between posts', 9);
      addText('Pickets: attached to rails, 4" max gap (pool code 4")', 9);
      if (data.hasHOA) addText('HOA approval required — verify with association.', 9, true);

      newPage(); addTitle('FENCE ELEVATION', 16);
      checkSpace(2.4);
      const ex = margin + 0.6, ey = yPos, sc = (pageWidth - 2 * margin - 1) / Math.min(24, L);
      doc.setLineWidth(0.025); doc.line(ex, ey + Hh * sc, ex + Math.min(24, L) * sc, ey + Hh * sc); // ground
      doc.line(ex, ey, ex + Math.min(24, L) * sc, ey); // top rail
      doc.line(ex, ey + Hh * sc / 2, ex + Math.min(24, L) * sc, ey + Hh * sc / 2); // bottom rail
      for (let i = 0; i <= Math.min(24, L); i += 8) { doc.setFillColor(120,120,120); doc.rect(ex + i * sc - 0.06, ey - 0.1, 0.12, Hh * sc + 0.2, 'FD'); }
      drawDim(ex - 0.3, ey, ex - 0.3, ey + Hh * sc, `${Hh}'-0"`, false);
      yPos = ey + Hh * sc + 1.2;
    } else if (projectType === 'shed') {
      const W = num(data.shedWidth, 12), D = num(data.shedDepth, 16), Hh = num(data.shedHeight, 10);
      newPage(); addTitle('FLOOR PLAN — SHED / ACCESSORY', 16);
      checkSpace(2.6);
      const fp = drawPlanRect(W, D, 3, 'SHED');
      doc.setFontSize(8);
      doc.text(`Walls: ${Hh}'  ·  Foundation: ${data.shedFoundation || 'concrete_pad'}  ·  Use: ${data.shedUse || 'storage'}`, fp.px, fp.py + fp.d + 0.55);
      yPos = fp.py + fp.d + 0.9;
      addSubtitle('Framing & MEP');
      addText(`Walls: 2x4 studs @ 16" O.C., ${Hh}' walls`, 9);
      addText('Roof: gable trusses or rafters @ 24" O.C., 4:12 min pitch', 9);
      addText(`Foundation: ${data.shedFoundation || 'concrete pad'} ${W * D <= 200 ? '(check permit exemption if < 200 sq ft)' : ''}`, 9);
      addText(`Electrical: ${data.shedElectrical ? 'Yes' : 'No'}`, 9);
      addText(`Footprint: ${W * D} sq ft`, 9);
    }

    // ---- Elevations (common, simplified front elevation) ----
    if (projectType !== 'fence' && projectType !== 'roof') {
      newPage(); addTitle('FRONT ELEVATION', 16);
      const elevDims = {
        deck: { w: num(data.deckWidth, 12), h: num(data.deckHeight, 3) },
        roof: { w: num(data.roofWidth, 12), h: num(data.roofHeight, 10) },
        addition: { w: num(data.additionWidth, 16), h: num(data.ceilingHeight, 9) },
        garage: { w: num(data.garageWidth, 24), h: num(data.garageHeight, 10) },
        shed: { w: num(data.shedWidth, 12), h: num(data.shedHeight, 10) },
      }[projectType] || { w: 12, h: 8 };
      checkSpace(2.4);
      const ex = margin + 0.6, ey = yPos, sc = (pageWidth - 2 * margin - 1.5) / Math.max(elevDims.w, 8);
      const ew = elevDims.w * sc, eh = elevDims.h * sc;
      doc.setDrawColor(0); doc.setLineWidth(0.02);
      doc.line(ex, ey + eh, ex + ew, ey + eh); // ground/grade
      doc.setLineWidth(0.025); doc.rect(ex, ey, ew, eh);
      // simple gable roof hint
      doc.line(ex, ey, ex + ew / 2, ey - 0.4);
      doc.line(ex + ew / 2, ey - 0.4, ex + ew, ey);
      drawDim(ex, ey + eh + 0.35, ex + ew, ey + eh + 0.35, `${elevDims.w}'-0"`, true);
      drawDim(ex - 0.35, ey, ex - 0.35, ey + eh, `${elevDims.h}'-0"`, false);
      if (projectType === 'garage') {
        const bays = Math.max(1, parseInt(data.garageBays) || 2);
        const dw = ew / bays / 2;
        for (let i = 0; i < bays; i++) {
          const dx = ex + (i * ew / bays) + (ew / bays - dw) / 2;
          doc.rect(dx, ey + eh * 0.35, dw, eh * 0.65);
        }
      }
      yPos = ey + eh + 1.0;
      addSubtitle('Elevation Notes');
      addText(`Overall: ${elevDims.w}' W × ${elevDims.h}' H`, 9);
      addText('Verify exterior finishes, openings, and setbacks per local zoning.', 9);
    }

    // ---- Foundation / section notes (common) ----
    newPage(); addTitle('FOUNDATION & SECTION NOTES', 16);
    checkSpace(0.4); addSubtitle('Foundation');
    if (projectType === 'deck') {
      addText('Footings: 12" diameter concrete, 36" min below grade (verify frost line).', 9);
      addText('Posts: 4x4 PT on galvanized adjustable post bases, embed bolts.', 9);
      addText('Ledger: Z-flashing above, 1/2" bolts @ 16" O.C., sealant.', 9);
    } else if (projectType === 'roof') {
      addText('Posts: 4x4 PT on footings, support beam under ridge/rafters.', 9);
      addText('Tie-in: flashing & ice/water shield at existing roof connection.', 9);
      addText('Footings: 12" diameter, 36"+ deep per frost line.', 9);
    } else if (projectType === 'addition') {
      addText(`Foundation: ${data.foundationType || 'slab'} — verify depth vs frost line.`, 9);
      addText('Footings: continuous, reinforced, below frost line.', 9);
      addText('Damp-proofing, drainage, and insulation per energy code.', 9);
    } else if (projectType === 'garage') {
      addText(`Foundation: ${data.foundationType || 'slab'} — 6" reinforced slab, thickened edge.`, 9);
      addText('Footings: below frost line; anchor bolts @ 6\' O.C. for sill plate.', 9);
      addText('Slab slope to door for drainage; vapor barrier under slab.', 9);
    } else if (projectType === 'fence') {
      addText('Post holes: 24-36" deep (6" gravel base), concrete backfill.', 9);
      addText('Setback: verify property line; obtain survey if required.', 9);
      addText('Call 811 (utility locate) before digging post holes.', 9);
    } else if (projectType === 'shed') {
      addText(`Foundation: ${data.shedFoundation || 'concrete pad'} — verify frost requirements.`, 9);
      addText('Floor: skids or slab; anchor against wind uplift.', 9);
      addText('Setbacks: verify against property lines (often 5-10 ft).', 9);
    }
    yPos += 0.2; addSubtitle('Cross-Section Notes');
    addText('Detail continuity through foundation → framing → roof per IRC/RBC.', 9);
    addText('Provide weather barrier, flashing, and sealant at all penetrations.', 9);
    addText('Confirm structural connections (hangers, straps, holdowns) per code.', 9);

    // ---- Material & hardware schedule (common) ----
    newPage(); addTitle('MATERIAL & HARDWARE SCHEDULE', 16);
    checkSpace(0.4);
    const rows = {
      deck: [['Posts','4x4x4\'','PT','—','ea'],['Ledger','2x10','PT','—','ea'],['Joists','2x8','PT','—','ea'],['Decking','5/4x6','Cedar/Composite','—','ea'],['Post Bases','ABA44','Galv','—','ea'],['Joist Hangers','LUS28','Galv','—','ea']],
      roof: [['Posts','4x4','PT','—','ea'],['Beam','2x8 dbl','PT','—','ea'],['Rafters','2x6','DF','—','ea'],['Ridge','1x8','DF','—','ea'],['Decking','1/2" CDX','Plywood','—','sf'],['Shingles','Arch','Asphalt','—','sq']],
      addition: [['Studs','2x4','PT/SPF','—','ea'],['Plates','2x4','PT/SPF','—','ea'],['Joists','2x10','SPF','—','ea'],['Subfloor','3/4" T&G','Plywood','—','sf'],['Sheathing','1/2" OSB','OSB','—','sf'],['Insulation','R-13/19','Fiberglass','—','sf']],
      garage: [['Plates','2x4','PT','—','lf'],['Studs','2x4','SPF','—','ea'],['Trusses','Prefab','—','—','ea'],['Sheathing','1/2" OSB','OSB','—','sf'],['Slab','6"','Concrete','—','sf'],['Anchor Bolts','1/2"x6"','Galv','—','ea']],
      fence: [['Posts','4x4','PT','—','ea'],['Rails','2x4','PT','—','ea'],['Pickets','1x6','PT','—','ea'],['Concrete','60# mix','—','—','bag'],['Gate Hinge','heavy','Galv','—','pr'],['Gate Latch','—','Galv','—','ea']],
      shed: [['Plates','2x4','PT','—','lf'],['Studs','2x4','SPF','—','ea'],['Roof Rafters','2x6','SPF','—','ea'],['Sheathing','1/2" OSB','OSB','—','sf'],['Floor','5/4x6','PT','—','sf'],['Skids/Floor Joist','4x4 / 2x8','PT','—','ea']],
    }[projectType] || [];
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text('Component', margin, yPos); doc.text('Size', margin + 1.8, yPos); doc.text('Material', margin + 3.4, yPos); doc.text('Qty', margin + 6.0, yPos); doc.text('Unit', margin + 6.6, yPos);
    yPos += 0.22; doc.setLineWidth(0.01); doc.line(margin, yPos, pageWidth - margin, yPos); yPos += 0.1;
    doc.setFont('helvetica', 'normal');
    rows.forEach(row => { checkSpace(0.22); doc.setFontSize(8); row.forEach((c, i) => doc.text(String(c), margin + i * 1.6, yPos)); yPos += 0.22; });

    // ---- General construction notes (common) ----
    newPage(); addTitle('GENERAL CONSTRUCTION NOTES', 16);
    const notes = [
      '1. Obtain all required permits before starting work. Schedule inspections at required stages.',
      '2. All PT lumber per manufacturer recommendations; flashing is critical (PT is not waterproof).',
      '3. All fasteners and hardware must be galvanized or stainless steel.',
      '4. Confirm frost depth, setbacks, and zoning requirements with the local building department.',
      '5. Provide proper flashing, weather barrier, and sealant at all penetrations and intersections.',
      '6. Structural connections (hangers, holdowns, straps) must match approved fastening schedules.',
      '7. Verify all field conditions; dimensions are based on user input and are approximate.',
      '8. These are basic permit-support drawings — engineered or stamped plans may be required.',
      '9. Call 811 for utility locates before any excavation.',
      '10. Final inspection required before occupancy; document all permits and inspections.',
    ];
    notes.forEach(n => { checkSpace(0.28); addText(n, 9); });

    // Watermark page
    newPage();
    doc.setFontSize(40); doc.setTextColor(200, 200, 200);
    doc.text('CONTRACTOR READY TO BUILD', pageWidth / 2, pageHeight / 2, { align: 'center' });
    doc.setTextColor(0, 0, 0); doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, pageHeight - 0.5);

    const dataUrl = doc.output('datauristring');
    return Response.json({ dataUrl, filename: `permit-blueprints-${projectType}.pdf` });
  } catch (error) {
    console.error('generateSpecDrawings error:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
}