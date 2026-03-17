import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if default template already exists and update it, or create new one
    const existing = await base44.entities.ContractTemplate.filter({ is_default: true });
    
    const templateData = {
      name: "Standard Construction Contract",
      description: "Professional construction contract with payment schedule, terms, and signature blocks",
      template_data: {
        version: "1.0",
        sections: [
          "Header with logo and company info",
          "Contract title",
          "Client and contract details grid",
          "Scope of work",
          "Payment schedule",
          "Unforeseen circumstances",
          "Change orders",
          "Terms and conditions",
          "Legal terms",
          "Signature blocks with date lines",
          "Footer with branding"
        ]
      },
      is_default: true,
      status: "active"
    };

    let result;
    if (existing.length > 0) {
      result = await base44.entities.ContractTemplate.update(existing[0].id, templateData);
    } else {
      result = await base44.entities.ContractTemplate.create(templateData);
    }

    return Response.json({ 
      success: true, 
      message: "Default contract template saved successfully",
      template: result 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});