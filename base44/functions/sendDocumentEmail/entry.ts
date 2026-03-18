/**
 * Sends a document email directly to an external recipient via SMTP.
 * Uses SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS secrets.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import nodemailer from 'npm:nodemailer@6.9.13';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to, subject, message, htmlContent, docTitle, jobId, jobTitle, clientName, docType } = await req.json();
    if (!to || !subject) return Response.json({ error: 'Missing required fields: to, subject' }, { status: 400 });

    const smtpHost = Deno.env.get('SMTP_HOST');
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');

    if (!smtpHost || !smtpUser || !smtpPass) {
      return Response.json({ error: 'SMTP credentials not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in environment variables.' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const emailBody = `<!DOCTYPE html>
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
    .doc-embed { border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; background: #fafafa; }
    .email-footer { padding: 16px 28px; background: #f9fafb; color: #9ca3af; font-size: 11px; text-align: center; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header"><h2>${docTitle || 'Document'}</h2></div>
    ${message ? `<div class="email-message"><p>${message.replace(/\n/g, '<br/>')}</p></div>` : ''}
    <div class="doc-section">
      <h3>Document</h3>
      <div class="doc-embed">${htmlContent || '<p>Document content attached.</p>'}</div>
    </div>
    <div class="email-footer">Sent via BuildBooks. Please do not reply to this email.</div>
  </div>
</body>
</html>`;

    const info = await transporter.sendMail({
      from: `"BuildBooks" <${smtpUser}>`,
      to,
      subject,
      html: emailBody,
    });

    // Log delivery
    await base44.asServiceRole.entities.DocumentDelivery.create({
      job_id: jobId || '',
      job_title: jobTitle || '',
      client_name: clientName || '',
      doc_type: docType || 'document',
      doc_title: docTitle || '',
      delivery_method: 'email',
      recipient: to,
      subject,
      message: message || '',
      status: 'sent',
      sent_at: new Date().toISOString(),
      notes: info.messageId ? `Message-ID: ${info.messageId}` : '',
    });

    return Response.json({ success: true, messageId: info.messageId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});