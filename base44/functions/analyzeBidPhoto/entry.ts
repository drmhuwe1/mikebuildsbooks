import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * analyzeBidPhoto
 * 
 * Accepts: fileUrl, inputMode, dimensions, markup, contingency, crew
 * Returns: Full bid structure with materials, labor, timeline, financials, specs
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { fileUrl, inputMode, dimensions = {}, markup = 20, contingency = 10, crew = [] } = await req.json();
    if (!fileUrl) return Response.json({ error: 'fileUrl required' }, { status: 400 });

    const { width = '10', depth = '8', height = '', notes = '', address = '', projectType = '', deckHeight = '', deckMaterial = '', roofType = '', roofMaterial = '' } = dimensions;
    const crewList = crew.length > 0
      ? crew.map(c => `- ${c.name} (${c.trade}): $${c.rate}/hr, ${c.hours} hours`).join('\n')
      : 'No crew assigned';

    // Calculate crew labor first
    const crewLabor = crew.reduce((sum, c) => sum + (c.rate * c.hours), 0);
    const sqftCalc = Number(width) * Number(depth);
    
    const modeLabel = inputMode === 'blueprint' ? 'PDF blueprint' : 'project photo';
    const addressContext = address ? `\nPROJECT ADDRESS: ${address}\n- Research this location for: local permit requirements, zoning restrictions, mandatory inspections, typical permit fees in this area` : '';
    
    const projectTypeContext = projectType ? `\nPROJECT TYPE: ${projectType.toUpperCase()}
${deckHeight ? `- Deck Height: ${deckHeight} feet` : ''}
${deckMaterial ? `- Deck Material: ${deckMaterial}` : ''}
${roofType ? `- Roof Type: ${roofType}` : ''}
${roofMaterial ? `- Roof Material: ${roofMaterial}` : ''}` : '';
    
    const prompt = `You are an expert construction estimator. Extract material details from this blueprint and generate a COMPLETE bid estimate. Return ONLY valid JSON with no markdown, no explanation, no backticks.

BLUEPRINT DETAILS:
- Dimensions: ${width}' W x ${depth}' D${height ? ` x ${height}' H` : ''} (${sqftCalc} sqft)
- Project: ${projectType?.toUpperCase() || 'DECK'} with ${roofType ? roofType.toUpperCase() + ' ROOF' : 'cover'}
- Specifications: ${notes}
- Crew Assigned: ${crewList}
- Labor Cost from Crew: $${crewLabor}${projectTypeContext}${addressContext}

REQUIREMENTS:
1. CRITICAL: Generate 25+ individual line items in materials array with prices
2. Use ONLY materials from blueprint: pressure-treated lumber, cedar decking, architectural shingles, composite railing, galvanized hardware, concrete (3000 psi)
3. Match blueprint schedule: 3 concrete footings (12"dia x 36"deep), 3x 4x4 posts, 1x ledger 2x10x10', 1x dbl 2x8x10' beam, 7x 2x8x8' joists, 14x joist hangers, 16x 5/4x6x10' cedar decking, 1x ridge 1x8x10', 10x 2x6x7' rafters, 10x rafter ties, 3x collar ties 2x4, 3x 1x6x12' fascia, 2x 1x6x12' soffit, 1x architectural shingle (1 square), 6x 4x4x42" rail posts, 2x 2x4x10' rail tops, 28x balusters, 2x 2x12x5' stairs, 3x 5/4x6x3' treads, 12x 1/2"x4" ledger bolts, 1 roll butyl tape
4. Use 2025 US Home Depot/Lowes pricing - REALISTIC numbers: PT lumber $0.80-1.50/bf, cedar decking $2.50-4/lf, shingles $35-45/sq, hardware $15-50 per item
5. EVERY numeric field MUST be a JavaScript number (not quoted, no dollar signs or units)
6. For EACH line item include: name (string), size (string), material (string), qty (number), unit (string), unitCost (number), totalCost (number)
7. Organize into categories: Concrete/Footings, Framing-Floor, Framing-Roof, Decking, Roofing, Hardware, Railing, Fascia/Soffit, Fasteners/Misc
8. laborBreakdown: ONLY use the 2 assigned crew (Lead Carpenter 64hrs @ $65, Helper 40hrs @ $45) - DO NOT ADD FAKE WORKERS
9. timeline: Show realistic 5-7 day schedule with day numbers, phases, assigned crew names, and tasks
10. paymentSchedule: Deposit 50%, Start of construction 25%, Final 25%
11. buildNotes: Site prep, framing sequence, weather considerations, permits required
12. termsAndConditions: Standard construction contract language
13. additionalFees: Permit and inspection fees (estimated $150-300 for deck permit)

