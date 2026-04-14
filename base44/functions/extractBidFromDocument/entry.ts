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
      
Analyze the provided document and extract COMPLETE bid information. Be thorough and capture ALL details including payment schedules, terms, conditions, exclusions, and formatting.

Extract and return a JSON object with:
{
  "title": "Descriptive project name",
  "client_name": "Full client/customer name",
  "client_last_name": "Last name if available",
  "project_address": "Complete project address if provided",
  "project_city": "City",
  "project_state": "State",
  "project_zip_code": "ZIP code",
  "scope_summary": "DETAILED summary of ALL work items and scope (minimum 200 characters, capture every work item mentioned)",
  "scope_items": ["array", "of", "individual", "work", "items"],
  "project_description": "Overall project description",
  "material_cost": number,
  "material_description": "Details about materials",
  "labor_hours": number,
  "labor_rate": number,
  "subcontractor_cost": number,
  "subcontractor_description": "Details about subcontractor work",
  "permit_cost": number,
  "permit_description": "Permit and inspection details",
  "equipment_cost": number,
  "equipment_description": "Equipment rental details",
  "overhead_percent": number,
  "contingency_percent": number,
  "target_profit_margin": number,
  "bid_amount": number,
  "deposit_percent": number,
  "deposit_amount": number,
  "valid_until": "date if provided",
  "notes": "Any additional terms or conditions",
  "exclusions": "What is NOT included in the bid",
  "terms_and_conditions": "Full terms",
  "included_in_bid": "What IS included",
  "change_orders": "Change order terms",
  "unforeseen_conditions": "How unforeseen conditions are handled",
  "permits_inspections": "Permit and inspection terms",
  "weather_delays": "Weather delay terms",
  "site_access": "Site access requirements",
  "material_responsibility": "Who is responsible for materials",
  "project_timeline": "Timeline and duration",
  "estimated_duration": "Estimated project duration",
  "disclaimer": "Important disclaimers",
  "bold_keywords": ["array", "of", "text", "that", "should", "be", "bolded"],
  "payment_schedule": [
    {
      "milestone": "Milestone description",
      "percent": percentage as number (0-100),
      "amount": dollar amount if specified,
      "is_bold": boolean (true if text was bold in original)
    }
  ]
}

CRITICAL INSTRUCTIONS:
1. Extract EVERY field that exists in the document - be comprehensive
2. For scope_summary, include EVERY work item mentioned, not just a general summary
3. For payment_schedule, extract ALL payment milestones - if there are 4+ payments, capture all of them
4. Identify and list ALL text that appears in bold in the original document (bold_keywords array)
5. Mark payment milestones that were bold with is_bold: true
6. For exclusions, list items that are explicitly NOT included
7. For all text fields, preserve the original meaning and detail
8. If percentages don't add to 100%, verify amounts instead
9. If a field is not found, use null or 0 (except arrays which should be empty)`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          client_name: { type: "string" },
          client_last_name: { type: "string" },
          project_address: { type: "string" },
          project_city: { type: "string" },
          project_state: { type: "string" },
          project_zip_code: { type: "string" },
          scope_summary: { type: "string" },
          scope_items: { type: "array", items: { type: "string" } },
          project_description: { type: "string" },
          material_cost: { type: "number" },
          material_description: { type: "string" },
          labor_hours: { type: "number" },
          labor_rate: { type: "number" },
          subcontractor_cost: { type: "number" },
          subcontractor_description: { type: "string" },
          permit_cost: { type: "number" },
          permit_description: { type: "string" },
          equipment_cost: { type: "number" },
          equipment_description: { type: "string" },
          overhead_percent: { type: "number" },
          contingency_percent: { type: "number" },
          target_profit_margin: { type: "number" },
          bid_amount: { type: "number" },
          deposit_percent: { type: "number" },
          deposit_amount: { type: "number" },
          valid_until: { type: "string" },
          notes: { type: "string" },
          exclusions: { type: "string" },
          terms_and_conditions: { type: "string" },
          included_in_bid: { type: "string" },
          change_orders: { type: "string" },
          unforeseen_conditions: { type: "string" },
          permits_inspections: { type: "string" },
          weather_delays: { type: "string" },
          site_access: { type: "string" },
          material_responsibility: { type: "string" },
          project_timeline: { type: "string" },
          estimated_duration: { type: "string" },
          disclaimer: { type: "string" },
          bold_keywords: { type: "array", items: { type: "string" } },
          payment_schedule: {
            type: "array",
            items: {
              type: "object",
              properties: {
                milestone: { type: "string" },
                percent: { type: "number" },
                amount: { type: "number" },
                is_bold: { type: "boolean" }
              }
            }
          }
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