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
1. Generate detailed material schedule based on the blueprint specifications provided
2. Use ONLY materials specified in the blueprint (pressure-treated lumber, cedar decking, architectural shingles, composite railing, galvanized hardware, concrete footings)
3. Match the quantities and specifications from the blueprint material schedule
4. Use 2025 US Home Depot pricing for all materials
5. ALL numeric values MUST be numbers (not strings, no letters)
6. Include 25+ realistic line items with actual Home Depot SKU-equivalent pricing
7. For each item: qty (number), unit (string), unitCost (number), totalCost = qty × unitCost
8. Include separate categories: Framing, Roofing, Decking, Hardware, Fasteners, Concrete/Footings, Fascia/Soffit, Railing
9. Timeline should show 5-7 day phased construction schedule
10. buildNotes should include construction sequencing, site prep, and safety considerations
11. permitItems should list typical deck permit requirements
12. riskFlags for weather delays, material availability, structural concerns

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

    // Sanitize materials data - ensure all numeric values are numbers and valid structure
    if (result.materials && Array.isArray(result.materials)) {
      result.materials = result.materials.filter(cat => cat && typeof cat === 'object' && cat.category && Array.isArray(cat.items));
      result.materials.forEach(cat => {
        if (cat.items && Array.isArray(cat.items)) {
          cat.items = cat.items.filter(item => item && typeof item === 'object' && item.name && !Array.isArray(item));
          cat.items.forEach(item => {
            item.qty = Number(item.qty) || 0;
            item.unitCost = Number(item.unitCost) || 0;
            item.totalCost = Number(item.qty) * Number(item.unitCost);
            item.size = String(item.size || '');
            item.material = String(item.material || '');
            item.unit = String(item.unit || 'ea');
            item.notes = String(item.notes || '');
          });
        }
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