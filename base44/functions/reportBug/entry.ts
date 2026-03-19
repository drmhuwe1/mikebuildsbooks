import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { issueType, message, pageContext } = await req.json();

    if (!issueType || !message) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Capture browser/system info
    const userAgent = req.headers.get("user-agent") || "Unknown";
    const browserInfo = userAgent.substring(0, 150);

    // Log to console for debugging
    console.log(`[BUG REPORT] ${issueType.toUpperCase()} from ${user.email} on ${pageContext}: ${message}`);

    // Create bug report record
    const bugReport = await base44.asServiceRole.entities.BugReport.create({
      user_email: user.email,
      issue_type: issueType,
      message: message,
      page_context: pageContext,
      browser_info: browserInfo,
      status: "new",
      priority: issueType === "bug" ? "medium" : "low"
    });

    return Response.json({ success: true, id: bugReport.id });
  } catch (error) {
    console.error("Bug report error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});