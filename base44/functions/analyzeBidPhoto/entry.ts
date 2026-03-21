import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { imageBase64, imageMimeType, inputMode, dimensions, markup, contingency, crew } = await req.json();

    if (!imageBase64 || !imageMimeType) {
      return Response.json({ error: 'imageBase64 and imageMimeType are required' }, { status: 400 });
    }

    // Decode base64 and upload as multipart/form-data
    const rawBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const byteString = atob(rawBase64);
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);

    const ext = imageMimeType.split('/')[1]?.split('+')[0] || 'jpg';
    const formData = new FormData();
    formData.append('file', new Blob([bytes], { type: imageMimeType }), `upload.${ext}`);

    const appId = Deno.env.get('BASE44_APP_ID');
    const uploadRes = await fetch(`https://api.base44.com/api/apps/${appId}/integrations/Core/UploadFile`, {
      method: 'POST',
      headers: { 'Authorization': req.headers.get('Authorization') || '' },
      body: formData,
    });
    const uploadJson = await uploadRes.json();
    const fileUrl = uploadJson.file_url;
    if (!fileUrl) throw new Error('File upload failed: ' + JSON.stringify(uploadJson));

    const { width = 10, depth = 8, height = '', notes = '' } = dimensions || {};
    const crewList = (crew || []).map(c => `- ${c.name} (${c.trade}): $${c.rate}/hr, ${c.hours} hours`).join('\n') || 'No crew assigned';
    const modeLabel = inputMode === 'blueprint' ? 'PDF blueprint' : 'project photo';

    const prompt = `You are an expert construction estimator with 20+ years of experience. Analyze this ${modeLabel} carefully and produce a detailed, accurate contractor bid.

Project Dimensions: ${width}' wide x ${depth}' deep${height ? ` x ${height}' tall` : ''}
Additional Notes: ${notes || 'None'}
Markup: ${markup || 20}%
Contingency: ${contingency || 10}%

Assigned Crew:
${crewList}

Based on what you see in the ${modeLabel}, return a single JSON object with this exact structure (no markdown, just raw JSON):

{
  "projectTitle": "string — descriptive project name",
  "projectDescription": "string — 2-4 sentence overview of the project scope",
  "structuralSummary": {
    "footprint": "string e.g. '10x8 ft'",
    "squareFootage": number,
    "roofType": "string e.g. 'Gable', 'Hip', 'Flat'",
    "roofPitch": "string e.g. '4:12'",
    "deckHeight": "string e.g. '3 ft above grade'",
    "totalHeight": "string",
    "foundation": "string e.g. 'Concrete footings'",
    "framing": "string e.g. '2x8 pressure treated'"
  },
  "blueprintSpecs": {
    "detectedElements": ["string — list of structural elements identified"],
    "estimatedLoadRequirements": "string",
    "codeConsiderations": ["string"],
    "missingInfo": ["string — things that couldn't be determined from the image"]
  },
  "materials": [
    {
      "category": "string e.g. Foundation / Framing / Decking / Roofing / Railing & Stairs / Hardware / Finishing",
      "items": [
        {
          "name": "string",
          "size": "string e.g. '2x8x16'",
          "material": "string e.g. 'Pressure Treated Pine'",
          "qty": number,
          "unit": "string e.g. 'ea', 'lf', 'sf', 'bag'",
          "unitCost": number,
          "totalCost": number,
          "notes": "string"
        }
      ]
    }
  ],
  "laborBreakdown": [
    {
      "phase": "string e.g. 'Foundation', 'Framing', 'Decking', 'Roofing', 'Finishing'",
      "trade": "string",
      "hours": number,
      "rate": number,
      "total": number,
      "assignedTo": "string — crew member name or 'Unassigned'"
    }
  ],
  "timeline": [
    {
      "day": number,
      "phase": "string",
      "crew": ["string — crew member names"],
      "tasks": ["string — specific tasks for this day"],
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
  "buildNotes": ["string — important construction notes, warnings, or recommendations"],
  "permitItems": ["string — permits and inspections typically required for this project type"],
  "riskFlags": ["string — potential issues, cost overrun risks, or site concerns"]
}

Use realistic 2025 US material prices. Be specific and thorough. All number fields must be actual numbers (not strings).`;

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

    // Recalculate financials with the user's actual markup/contingency
    const matSub = result.financials?.materialSubtotal || 0;
    const labSub = result.financials?.laborSubtotal || 0;
    const subtotal = matSub + labSub;
    const markupAmt = Math.round(subtotal * (markup || 20) / 100);
    const contingencyAmt = Math.round(subtotal * (contingency || 10) / 100);
    const total = subtotal + markupAmt + contingencyAmt;
    const sqft = result.structuralSummary?.squareFootage || (width * depth) || 80;

    result.financials = {
      materialSubtotal: matSub,
      laborSubtotal: labSub,
      subtotal,
      markupPct: markup || 20,
      markupAmount: markupAmt,
      contingencyPct: contingency || 10,
      contingencyAmount: contingencyAmt,
      total,
      perSqFt: sqft > 0 ? Math.round(total / sqft) : 0,
    };

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('analyzeBidPhoto error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});