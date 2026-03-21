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
    
    const prompt = `You are an expert construction estimator. Analyze this ${modeLabel} and generate a COMPLETE material estimate. Return ONLY valid JSON with no markdown, no explanation, no backticks.

PROJECT DETAILS:
- Dimensions: ${width}' W x ${depth}' D${height ? ` x ${height}' H` : ''} (${sqftCalc} sqft)
- Notes: ${notes || 'Standard construction'}
- Crew Assigned: ${crewList}
- Labor Cost: $${crewLabor}${projectTypeContext}${addressContext}

REQUIREMENTS:
1. Generate realistic material list for this ${projectType || 'unspecified'} project
2. Use specific materials requested (${deckMaterial || roofMaterial || 'standard'}), otherwise choose highest-quality standard options
3. Use 2025 US Home Depot prices
4. All numeric values MUST be numbers (not strings)
5. Include at least 20+ line items across multiple categories (framing, decking, roofing, hardware, fasteners, tools, misc)
6. qty and unitCost must be realistic numbers
7. totalCost = qty × unitCost
8. If project address provided: Research local permit fees, zoning codes, and required inspections for that area${address ? ` (${address})` : ''}
9. Include permit costs and inspection requirements in permitItems based on local jurisdiction
10. Add risk flags for local zoning or permit challenges, structural concerns, or material availability

Return exactly this JSON structure:
{
  "projectTitle": "string",
  "projectDescription": "string (2-3 sentences)",
  "structuralSummary": {
    "footprint": "string",
    "squareFootage": number,
    "deckHeight": "string",
    "roofType": "string",
    "roofPitch": "string",
    "totalHeight": "string",
    "estimatedDuration": "string"
  },
  "materials": [
    {
      "category": "string",
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
  "blueprintSpecs": {
    "foundationType": "string",
    "beamSpec": "string",
    "joistSpec": "string",
    "rafterSpec": "string",
    "deckingSpec": "string",
    "railingSpec": "string",
    "roofingSpec": "string",
    "hardwareNotes": "string"
  }
}

Use realistic 2025 US construction prices. All numbers must be numeric. Include markup and contingency in calculations.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_pro',
      file_urls: [fileUrl],
      response_json_schema: {
        type: 'object',
        properties: {
          projectTitle: { type: 'string' },
          projectDescription: { type: 'string' },
          structuralSummary: { type: 'object' },
          materials: { type: 'array' },
          laborBreakdown: { type: 'array' },
          timeline: { type: 'array' },
          financials: { type: 'object' },
          buildNotes: { type: 'array' },
          permitItems: { type: 'array' },
          riskFlags: { type: 'array' },
          blueprintSpecs: { type: 'object' },
        },
      },
    });

    // Sanitize materials data - ensure all numeric values are numbers
    if (result.materials && Array.isArray(result.materials)) {
      result.materials.forEach(cat => {
        if (cat.items && Array.isArray(cat.items)) {
          cat.items.forEach(item => {
            item.qty = Number(item.qty) || 0;
            item.unitCost = Number(item.unitCost) || 0;
            item.totalCost = Number(item.qty) * Number(item.unitCost);
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