import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { address, city, state, zipCode } = await req.json();

    if (!zipCode || !state) {
      return Response.json({ 
        error: 'ZIP code and state are required' 
      }, { status: 400 });
    }

    // Use AI to identify municipality from zip code
    const prompt = `Given the ZIP code ${zipCode} in ${state}, identify the municipality (city/town). 
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

    const municipalityData = {
      municipality: result.municipality || city || "Unknown",
      county: result.county || "",
      state: result.state || state || "PA",
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
    };
    
    return Response.json(municipalityData);
  } catch (error) {
    console.error('Municipality identification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});