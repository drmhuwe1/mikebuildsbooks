import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { address, projectType, estimatedValue, scopeDescription } = await req.json();

    if (!address || !address.trim()) {
      return Response.json({ error: 'A project address is required' }, { status: 400 });
    }

    const prompt = `You are a construction permit fee expert. A contractor needs to predict permit costs for a project.

Project Details:
- Full Address (as entered by user): ${address}
- Project Type: ${projectType || "general construction"}
- Estimated Project Value: ${estimatedValue ? "$" + estimatedValue : "Not specified"}
- Scope: ${scopeDescription || "Standard construction"}

Your task:
1. First, identify the jurisdiction (city/township/municipality, county, state, and ZIP code) for the given address by searching the web / official sources.
2. Then, research the official building permit fee schedule for that jurisdiction.
3. Identify all applicable permit-related fees, such as: Building Permit Fee, Permit Application Fee, Plan Review Fee, Inspection Fees, Zoning Fee, etc.
4. Estimate a dollar amount for each fee based on the project type and value, using the jurisdiction's known fee schedule. If the jurisdiction uses a value-based or square-footage-based formula, compute it for the given estimated value.
5. Provide a low and high estimate for the total permit cost.

Return ONLY a JSON object matching the schema. Use "confidence" of high/medium/low based on how authoritative the source is. Set "amount" to 0 if you truly cannot estimate a specific fee, and note it in "notes". Always include the jurisdiction details even if fee data is sparse.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: "gemini_3_1_pro",
      response_json_schema: {
        type: "object",
        properties: {
          jurisdiction: {
            type: "object",
            properties: {
              city: { type: "string" },
              municipality: { type: "string" },
              county: { type: "string" },
              state: { type: "string" },
              zip: { type: "string" }
            },
            required: ["city", "municipality", "county", "state", "zip"]
          },
          fees: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                amount: { type: "number" },
                type: { type: "string", description: "fixed, percentage, range, or value-based" },
                description: { type: "string" },
                dependsOn: { type: "string" },
                confidence: { type: "string", description: "high, medium, or low" },
                source: { type: "string" },
                notes: { type: "string" }
              },
              required: ["name", "amount", "type", "confidence"]
            }
          },
          total_estimate_min: { type: "number" },
          total_estimate_max: { type: "number" },
          summary: { type: "string", description: "Brief summary of findings and any caveats" }
        },
        required: ["jurisdiction", "fees", "total_estimate_min", "total_estimate_max", "summary"]
      }
    });

    return Response.json(result);
  } catch (error) {
    console.error('predictPermitFromAddress error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}