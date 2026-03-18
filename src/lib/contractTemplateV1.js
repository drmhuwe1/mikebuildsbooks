/**
 * UNFROZEN CONTRACT TEMPLATE v1.0
 * ================================
 * Modified: Conditional second payment line and additional fees section
 * Last updated: 2026-03-18
 */

export const CONTRACT_TEMPLATE_V1 = {
  LOCKED: false,
  VERSION: "1.0",
  DESCRIPTION: "Standard Construction Contract - Frozen Design",
  
  buildHTML: (data, company, logoUrl, forPrint = false) => {
    const clientName = data.client_name && data.client_last_name 
      ? `${data.client_name} ${data.client_last_name}`
      : data.client_name || data.client_last_name || "";
    
    const renderLines = (text) => {
      if (!text) return "";
      return text.split("\n").filter(l => l.trim()).map(l => {
        const t = l.trim();
        if (t.match(/^[-•*]/)) return `<p style="margin:2px 0 2px 24px;">&#8226; ${t.replace(/^[-•*]\s*/, "")}</p>`;
        return `<p style="margin:4px 0;">${t}</p>`;
      }).join("");
    };
    
    const scopeHtml = data.scope_summary ? renderLines(data.scope_summary) : "<p><em>As detailed in the attached bid document.</em></p>";
    const changeOrderHtml = data.change_order_terms ? renderLines(data.change_order_terms) : "<p>Any changes to the scope of work must be approved in writing and may affect project cost and timeline.</p>";
    const notesHtml = data.notes ? renderLines(data.notes) : "";
    const co = company || {};

    const money = (n) => "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const footerHtml = forPrint ? `
      <div class="page-footer">
        ${logoUrl ? `<img src="${logoUrl}" alt="Logo" />` : ''}
        <p>Strong Builds. Stronger Books.</p>
      </div>
    ` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Construction Contract</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @page {
    size: letter;
    margin: 0;
  }

  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: ${forPrint ? '10pt' : '9.5pt'};
    line-height: 1.5;
    color: #111;
    ${!forPrint ? 'background: #ccc; margin: 0; padding: 12px;' : 'background: white; margin: 0; padding: 0;'}
  }

  .page-wrap {
    ${!forPrint ? 'width: 8.5in; margin: 0 auto 12px; background: white; padding: 0.75in 0.5in; box-shadow: 0 4px 16px rgba(0,0,0,0.25); min-height: 11in;' : 'width: 8.5in; height: 11in; margin: 0; padding: 0.75in 0.5in; box-sizing: border-box; page-break-after: always; page-break-inside: avoid; position: relative; display: flex; flex-direction: column;'}
  }

  .page-wrap:last-of-type {
    page-break-after: avoid;
  }

  .page-content {
    ${forPrint ? 'flex: 1;' : ''}
  }

  .page-footer {
    ${forPrint ? 'text-align: center; margin-top: 0.3in; font-size: 8pt; color: #666; flex-shrink: 0;' : 'display: none;'}
  }

  .page-footer img {
    ${forPrint ? 'height: 0.15in; width: auto; display: block; margin: 0 auto 0.01in;' : ''}
  }

  .page-footer p {
    ${forPrint ? 'margin: 0; font-size: 7pt; line-height: 1.2;' : ''}
  }

  @media print {
    body { background: white; margin: 0; padding: 0; }
    .page-wrap:last-of-type { page-break-after: avoid; }
  }

  /* ── HEADER ── */
  .hdr {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding-bottom: 10px;
    border-bottom: 2.5px solid #111;
    margin-bottom: 18px;
  }
  .hdr-logo { max-height: 70px; max-width: 100px; object-fit: contain; }
  .hdr-co { flex: 1; }
  .hdr-co-name { font-size: 16pt; font-weight: bold; }
  .hdr-co-detail { font-size: 9.5pt; margin-top: 4px; line-height: 1.45; }
  .hdr-owner { font-size: 10pt; text-align: right; white-space: nowrap; }
  .hdr-owner strong { display: block; }

  /* ── TITLE ── */
  .doc-title {
    font-size: 14pt;
    font-weight: bold;
    text-align: center;
    text-decoration: underline;
    margin: 10px 0 18px;
  }

  /* ── KEY INFO TABLE ── */
  table.info { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  table.info td { font-size: 10.5pt; padding: 4px 0; vertical-align: bottom; }
  table.info td.lbl { font-weight: bold; width: 130px; }
  table.info td.val { border-bottom: 1px solid #111; padding-bottom: 2px; min-width: 160px; }
  table.info td.gap { width: 36px; }

  /* ── SECTIONS ── */
  .sec-head {
    font-size: 11pt;
    font-weight: bold;
    text-decoration: underline;
    margin: 16px 0 5px;
  }
  .sec-body {
    font-size: 10.5pt;
    padding-left: 8px;
    line-height: 1.55;
  }
  .sec-body p { margin: 3px 0; }

  /* ── SIGNATURE ── */
  .sig-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    margin-top: 32px;
  }
  .sig-party { font-size: 10.5pt; font-weight: bold; margin-bottom: 6px; }
  .sig-name { font-size: 10pt; margin-bottom: 14px; }
  .sig-line-wrap { margin-bottom: 18px; }
  .sig-line { border-bottom: 1.5px solid #111; height: 36px; }
  .sig-cap { font-size: 9pt; font-weight: bold; text-align: center; margin-top: 3px; }
  .binding {
    text-align: center;
    font-weight: bold;
    font-size: 10.5pt;
    margin-top: 22px;
  }
</style>
</head>
<body>

<!-- PAGE 1 -->
<div class="page-wrap">
<div class="page-content">

  <!-- HEADER -->
  <div class="hdr">
    ${co.company_logo_url ? `<img src="${co.company_logo_url}" class="hdr-logo" alt="Logo">` : ""}
    <div class="hdr-co">
      <div class="hdr-co-name">${co.company_name || "Thornburg Construction"}</div>
      <div class="hdr-co-detail">
        ${co.company_address ? co.company_address + "<br>" : ""}
        ${co.company_phone ? "Phone: " + co.company_phone : ""}
        ${co.company_email ? "<br>Email: " + co.company_email : ""}
      </div>
    </div>
    <div class="hdr-owner">
      <strong>Company Owner:</strong>
      ${co.owner_name || "Joshua Thornburg"}
    </div>
  </div>

  <div class="doc-title">CONSTRUCTION CONTRACT AGREEMENT</div>

  <!-- KEY INFO -->
   <table class="info">
     <tr>
       <td class="lbl">Client/Owner:</td>
       <td class="val">${clientName || "________________________________"}</td>
       <td class="gap"></td>
       <td class="lbl">Contract Amount:</td>
       <td class="val">${money(data.contract_amount)}</td>
     </tr>
     <tr>
       <td class="lbl" style="padding-top:10px;">Address:</td>
       <td class="val" style="padding-top:10px;">${data.client_address || "________________________________"}</td>
       <td class="gap"></td>
       <td class="lbl" style="padding-top:10px;">Est. Completion:</td>
       <td class="val" style="padding-top:10px;">${data.estimated_completion || "________________________________"}</td>
     </tr>
     <tr>
       <td class="lbl" style="padding-top:10px;">Start Date:</td>
       <td class="val" style="padding-top:10px;">${data.start_date || "________________________________"}</td>
       <td class="gap"></td>
       <td></td>
       <td></td>
     </tr>
   </table>

   ${data.project_description ? `
   <div class="sec-head">1. PROJECT DESCRIPTION</div>
   <div class="sec-body" style="margin-bottom: 12px;">${renderLines(data.project_description)}</div>
   ` : ""}

   <!-- SCOPE -->
   <div class="sec-head">${data.project_description ? "2" : "1"}. SCOPE OF WORK</div>
   <div class="sec-body" style="margin-bottom: 12px;">${scopeHtml}</div>

  <!-- PAYMENT -->
  <div class="sec-head">${data.project_description ? "3" : "2"}. PAYMENT SCHEDULE</div>
  <div class="sec-body" style="margin-bottom: 12px;">
    <p>&#8226; Deposit (Upon Acceptance): &nbsp;<strong>${money(data.deposit_amount)}</strong></p>
    <p>&#8226; Final Payment (Upon Completion): &nbsp;<strong>${money(data.final_payment_amount)}</strong></p>
    ${Number(data.client_paid_amount || 0) > 0 ? `<p style="border-top: 1px solid #999; margin-top: 8px; padding-top: 8px;"><strong>Amount Paid to Date:</strong> ${money(data.client_paid_amount)}</p><p><strong>Balance Due:</strong> ${money(Math.max(0, data.contract_amount - data.client_paid_amount))}</p>` : ""}
  </div>

</div>
${footerHtml}
</div>

<!-- PAGE 2 -->
<div class="page-wrap">
<div class="page-content">

  <!-- UNFORESEEN -->
  <div class="sec-head">${data.project_description ? "4" : "3"}. UNFORESEEN CIRCUMSTANCES</div>
  <div class="sec-body" style="margin-bottom: 12px;">
    <p>Any unforeseen conditions or changes discovered during the work that were not originally apparent or specified in this Contract may require additional time and/or cost. The Contractor will notify the Owner/Client of such conditions and provide a written estimate for any additional work required. Work shall not proceed on unforeseen items until written approval and authorization is received from the Owner/Client.</p>
  </div>

  <!-- CHANGE ORDERS -->
  <div class="sec-head">${data.project_description ? "5" : "4"}. CHANGE ORDERS</div>
  <div class="sec-body" style="margin-bottom: 12px;">${changeOrderHtml}</div>

  ${notesHtml ? `
  <div class="sec-head">${data.project_description ? "6" : "5"}. TERMS &amp; CONDITIONS</div>
  <div class="sec-body" style="margin-bottom: 12px;">${notesHtml}</div>
  ` : ""}

  ${data.disclaimer ? `
  <div class="sec-head">${notesHtml ? (data.project_description ? "7" : "6") : (data.project_description ? "6" : "5")}. ADDITIONAL FEES &amp; CONDITIONS</div>
  <div class="sec-body" style="margin-bottom: 12px;">${renderLines(data.disclaimer)}</div>
  ` : ""}

  <!-- LEGAL TERMS -->
  <div class="sec-head">${data.disclaimer ? (notesHtml ? (data.project_description ? "8" : "7") : (data.project_description ? "7" : "6")) : (notesHtml ? (data.project_description ? "7" : "6") : (data.project_description ? "6" : "5"))}. LEGAL TERMS</div>
  <div class="sec-body" style="margin-bottom: 16px;">
    <p>This Contract constitutes the entire agreement between the parties. All work shall be performed in a professional manner in compliance with all applicable federal, state, and local laws and building codes. The Contractor warrants that all materials will be of good quality and all work will be completed in a workmanlike manner.</p>
    <p style="margin-top:6px;">Any modifications to this Contract must be made in writing and signed by both parties. The Contractor is responsible for obtaining all necessary permits unless otherwise specified.</p>
  </div>

  <!-- SIGNATURES -->
  <div class="sig-grid" style="margin-top: 4px;">
    <div>
      <div class="sig-party">CONTRACTOR:</div>
      <div class="sig-name">
        <strong>${co.company_name || "Thornburg Construction"}</strong><br>
        By: ${co.owner_name || "Joshua Thornburg"}
      </div>
      <div class="sig-line-wrap">
        <div class="sig-line"></div>
        <div class="sig-cap">Signature</div>
      </div>
      <div class="sig-line-wrap">
        <div class="sig-line"></div>
        <div class="sig-cap">Date</div>
      </div>
    </div>
    <div>
      <div class="sig-party">OWNER/CLIENT:</div>
      <div class="sig-name">
        <strong>${clientName || "________________________________"}</strong>
      </div>
      <div class="sig-line-wrap">
        <div class="sig-line"></div>
        <div class="sig-cap">Signature</div>
      </div>
      <div class="sig-line-wrap">
        <div class="sig-line"></div>
        <div class="sig-cap">Date</div>
      </div>
    </div>
  </div>

  <div class="binding" style="margin-top: 4px;">This contract is legally binding when signed by both parties.</div>

</div>
${footerHtml}
</div>



</body>
</html>`;
  }
};