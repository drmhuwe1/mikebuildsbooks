/**
 * Sends a document via FAXAGE API (https://www.faxage.com/fax_api.php)
 * Uses FAXAGE_USERNAME, FAXAGE_PASSWORD, FAXAGE_COMPANY secrets.
 * Falls back to email-to-fax via SMTP if FAXAGE credentials are not set.
 *
 * FAXAGE API docs: https://www.faxage.com/fax_api.php
 * Required secrets: FAXAGE_USERNAME, FAXAGE_PASSWORD, FAXAGE_COMPANY
 * Optional fallback: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS + FAX_GATEWAY_DOMAIN
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import nodemailer from 'npm:nodemailer@6.9.13';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { faxNumber, htmlContent, docTitle, senderNote, jobId, jobTitle, clientName, docType } = await req.json();
    if (!faxNumber) return Response.json({ error: 'Missing fax number' }, { status: 400 });

    const cleanFax = faxNumber.replace(/\D/g, '');
    if (cleanFax.length < 10) return Response.json({ error: 'Invalid fax number — must be at least 10 digits' }, { status: 400 });

    const faxageUser = Deno.env.get('FAXAGE_USERNAME');
    const faxagePass = Deno.env.get('FAXAGE_PASSWORD');
    const faxageCompany = Deno.env.get('FAXAGE_COMPANY');

    let result = {};
    let deliveryNotes = '';
    let deliveryStatus = 'pending';

    if (faxageUser && faxagePass && faxageCompany) {
      // --- FAXAGE API delivery ---
      // Build HTML content as the fax body
      const faxBody = `<!DOCTYPE html>
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

      // FAXAGE API — https://api.faxage.com/httpsfax.php
      // Required params: username, password, company, operation=sendfax, recipientfax, filename[]
      const formData = new FormData();
      formData.append('username', faxageUser);
      formData.append('password', faxagePass);
      formData.append('company', faxageCompany);
      formData.append('operation', 'sendfax');
      formData.append('recipientfax', cleanFax);
      formData.append('recipientname', clientName || 'Recipient');
      // Attach document as HTML file — FAXAGE converts HTML to fax
      formData.append('filename[]', new Blob([faxBody], { type: 'text/html' }), `${(docTitle || 'document').replace(/\s+/g, '_')}.html`);

      const faxageResp = await fetch('https://api.faxage.com/httpsfax.php', {
        method: 'POST',
        body: formData,
      });

      const rawResp = await faxageResp.text();
      // FAXAGE returns: "jobid" on success, or an error string starting with "ERROR"
      const trimmed = rawResp.trim();
      const jobIdFax = trimmed.split('\n')[0]?.trim();

      if (faxageResp.ok && jobIdFax && !isNaN(Number(jobIdFax))) {
        deliveryStatus = 'sent';
        deliveryNotes = `FAXAGE Job ID: ${jobIdFax}`;
        result = { success: true, faxageJobId: jobIdFax };
      } else {
        // FAXAGE returned an error
        deliveryStatus = 'failed';
        deliveryNotes = `FAXAGE error: ${rawResp.trim()}`;
        // Log failure and return error
        await base44.asServiceRole.entities.DocumentDelivery.create({
          job_id: jobId || '',
          job_title: jobTitle || '',
          client_name: clientName || '',
          doc_type: docType || 'document',
          doc_title: docTitle || '',
          delivery_method: 'fax',
          recipient: cleanFax,
          message: senderNote || '',
          status: 'failed',
          sent_at: new Date().toISOString(),
          notes: deliveryNotes,
        });
        return Response.json({ error: `FAXAGE error: ${rawResp.trim()}` }, { status: 502 });
      }

    } else {
      // --- Fallback: email-to-fax via SMTP ---
      const smtpHost = Deno.env.get('SMTP_HOST');
      const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
      const smtpUser = Deno.env.get('SMTP_USER');
      const smtpPass = Deno.env.get('SMTP_PASS');
      const gatewayDomain = Deno.env.get('FAX_GATEWAY_DOMAIN') || 'fax.faxage.com';

      if (!smtpHost || !smtpUser || !smtpPass) {
        return Response.json({ error: 'Neither FAXAGE API credentials nor SMTP fallback configured.' }, { status: 500 });
      }

      const faxEmail = `${cleanFax}@${gatewayDomain}`;
      const faxBody = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 20px; }</style>
</head>
<body>
  <h1 style="font-size:16px; border-bottom:2px solid #1e3a5f; padding-bottom:8px;">FAX — ${docTitle || 'Document'}</h1>
  ${senderNote ? `<div style="background:#f9fafb; border:1px solid #e5e7eb; padding:14px; margin-bottom:20px;"><strong>Message:</strong><br/>${senderNote.replace(/\n/g, '<br/>')}</div>` : ''}
  ${htmlContent || ''}
</body>
</html>`;

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const info = await transporter.sendMail({
        from: `"BuildBooks Fax" <${smtpUser}>`,
        to: faxEmail,
        subject: docTitle || 'Fax Document',
        html: faxBody,
      });

      deliveryStatus = 'sent';
      deliveryNotes = `Email-to-fax via ${gatewayDomain}. Message-ID: ${info.messageId}`;
      result = { success: true, faxEmail, messageId: info.messageId };
    }

    // Log delivery record
    await base44.asServiceRole.entities.DocumentDelivery.create({
      job_id: jobId || '',
      job_title: jobTitle || '',
      client_name: clientName || '',
      doc_type: docType || 'document',
      doc_title: docTitle || '',
      delivery_method: 'fax',
      recipient: cleanFax,
      message: senderNote || '',
      status: deliveryStatus,
      sent_at: new Date().toISOString(),
      notes: deliveryNotes,
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});