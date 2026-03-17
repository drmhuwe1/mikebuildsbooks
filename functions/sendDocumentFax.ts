import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Sends a document via fax using email-to-fax workflow.
 * Supports FAXAGE email-to-fax: {faxnumber}@fax.faxage.com
 * 
 * Set FAXAGE_EMAIL secret to your FAXAGE account email (or leave blank to use a
 * generic email-to-fax gateway). The fax number is formatted as {number}@fax.faxage.com
 * 
 * Alternatively, set FAX_GATEWAY_DOMAIN to use a different email-to-fax provider.
 * e.g. "efaxsend.com", "fax.faxage.com", "myfax.com"
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { faxNumber, subject, htmlContent, docTitle, senderNote } = await req.json();
    if (!faxNumber) return Response.json({ error: 'Missing fax number' }, { status: 400 });

    // Clean fax number — digits only
    const cleanFax = faxNumber.replace(/\D/g, '');
    if (cleanFax.length < 10) return Response.json({ error: 'Invalid fax number — must be at least 10 digits' }, { status: 400 });

    const gatewayDomain = Deno.env.get('FAX_GATEWAY_DOMAIN') || 'fax.faxage.com';
    const faxEmail = `${cleanFax}@${gatewayDomain}`;

    const body = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 20px; }
  h1 { font-size: 16px; border-bottom: 2px solid #1e3a5f; padding-bottom: 8px; }
  .cover-note { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 14px; margin-bottom: 20px; }
</style>
</head>
<body>
  <h1>FAX — ${docTitle || 'Document'}</h1>
  ${senderNote ? `<div class="cover-note"><strong>Message:</strong><br/>${senderNote.replace(/\n/g, '<br/>')}</div>` : ''}
  ${htmlContent || ''}
</body>
</html>`;

    await base44.integrations.Core.SendEmail({
      to: faxEmail,
      subject: subject || docTitle || 'Fax Document',
      body,
    });

    return Response.json({ success: true, faxEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});