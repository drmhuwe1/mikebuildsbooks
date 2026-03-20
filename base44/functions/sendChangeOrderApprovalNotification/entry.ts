import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import nodemailer from 'npm:nodemailer@6.9.13';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { coId, action, clientName, clientEmail, jobTitle, coNumber, coTitle, totalAmount, declineReason } = await req.json();

    const smtpHost = Deno.env.get('SMTP_HOST');
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error('SMTP not configured');
      return Response.json({ error: 'SMTP not configured' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const amountFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalAmount || 0);
    const isApproved = action === 'approved';

    const contractorSubject = isApproved
      ? `✅ Change Order ${coNumber} APPROVED by ${clientName}`
      : `❌ Change Order ${coNumber} DECLINED by ${clientName}`;

    const contractorBody = isApproved
      ? `<p>${clientName} has <strong>approved</strong> Change Order ${coNumber} (${coTitle}) for ${jobTitle}.</p><p><strong>Amount:</strong> ${(totalAmount || 0) >= 0 ? '+' : ''}${amountFormatted}</p><p>The job contract amount has been automatically updated.</p>`
      : `<p>${clientName} has <strong>declined</strong> Change Order ${coNumber} (${coTitle}) for ${jobTitle}.</p>${declineReason ? `<p><strong>Reason:</strong> ${declineReason}</p>` : ''}<p>Please contact the client to discuss next steps.</p>`;

    // Notify contractor (app user via service role)
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: smtpUser,
      subject: contractorSubject,
      body: `<html><body style="font-family:Arial,sans-serif;padding:24px;">${contractorBody}</body></html>`,
    });

    // Confirmation to client if approved
    if (isApproved && clientEmail) {
      const clientHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;padding:24px;background:#f0fdf4;">
  <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:8px;padding:24px;border:1px solid #bbf7d0;">
    <h2 style="color:#15803d;">✅ Change Order Approved</h2>
    <p>Your approval of <strong>${coTitle}</strong> (${coNumber}) has been received.</p>
    <p><strong>Job:</strong> ${jobTitle}</p>
    <p><strong>Amount Authorized:</strong> ${(totalAmount || 0) >= 0 ? '+' : ''}${amountFormatted}</p>
    <p style="color:#6b7280;font-size:12px;">Thank you. Your contractor will proceed with the work.</p>
  </div>
</body></html>`;

      await transporter.sendMail({
        from: `"MikeBuildsBooks" <${smtpUser}>`,
        to: clientEmail,
        subject: `Change Order ${coNumber} — Approval Confirmed`,
        html: clientHtml,
      });
    }

    // Create financial alert for declined COs
    if (!isApproved) {
      await base44.asServiceRole.entities.FinancialAlert.create({
        alert_type: 'margin_risk',
        severity: 'warning',
        title: `Change Order Declined: ${coNumber}`,
        message: `Client ${clientName} declined change order ${coNumber} (${coTitle}) for ${jobTitle}. Amount: ${amountFormatted}.${declineReason ? ` Reason: ${declineReason}` : ''}`,
        recommendation: 'Contact the client to discuss the scope change and reach an agreement.',
        status: 'new',
      });
    }

    console.log('Approval notification sent for CO:', coId, 'action:', action);
    return Response.json({ success: true });
  } catch (error) {
    console.error('sendChangeOrderApprovalNotification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});