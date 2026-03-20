import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

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
        error: 'jobId, zipCode, and state are required' 
      }, { status: 400 });
    }

    // Check if municipality already exists for this job
    const existing = await base44.entities.Municipality.filter({ job_id: jobId });
    if (existing.length > 0) {
      return Response.json(existing[0]); // Return existing
    }

    // Identify municipality using AI
    const fullAddress = [address, city].filter(Boolean).join(", ") + (zipCode ? ` ${zipCode}` : "");
    
    const municipalityResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Identify the municipality and county for this address: ${fullAddress} ${state}
      Return a JSON object with this exact structure (nothing else):
      {
        "municipality": "City or Town Name",
        "county": "County Name",
        "state": "${state}"
      }`,
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

    // Create municipality record
    const municipalityData = {
      job_id: jobId,
      project_address: fullAddress,
      municipality: municipalityResult.municipality || city || "Unknown",
      county: municipalityResult.county || "",
      state: municipalityResult.state || state,
      zip_code: zipCode,
      building_dept_name: `${municipalityResult.municipality || city || "Local"} Building Department`,
      building_dept_phone: "",
      building_dept_email: "",
      zoning_dept_name: `${municipalityResult.municipality || city || "Local"} Zoning Department`,
      zoning_dept_phone: "",
      zoning_dept_email: "",
      permit_office_address: "",
      permit_office_hours: "",
      permit_website: "",
      online_permit_portal: "",
      data_verified: false,
    };

    const created = await base44.entities.Municipality.create(municipalityData);
    return Response.json(created);
  } catch (error) {
    console.error('Create municipality error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});