Return exactly this JSON structure (all fields required):
{
  "projectTitle": "string",
  "projectDescription": "string (2-3 sentences describing the project)",
  "scopeOfWork": "string (detailed paragraph on what is included)",
  "structuralSummary": {
    "footprint": "10' x 8'",
    "squareFootage": 80,
    "deckHeight": "3'-6\"",
    "roofType": "Gable",
    "roofPitch": "6:12",
    "totalHeight": "8'-6\"",
    "estimatedDuration": "5-7 days"
  },
  "materials": [
    {
      "category": "Framing",
      "items": [
        {
          "name": "string",
          "size": "string",
          "material": "string",
          "qty": number,
          "unit": "string",
          "unitCost": number,
          "totalCost": number,
          "notes": "string"
        }
      ]
    }
  ],
  "laborBreakdown": [
    {
      "phase": "string",
      "trade": "string",
      "hours": number,
      "rate": number,
      "total": number,
      "assignedTo": "string"
    }
  ],
  "timeline": [
    {
      "day": number,
      "phase": "string",
      "crew": ["string"],
      "tasks": ["string"],
      "hoursPerWorker": number
    }
  ],
  "paymentSchedule": [
    {
      "milestone": "string",
      "description": "string",
      "percentOfTotal": number,
      "amount": number
    }
  ],
  "financials": {
    "materialSubtotal": number,
    "laborSubtotal": number,
    "subtotal": number,
    "markupPct": number,
    "markupAmount": number,
    "contingencyPct": number,
    "contingencyAmount": number,
    "total": number,
    "perSqFt": number
  },
  "buildNotes": ["string"],
  "permitItems": ["string"],
  "riskFlags": ["string"],
  "termsAndConditions": "string (standard construction T&C paragraph)",
  "additionalFees": "string (permit fees, inspection fees, debris removal, etc.)",
  "blueprintSpecs": {
    "foundationType": "12\" dia concrete footings, 36\" deep (3 total)",
    "beamSpec": "Double 2x8 pressure-treated, 10' span",
    "joistSpec": "2x8 pressure-treated @ 16\" OC",
    "rafterSpec": "2x6 Douglas fir @ 24\" OC",
    "deckingSpec": "5/4x6 cedar decking perpendicular to joists",
    "railingSpec": "36\" composite railing with 28 balusters",
    "roofingSpec": "Architectural shingles matching existing house",
    "hardwareNotes": "All fasteners galvanized or stainless steel per code"
  }
}

Use realistic 2025 US Home Depot prices. ALL numbers must be numeric. Do not include any non-numeric characters in numeric fields.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_pro',
      file_urls: [fileUrl],
      response_json_schema: {
        type: 'object',
        properties: {
          projectTitle: { type: 'string' },
          projectDescription: { type: 'string' },
          scopeOfWork: { type: 'string' },
          structuralSummary: { type: 'object' },
          materials: { type: 'array' },
          laborBreakdown: { type: 'array' },
          timeline: { type: 'array' },
          paymentSchedule: { type: 'array' },
          financials: { type: 'object' },
          buildNotes: { type: 'array' },
          permitItems: { type: 'array' },
          riskFlags: { type: 'array' },
          termsAndConditions: { type: 'string' },
          additionalFees: { type: 'string' },
          blueprintSpecs: { type: 'object' },
        },
      },
    });

    // Sanitize materials data - handle both object items and array formats
    if (result.materials && Array.isArray(result.materials)) {
      result.materials = result.materials.filter(cat => cat && typeof cat === 'object' && cat.category).map(cat => {
        // If items is array of arrays, rebuild into proper objects
        if (cat.items && Array.isArray(cat.items) && cat.items.length === 0 && (cat.qty || cat.unitCost)) {
          const rebuilt = [];
          const names = cat.name || [];
          const sizes = cat.size || [];
          const materials = cat.material || [];
          const qtys = cat.qty || [];
          const units = cat.unit || [];
          const costs = cat.unitCost || [];
          const notes = cat.notes || [];
          
          for (let i = 0; i < (qtys.length || names.length || 0); i++) {
            rebuilt.push({
              name: String(names[i] || names || ''),
              size: String(sizes[i] || ''),
              material: String(materials[i] || ''),
              qty: Number(qtys[i]) || 0,
              unit: String(units[i] || 'ea'),
              unitCost: Number(costs[i]) || 0,
              totalCost: (Number(qtys[i]) || 0) * (Number(costs[i]) || 0),
              notes: String(notes[i] || '')
            });
          }
          return { ...cat, items: rebuilt };
        }
        
        // Otherwise normalize existing items
        if (cat.items && Array.isArray(cat.items)) {
          cat.items = cat.items.filter(item => item && typeof item === 'object' && !Array.isArray(item)).map(item => ({
            name: String(item.name || ''),
            size: String(item.size || ''),
            material: String(item.material || ''),
            qty: Number(item.qty) || 0,
            unit: String(item.unit || 'ea'),
            unitCost: Number(item.unitCost) || 0,
            totalCost: (Number(item.qty) || 0) * (Number(item.unitCost) || 0),
            notes: String(item.notes || '')
          }));
        } else {
          cat.items = [];
        }
        return cat;
      });
    }

    // Calculate material subtotal from actual line items
    const ms = result.materials?.reduce((sum, cat) => 
      sum + (cat.items?.reduce((itemSum, item) => itemSum + (Number(item.totalCost) || 0), 0) || 0), 0) || 0;
    
    // Use ONLY assigned crew labor (not AI-generated fake employees)
    const ls = crewLabor;
    
    const sqft = Number(result.structuralSummary?.squareFootage) || (Number(width) * Number(depth)) || 80;
    const sub = ms + ls;
    const mkA = Math.round(sub * markup / 100);
    const ctA = Math.round(sub * contingency / 100);
    const total = sub + mkA + ctA;

    // Fixed financials - ONLY use actual crew labor, not mock data
    result.financials = {
      materialSubtotal: Math.round(ms),
      laborSubtotal: Math.round(ls),
      subtotal: Math.round(sub),
      markupPct: markup,
      markupAmount: mkA,
      contingencyPct: contingency,
      contingencyAmount: ctA,
      total: Math.round(total),
      perSqFt: sqft > 0 ? Math.round(total / sqft) : 0,
    };
    
    // Override labor breakdown to use ONLY assigned crew, discard AI-generated employees
    result.laborBreakdown = crew.map(c => ({
      phase: 'Project Work',
      trade: c.trade,
      hours: c.hours,
      rate: c.rate,
      total: c.rate * c.hours,
      assignedTo: c.name,
    }));
    
    // Ensure structural summary has square footage
    result.structuralSummary = {
      ...result.structuralSummary,
      squareFootage: sqft,
      footprint: `${width}' x ${depth}'`,
    };

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('analyzeBidPhoto:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});