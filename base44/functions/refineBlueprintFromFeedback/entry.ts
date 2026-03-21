import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * refineBlueprintFromFeedback
 * 
 * Takes user feedback on the AI-generated blueprint and regenerates
 * the structural specs, materials, and costs based on the changes requested
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { currentBidData, userFeedback, dimensions = {} } = await req.json();
    if (!currentBidData || !userFeedback) {
      return Response.json({ error: 'currentBidData and userFeedback required' }, { status: 400 });
    }

    const { width = '10', depth = '8', height = '', notes = '' } = dimensions;

    const prompt = `You are an expert construction estimator. The user has provided feedback on a previously generated blueprint. Please regenerate the COMPLETE bid estimate according to their specifications.

ORIGINAL PROJECT:
- Dimensions: ${width}' W x ${depth}' D${height ? ` x ${height}' H` : ''}
- Original Description: ${currentBidData.projectDescription || 'None'}

USER FEEDBACK (CHANGES TO MAKE):
${userFeedback}

REQUIREMENTS:
1. Apply the user's requested changes to the design
2. Generate realistic updated material list for the modified project
3. Use 2025 US Home Depot prices
4. All numeric values MUST be numbers (not strings)
5. Include at least 15+ line items across multiple categories
6. Recalculate all costs based on the new design
7. Update timeline, labor breakdown, and structural specs accordingly

Return exactly this JSON structure with all updated values:
{
  "projectTitle": "string",
  "projectDescription": "string (updated to reflect changes)",
  "structuralSummary": {
    "footprint": "string (updated)",
    "squareFootage": number,
    "deckHeight": "string",
    "roofType": "string",
    "roofPitch": "string",
    "totalHeight": "string",
    "estimatedDuration": "string (may change based on complexity)"
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

Ensure all material costs and labor estimates are realistic and reflect the design changes.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_pro',
      response_json_schema: {
        type: 'object',
        properties: {
          projectTitle: { type: 'string' },
          projectDescription: { type: 'string' },
          structuralSummary: { type: 'object' },
          materials: { type: 'array' },
          laborBreakdown: { type: 'array' },
          timeline: { type: 'array' },
          buildNotes: { type: 'array' },
          permitItems: { type: 'array' },
          riskFlags: { type: 'array' },
          blueprintSpecs: { type: 'object' },
        },
      },
    });

    // Ensure numeric precision
    if (result.materials && Array.isArray(result.materials)) {
      result.materials.forEach(cat => {
        if (cat.items && Array.isArray(cat.items)) {
          cat.items.forEach(item => {
            item.qty = Number(item.qty) || 0;
            item.unitCost = Number(item.unitCost) || 0;
            item.totalCost = Number(item.qty * item.unitCost);
          });
        }
      });
    }

    // Recalculate financials
    const ms = result.materials?.reduce((sum, cat) => 
      sum + (cat.items?.reduce((itemSum, item) => itemSum + (Number(item.totalCost) || 0), 0) || 0), 0) || 0;
    
    const ls = (currentBidData.financials?.laborSubtotal) || 0;
    const sqft = Number(result.structuralSummary?.squareFootage) || (Number(width) * Number(depth)) || 80;
    const markup = currentBidData.financials?.markupPct || 20;
    const contingency = currentBidData.financials?.contingencyPct || 10;
    
    const sub = ms + ls;
    const mkA = Math.round(sub * markup / 100);
    const ctA = Math.round(sub * contingency / 100);
    const total = sub + mkA + ctA;

    result.financials = {
      materialSubtotal: ms,
      laborSubtotal: ls,
      subtotal: sub,
      markupPct: markup,
      markupAmount: mkA,
      contingencyPct: contingency,
      contingencyAmount: ctA,
      total: total,
      perSqFt: sqft > 0 ? Math.round(total / sqft) : 0,
    };

    result.structuralSummary = {
      ...result.structuralSummary,
      squareFootage: sqft,
      footprint: `${width}' x ${depth}'`,
    };

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('refineBlueprintFromFeedback:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});