import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * analyzeBidPhoto
 * 
 * Parameters:
 *   fileUrl       (string)  - Pre-uploaded file URL (image or PDF)
 *   inputMode     (string)  - 'photo' or 'blueprint'
 *   dimensions    (object)  - { width, depth, height, notes }
 *   markup        (number)  - Markup percentage (e.g. 20)
 *   contingency   (number)  - Contingency percentage (e.g. 10)
 *   crew          (array)   - [{ name, trade, rate, hours }]
 * 
 * Note: Upload the file first using base44.integrations.Core.UploadFile({ file }),
 * then pass the returned file_url here as fileUrl.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { fileUrl, inputMode, dimensions, markup, contingency, crew } = await req.json();

    if (!fileUrl) {
      return Response.json({ error: 'fileUrl is required. Upload the file first using UploadFile integration and pass the returned file_url.' }, { status: 400 });
    }

    const { width = 10, depth = 8, height = '', notes = '' } = dimensions || {};
    const crewList = (crew || []).length > 0
      ? crew.map(c => `- ${c.name} (${c.trade}): $${c.rate}/hr, ${c.hours} hours`).join('\n')
      : 'No crew assigned';
    const modeLabel = inputMode === 'blueprint' ? 'PDF blueprint' : 'project photo';
    const markupPct = markup || 20;
    const contingencyPct = contingency || 10;

    const prompt = `You are an expert construction estimator with 20+ years of experience. Analyze this ${modeLabel} carefully and produce a detailed, accurate contractor bid.

Project Dimensions: ${width}' wide x ${depth}' deep${height ? ` x ${height}' tall` : ''}
Additional Notes: ${notes || 'None'}
Markup: ${markupPct}%
Contingency: ${contingencyPct}%

Assigned Crew:
${crewList}

Based on what you see in the ${modeLabel}, return a JSON object with this exact structure:

{
  "projectTitle": "string — descriptive project name",
  "projectDescription": "string — 2-4 sentence overview of the project scope",
  "structuralSummary": {
    "footprint": "string e.g. '12x16 ft'",
    "squareFootage": number,
    "roofType": "string e.g. Gable / Hip / Flat / Open",
    "roofPitch": "string e.g. '4:12'",
    "deckHeight": "string e.g. '3 ft above grade'",
    "totalHeight": "string",
    "foundation": "string e.g. 'Concrete footings'",
    "framing": "string e.g. '2x8 pressure treated lumber'"
  },
  "blueprintSpecs": {
    "detectedElements": ["string — structural elements identified from the image"],
    "estimatedLoadRequirements": "string",
    "codeConsiderations": ["string"],
    "missingInfo": ["string — things that could not be determined from the image"]
  },
  "materials": [
    {
      "category": "string — one of: Foundation / Framing / Decking / Roofing / Railing & Stairs / Hardware / Finishing",
      "items": [
        {
          "name": "string",
          "size": "string e.g. '2x8x16'",
          "material": "string e.g. 'Pressure Treated Pine'",
          "qty": number,
          "unit": "string e.g. ea / lf / sf / bag / sheet",
          "unitCost": number,
          "totalCost": number,
          "notes": "string"
        }
      ]
    }
  ],
  "laborBreakdown": [
    {
      "phase": "string e.g. Foundation / Framing / Decking / Roofing / Finishing",
      "trade": "string",
      "hours": number,
      "rate": number,
      "total": number,
      "assignedTo": "string — crew member name or Unassigned"
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
  "buildNotes": ["string — construction notes, warnings, recommendations"],
  "permitItems": ["string — permits and inspections typically required"],
  "riskFlags": ["string — potential issues, cost overrun risks, or site concerns"]
}

Use realistic 2025 US material prices. All number fields must be actual numbers. Be thorough.`;

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
          blueprintSpecs: { type: 'object' },
          materials: { type: 'array', items: { type: 'object' } },
          laborBreakdown: { type: 'array', items: { type: 'object' } },
          timeline: { type: 'array', items: { type: 'object' } },
          financials: { type: 'object' },
          buildNotes: { type: 'array', items: { type: 'string' } },
          permitItems: { type: 'array', items: { type: 'string' } },
          riskFlags: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    // Recalculate financials with the caller's actual markup/contingency values
    const matSub = result.financials?.materialSubtotal || 0;
    const labSub = result.financials?.laborSubtotal || 0;
    const subtotal = matSub + labSub;
    const markupAmount = Math.round(subtotal * markupPct / 100);
    const contingencyAmount = Math.round(subtotal * contingencyPct / 100);
    const total = subtotal + markupAmount + contingencyAmount;
    const sqft = result.structuralSummary?.squareFootage || (Number(width) * Number(depth)) || 80;

    result.financials = {
      materialSubtotal: matSub,
      laborSubtotal: labSub,
      subtotal,
      markupPct,
      markupAmount,
      contingencyPct,
      contingencyAmount,
      total,
      perSqFt: sqft > 0 ? Math.round(total / sqft) : 0,
    };

    return Response.json({ success: true, data: result });

  } catch (error) {
    console.error('analyzeBidPhoto error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});