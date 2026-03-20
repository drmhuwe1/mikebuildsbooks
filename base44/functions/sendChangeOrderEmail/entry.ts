import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import nodemailer from 'npm:nodemailer@6.9.13';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to, clientName, jobTitle, coNumber, coTitle, totalAmount, revisedContractAmount, approvalUrl, companyName } = await req.json();
    if (!to) return Response.json({ error: 'Missing recipient email' }, { status: 400 });

    const smtpHost = Deno.env.get('SMTP_HOST');
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error('SMTP not configured');
      return Response.json({ error: 'SMTP credentials not configured' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const amountFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalAmount || 0);
    const revisedFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(revisedContractAmount || 0);

    const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
  .wrap { max-width: 600px; margin: 24px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .hdr { background: #0a1f3d; color: #fff; padding: 24px 28px; }
  .hdr h2 { margin: 0; font-size: 18px; }
  .body { padding: 24px 28px; color: #374151; font-size: 14px; line-height: 1.6; }
  .summary { background: #f0f4f8; border-radius: 6px; padding: 16px; margin: 16px 0; }
  .summary p { margin: 4px 0; }
  .btn { display: inline-block; background: #16a34a; color: #fff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px; margin: 16px 0; }
  .footer { padding: 16px 28px; background: #f9fafb; color: #9ca3af; font-size: 11px; text-align: center; border-top: 1px solid #e5e7eb; }
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr"><h2>Change Order Requires Your Approval</h2></div>
  <div class="body">
    <p>Hello ${clientName || 'Valued Client'},</p>
    <p>${companyName || 'Your contractor'} has submitted a change order for your project that requires your review and approval.</p>
    <div class="summary">
      <p><strong>Job:</strong> ${jobTitle}</p>
      <p><strong>Change Order:</strong> ${coNumber} — ${coTitle}</p>
      <p><strong>Amount:</strong> ${(totalAmount || 0) >= 0 ? '+' : ''}${amountFormatted}</p>
      <p><strong>Revised Contract Total:</strong> ${revisedFormatted}</p>
    </div>
    <p>Please review the details and either approve or decline this change order using the button below:</p>
    <a href="${approvalUrl}" class="btn">Review &amp; Approve Change Order</a>
    <p style="font-size:12px;color:#6b7280;">Or copy this link: ${approvalUrl}</p>
    <p>If you have questions, please contact ${companyName || 'your contractor'} directly.</p>
  </div>
  <div class="footer">Sent via MikeBuildsBooks &middot; Strong Builds. Stronger Books.</div>
</div>
</body>
</html>`;

    const info = await transporter.sendMail({
      from: `"${companyName || 'MikeBuildsBooks'}" <${smtpUser}>`,
      to,
      subject: `Change Order ${coNumber} — Action Required: ${coTitle}`,
      html: emailHtml,
    });

    console.log('Change order email sent:', info.messageId);
    return Response.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('sendChangeOrderEmail error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});