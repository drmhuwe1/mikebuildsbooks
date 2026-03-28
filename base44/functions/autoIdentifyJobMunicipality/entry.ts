import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId, address, city, state, zipCode } = await req.json();

    if (!jobId || !zipCode || !state) {
      return Response.json({ 
        error: 'Job ID, ZIP code, and state are required' 
      }, { status: 400 });
    }

    // Build full address for AI identification
    const fullAddress = [address, city].filter(Boolean).join(", ") + (zipCode ? ` ${zipCode}` : "");

    // Use AI to identify municipality
    const prompt = `Identify the municipality and county for this address: ${fullAddress} ${state}
    Return a JSON object with this exact structure (nothing else):
    {
      "municipality": "City or Town Name",
      "county": "County Name",
      "state": "${state}"
    }`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          municipality: { type: "string" },
          county: { type: "string" },
          state: { type: "string" }
        },
        required: ["municipality", "county", "state"]
      }
    });

    // Check if municipality already exists
    const existing = await base44.asServiceRole.entities.Municipality.filter({
      municipality: result.municipality,
      state: result.state
    });

    let municipalityId = existing[0]?.id;

    if (!municipalityId) {
      // Create new municipality record
      const newMunicipality = await base44.asServiceRole.entities.Municipality.create({
        municipality: result.municipality || city || "Unknown",
        county: result.county || "",
        state: result.state || state || "",
        zip_code: zipCode || "",
        building_dept_name: `${result.municipality || city || "Local"} Building Department`,
        building_dept_phone: "",
        building_dept_email: "",
        zoning_dept_name: `${result.municipality || city || "Local"} Zoning Department`,
        zoning_dept_phone: "",
        zoning_dept_email: "",
        permit_office_address: "",
        permit_office_hours: "",
        permit_website: "",
        online_permit_portal: "",
        data_verified: false,
      });
      municipalityId = newMunicipality.id;
    }

    // Update job with municipality_id
    await base44.entities.Job.update(jobId, { municipality_id: municipalityId });

    return Response.json({ success: true, municipalityId });
  } catch (error) {
    console.error('Auto-identify municipality error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});