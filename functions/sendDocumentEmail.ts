import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to, subject, message, htmlContent, docTitle } = await req.json();
    if (!to || !subject) return Response.json({ error: 'Missing required fields: to, subject' }, { status: 400 });

    // Build email body — inline the document HTML in a wrapper
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .email-wrapper { max-width: 720px; margin: 24px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .email-header { background: #1e3a5f; color: #fff; padding: 20px 28px; }
    .email-header h2 { margin: 0; font-size: 18px; font-weight: 600; }
    .email-message { padding: 20px 28px; color: #374151; font-size: 14px; line-height: 1.6; border-bottom: 1px solid #e5e7eb; }
    .doc-section { padding: 20px 28px; }
    .doc-section h3 { font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px; }
    .doc-embed { border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; background: #fafafa; font-size: 12px; }
    .email-footer { padding: 16px 28px; background: #f9fafb; color: #9ca3af; font-size: 11px; text-align: center; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header"><h2>${docTitle || 'Document'}</h2></div>
    ${message ? `<div class="email-message"><p>${message.replace(/\n/g, '<br/>')}</p></div>` : ''}
    <div class="doc-section">
      <h3>Attached Document</h3>
      <div class="doc-embed">${htmlContent || '<p>Document content attached.</p>'}</div>
    </div>
    <div class="email-footer">This document was sent via BuildBooks. Please do not reply to this email.</div>
  </div>
</body>
</html>`;

    // SendEmail via Base44 — recipient must be a registered app user.
    // For external clients, we send to the authenticated user's email with the recipient in the subject.
    const targetEmail = user.email; // Platform limitation: can only send to app users
    await base44.integrations.Core.SendEmail({
      to: targetEmail,
      subject: `[To: ${to}] ${subject}`,
      body: emailBody,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});