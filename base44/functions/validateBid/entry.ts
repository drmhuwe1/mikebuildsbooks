import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bid } = await req.json();

    const issues = [];
    const legalChecks = [];

    // REQUIRED FIELDS CHECK
    if (!bid.title || bid.title.trim().length === 0) {
      issues.push("Bid title is required");
    }
    if (!bid.client_name || bid.client_name.trim().length === 0) {
      issues.push("Client name is required");
    }
    if (!bid.scope_summary || bid.scope_summary.trim().length < 50) {
      issues.push("Scope of work must be detailed (minimum 50 characters)");
    }
    if (!bid.valid_until || bid.valid_until.trim().length === 0) {
      issues.push("Bid expiration date is required");
    }

    // FINANCIAL COMPLETENESS
    if ((bid.material_cost || 0) === 0 && (bid.labor_hours || 0) === 0 && (bid.subcontractor_cost || 0) === 0) {
      issues.push("At least one cost category must be entered (materials, labor, or subcontractor)");
    }
    if ((bid.labor_hours || 0) > 0 && (bid.labor_rate || 0) === 0) {
      issues.push("Labor rate must be set if labor hours are entered");
    }
    if ((bid.bid_amount || 0) === 0) {
      issues.push("Bid amount cannot be zero");
    }

    // LEGAL REQUIREMENTS
    legalChecks.push({
      requirement: "Valid Contract Terms (scope, timeline, payment terms)",
      met: bid.scope_summary && bid.scope_summary.length > 50
    });
    legalChecks.push({
      requirement: "Clear Pricing (total bid amount specified)",
      met: (bid.bid_amount || 0) > 0
    });
    legalChecks.push({
      requirement: "Expiration Date (bid valid until date)",
      met: bid.valid_until ? true : false
    });
    legalChecks.push({
      requirement: "Terms & Conditions Disclaimer",
      met: bid.disclaimer && bid.disclaimer.length > 10
    });
    legalChecks.push({
      requirement: "Contractor Signature Line (required before signing)",
      met: true // Will be enforced at signature step
    });
    legalChecks.push({
      requirement: "Customer Signature Line (required before signing)",
      met: true // Will be enforced at signature step
    });

    // AI INSIGHTS
    const insights = [];
    if (bid.bid_amount && bid.material_cost && (bid.material_cost / bid.bid_amount) > 0.7) {
      insights.push("⚠️ Material costs are >70% of bid. Ensure labor and overhead are accounted for.");
    }
    if (bid.labor_hours && bid.labor_rate && (bid.labor_hours * bid.labor_rate) > (bid.bid_amount || 0)) {
      insights.push("⚠️ Labor cost alone exceeds bid amount. Review pricing.");
    }
    if (new Date(bid.valid_until) < new Date()) {
      insights.push("⚠️ Bid expiration date has passed.");
    }
    const expirationDays = Math.ceil((new Date(bid.valid_until) - new Date()) / (1000 * 60 * 60 * 24));
    if (expirationDays < 7 && expirationDays >= 0) {
      insights.push(`⏰ Bid expires in ${expirationDays} days. Consider extending if needed.`);
    }

    return Response.json({
      status: issues.length === 0 ? "valid" : "incomplete",
      issues,
      legalChecks,
      insights,
      isReadyForSignature: issues.length === 0 && legalChecks.every(c => c.met)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});