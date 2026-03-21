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

    const { width = '10', depth = '8', height = '', notes = '' } = dimensions;
    const crewList = crew.length > 0
      ? crew.map(c => `- ${c.name} (${c.trade}): $${c.rate}/hr, ${c.hours} hours`).join('\n')
      : 'No crew assigned';

    const modeLabel = inputMode === 'blueprint' ? 'PDF blueprint' : 'project photo';
    const prompt = `You are an expert construction estimator. Analyze this ${modeLabel} and return ONLY valid JSON with no markdown, no explanation, no backticks.

Dimensions: ${width}' W x ${depth}' D${height ? ` x ${height}' H` : ''}
Notes: ${notes || 'None'}
Markup: ${markup}% | Contingency: ${contingency}%
Crew: ${crewList}

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

    // Recalculate financials with user's markup/contingency
    const ms = result.financials?.materialSubtotal || 0;
    const ls = result.financials?.laborSubtotal || 0;
    const sub = ms + ls;
    const mkA = Math.round(sub * markup / 100);
    const ctA = Math.round(sub * contingency / 100);
    const sqft = result.structuralSummary?.squareFootage || (Number(width) * Number(depth)) || 80;
    result.financials = {
      ...result.financials,
      subtotal: sub,
      markupPct: markup,
      markupAmount: mkA,
      contingencyPct: contingency,
      contingencyAmount: ctA,
      total: sub + mkA + ctA,
      perSqFt: Math.round((sub + mkA + ctA) / sqft),
    };

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('analyzeBidPhoto:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});