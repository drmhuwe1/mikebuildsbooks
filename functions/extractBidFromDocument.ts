import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url } = await req.json();

    if (!file_url) {
      return Response.json({ error: 'file_url required' }, { status: 400 });
    }

    // Use the InvokeLLM integration to extract structured bid data from the document
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert at extracting construction bid information from documents. 
      
Analyze the provided document and extract COMPLETE bid information. Be thorough and capture ALL details from the scope of work section.

Extract and return a JSON object with:
{
  "title": "Descriptive project name",
  "client_name": "Full client/customer name",
  "project_address": "Complete project address if provided",
  "scope_summary": "DETAILED summary of ALL work items and scope (minimum 200 characters, capture every work item mentioned)",
  "scope_items": ["array", "of", "individual", "work", "items"],
  "material_cost": number,
  "labor_hours": number,
  "subcontractor_cost": number,
  "permit_cost": number,
  "equipment_cost": number,
  "bid_amount": number,
  "deposit_percent": number,
  "valid_until": "date if provided",
  "notes": "Any additional terms or conditions"
}

CRITICAL: For scope_summary, include EVERY work item mentioned, not just a general summary. 
List materials, labor tasks, subcontractor work, and all deliverables comprehensively.

If a field is not found, use null or 0.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          client_name: { type: "string" },
          project_address: { type: "string" },
          scope_summary: { type: "string" },
          scope_items: { type: "array", items: { type: "string" } },
          material_cost: { type: "number" },
          labor_hours: { type: "number" },
          subcontractor_cost: { type: "number" },
          permit_cost: { type: "number" },
          equipment_cost: { type: "number" },
          bid_amount: { type: "number" },
          deposit_percent: { type: "number" },
          valid_until: { type: "string" },
          notes: { type: "string" }
        }
      }
    });

    // Validate extracted data
    const extracted = response;
    const validation = [];

    if (!extracted.title) validation.push("Missing project title");
    if (!extracted.client_name) validation.push("Missing client name");
    if (!extracted.scope_summary || extracted.scope_summary.length < 50) {
      validation.push("Scope of work is incomplete or too brief");
    }
    if (!extracted.bid_amount || extracted.bid_amount === 0) {
      validation.push("No bid amount found");
    }

    return Response.json({
      success: true,
      extracted,
      validation,
      dataQuality: {
        completeness: extracted.scope_summary && extracted.scope_summary.length > 150 ? "high" : "medium",
        requiresReview: validation.length > 0
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});