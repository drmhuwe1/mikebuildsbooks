import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobType, dimensions, crewSize } = await req.json();

    if (!jobType) {
      return Response.json({ error: 'jobType is required' }, { status: 400 });
    }

    // Build prompt based on job type
    let prompt = '';
    
    if (jobType.toLowerCase().includes('concrete')) {
      const { length, width, depth } = dimensions || {};
      prompt = `You are a construction cost estimator. Estimate concrete work costs and labor.

Job Type: Concrete work
Dimensions: ${length}ft x ${width}ft x ${depth}in deep (${length && width && depth ? (length * width * depth / 12 / 27).toFixed(2) : '?'} cubic yards)
Crew Size: ${crewSize || 1} person(s)

Provide:
1. Concrete material cost ($/cubic yard estimate + total)
2. Labor hours needed (by phase: prep, pour, finish, cure monitoring)
3. Total labor hours + recommended crew days
4. Equipment rental if needed
5. Regional cost adjustments note

Return as JSON: { materialCostPerCY: number, totalMaterialCost: number, laborPhases: [{name: string, hours: number}], totalLaborHours: number, estimatedDays: number, equipmentCost: number, notes: string }`;
    } 
    else if (jobType.toLowerCase().includes('roof')) {
      const { squareFeet, pitchRatio, roofType } = dimensions || {};
      prompt = `You are a construction cost estimator. Estimate roofing work costs and labor.

Job Type: Roofing
Square Footage: ${squareFeet || '?'} sq ft
Pitch Ratio: ${pitchRatio || '6:12'}
Roof Type: ${roofType || 'Asphalt shingles'}
Crew Size: ${crewSize || 1} person(s)

Provide:
1. Material costs breakdown (shingles, underlayment, nails, flashing, etc.)
2. Total material cost
3. Labor hours by phase (tear-off, prep, installation, cleanup)
4. Total labor hours + recommended crew days
5. Equipment needs

Return as JSON: { materialBreakdown: [{item: string, cost: number}], totalMaterialCost: number, laborPhases: [{name: string, hours: number}], totalLaborHours: number, estimatedDays: number, notes: string }`;
    }
    else {
      // Generic job type - ask AI to estimate
      prompt = `You are a construction cost estimator. Estimate labor time for this job type.

Job Type: ${jobType}
Crew Size: ${crewSize || 1} person(s)

Provide realistic estimates:
1. Labor phases with typical duration (e.g., prep, main work, finish, cleanup)
2. Total labor hours needed
3. Recommended crew days (assuming 8-hour days)
4. Typical material cost category hints (low, medium, high relative to labor)
5. Any notes or variables that affect timeline

Return as JSON: { laborPhases: [{name: string, hours: number}], totalLaborHours: number, estimatedDays: number, materialCostTier: string, notes: string }`;
    }

    // Call LLM with structured response
    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          materialCostPerCY: { type: 'number' },
          totalMaterialCost: { type: 'number' },
          materialBreakdown: { type: 'array', items: { type: 'object' } },
          laborPhases: { type: 'array', items: { type: 'object' } },
          totalLaborHours: { type: 'number' },
          estimatedDays: { type: 'number' },
          equipmentCost: { type: 'number' },
          materialCostTier: { type: 'string' },
          notes: { type: 'string' }
        }
      }
    });

    return Response.json({
      success: true,
      estimate: response,
      timestamp: new Date().toISOString(),
      jobType,
      crewSize
    });

  } catch (error) {
    console.error('Estimate error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});