// lib/changeOrderPdf.js
// MikeBuildsBooks — Change Order PDF Template
// Drop-in replacement for the existing changeOrderPdf.js
// Matches the polished contract design exactly.

const MBB_LOGO_URL =
  "https://media.base44.com/images/public/69b9774720c1d890b1162f57/e28d19baa_MikeBuildsBooksLogo.png";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2 });

// ─── Build payment rows from CO record ────────────────────────────────────────
function buildPaymentRows(co) {
  if (
    co.payment_schedule &&
    Array.isArray(co.payment_schedule) &&
    co.payment_schedule.length > 0
  ) {
    return co.payment_schedule.map((p) => ({
      milestone: p.milestone || p.label || "",
      amount:
        p.amount ||
        (p.percent ? (Number(co.change_order_amount) * p.percent) / 100 : 0),
      due: p.condition || p.when || "",
    }));
  }
  // Fallback to simple deposit / final split
  const rows = [];
  if (co.deposit_amount) {
    rows.push({
      milestone: "Deposit",
      amount: co.deposit_amount,
      due: "Due upon signing of this Change Order",
    });
  }
  if (co.final_payment_amount) {
    rows.push({
      milestone: "Final Payment",
      amount: co.final_payment_amount,
      due: "Due upon completion of change order work",
    });
  }
  if (rows.length === 0 && co.change_order_amount) {
    rows.push({
      milestone: "Change Order Payment",
      amount: co.change_order_amount,
      due: "Due upon signing of this Change Order",
    });
  }
  return rows;
}

// ─── Build scope items array ──────────────────────────────────────────────────
function buildScopeItems(co) {
  const items = [];
  if (co.included_in_change_order) {
    if (Array.isArray(co.included_in_change_order)) {
      items.push(...co.included_in_change_order);
    } else {
      co.included_in_change_order
        .split(/\n|;/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => items.push(s));
    }
  } else if (co.scope_summary) {
    co.scope_summary
      .split(/\n|;/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => items.push(s));
  }
  return items;
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function generateChangeOrderHTML(co, settings = {}, job = {}) {
  const logoHtml = settings.company_logo_url
    ? `<img src="${settings.company_logo_url}" style="width:60px;height:60px;object-fit:contain;" />`
    : `<div style="width:60px;height:60px;background:#f0ede4;border-radius:4px;"></div>`;

  const mbbLogoHtml = `<img src="${MBB_LOGO_URL}" style="width:28px;height:28px;object-fit:contain;vertical-align:middle;background:transparent;" />`;

  const clientName = [co.client_name, co.client_last_name]
    .filter(Boolean)
    .join(" ");

  const paymentRows = buildPaymentRows(co);
  const scopeItems = buildScopeItems(co);

  // ── Financial calculations ──
  const originalContract = Number(co.original_contract_amount || 0);
  const changeOrderAmount = Number(co.change_order_amount || 0);
  const revisedContractTotal =
    Number(co.revised_contract_amount || 0) ||
    originalContract + changeOrderAmount;
  const amountPaid = Number(job.total_paid_by_customer || 0);
  const originalRemaining = originalContract - amountPaid;
  const amountNowDue = originalRemaining + changeOrderAmount;

  // ── Internal cost breakdown (for display only — not charged to customer) ──
  const laborCost =
    (Number(co.labor_hours) || 0) * (Number(co.labor_rate) || 0);
  const materialCost = Number(co.material_cost || 0);
  const subCost = Number(co.subcontractor_cost || 0);
  const equipmentCost = Number(co.equipment_cost || 0);
  const permitCost = Number(co.permit_cost || 0);
  const directCosts = laborCost + materialCost + subCost + equipmentCost + permitCost;
  const overhead = directCosts * (Number(co.overhead_percent || 0) / 100);
  const contingency = directCosts * (Number(co.contingency_percent || 0) / 100);

  const payRowsHTML = paymentRows
    .map(
      (p) => `
    <tr>
      <td style="padding:7px 10px;border:0.5px solid #ddd;font-size:9pt;">${p.milestone}</td>
      <td style="padding:7px 10px;border:0.5px solid #ddd;font-size:9pt;">$${fmt(p.amount)}</td>
      <td style="padding:7px 10px;border:0.5px solid #ddd;font-size:9pt;">${p.due}</td>
    </tr>`
    )
    .join("");

  const scopeHTML = scopeItems.length
    ? scopeItems.map((item) => `<p class="bullet">• ${item}</p>`).join("")
    : `<p>${co.scope_summary || co.project_description || ""}</p>`;

  const exclusionsHTML = co.exclusions
    ? `<hr class="section-rule"/>
       <h2 class="section-head">EXCLUSIONS</h2>
       <p>${co.exclusions}</p>`
    : "";

  const unforeseenHTML = co.unforeseen_conditions
    ? `<hr class="section-rule"/>
       <h2 class="section-head">UNFORESEEN CONDITIONS</h2>
       <p>${co.unforeseen_conditions}</p>`
    : `<hr class="section-rule"/>
       <h2 class="section-head">UNFORESEEN CONDITIONS</h2>
       <p>Any unforeseen conditions discovered during the work that were not originally apparent may require additional time and cost. The Contractor will notify the Client and provide a written estimate before proceeding. No work shall proceed on unforeseen items without written Client approval.</p>`;

  const termsHTML = co.change_order_terms
    ? `<hr class="section-rule"/>
       <h2 class="section-head">TERMS &amp; CONDITIONS</h2>
       <p>${co.change_order_terms}</p>`
    : "";

  const disclaimerHTML = co.disclaimer
    ? `<p style="font-size:8.5pt;color:#555;font-style:italic;margin-top:8px;">${co.disclaimer}</p>`
    : "";

  const notesHTML = co.notes
    ? `<hr class="section-rule"/>
       <h2 class="section-head">NOTES</h2>
       <p>${co.notes}</p>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  @page {
    size: letter;
    margin-top: 1.45in;
    margin-bottom: 0.9in;
    margin-left: 0.75in;
    margin-right: 0.75in;
    @top-left { content: element(header); }
    @bottom-center { content: element(footer); }
  }
  * { box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; }
  body { font-size: 10pt; line-height: 1.5; color: #1a1a1a; }

  /* ── Running header ── */
  #page-header {
    position: running(header);
    width: 100%;
    padding-bottom: 8px;
    border-bottom: 0.75px solid #ccccaa;
  }
  .header-inner { display: flex; align-items: flex-start; gap: 12px; }
  .header-company { font-size: 13pt; font-weight: 700; margin-bottom: 2px; }
  .header-sub { font-size: 8pt; color: #555; line-height: 1.6; }

  /* ── Running footer ── */
  #page-footer {
    position: running(footer);
    width: 100%;
    border-top: 0.5px solid #ccccaa;
    padding-top: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .footer-left  { font-size: 7.5pt; color: #999; font-style: italic; flex: 1; text-align: left; }
  .footer-center{ flex: 0 0 auto; padding: 0 20px; line-height: 1; }
  .footer-right { font-size: 7.5pt; color: #999; font-style: italic; flex: 1; text-align: right; }

  /* ── Typography ── */
  h1.co-title    { text-align: center; font-size: 14pt; font-weight: 700; margin: 0 0 4px; }
  .title-rule    { border: none; border-top: 1.5px solid #1a1a1a; margin: 0 0 14px; }
  .section-rule  { border: none; border-top: 0.75px solid #1a1a1a; margin: 14px 0 3px; }
  .light-rule    { border: none; border-top: 0.5px solid #ccccaa; margin: 8px 0; }
  h2.section-head{ font-size: 10.5pt; font-weight: 700; margin: 0 0 6px; page-break-after: avoid; }
  p              { margin: 0 0 6px; orphans: 3; widows: 3; }
  .bullet        { margin: 2px 0 2px 20px; font-size: 9.5pt; page-break-before: avoid; }

  /* ── Info table ── */
  .info-table    { width: 100%; border-collapse: collapse; margin-bottom: 10px; page-break-inside: avoid; }
  .info-table td { font-size: 9pt; padding: 4px 6px 4px 0; vertical-align: middle; }
  .info-label    { font-weight: 700; white-space: nowrap; padding-right: 8px !important; }
  .new-total     { font-size: 11pt; font-weight: 700; color: #1a6b3a; }

  /* ── Payment summary banner ── */
  .payment-banner {
    background: #f0f7ff;
    border: 1px solid #b8d4f0;
    border-radius: 6px;
    padding: 10px 14px;
    margin: 10px 0;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 8px;
    page-break-inside: avoid;
  }
  .banner-cell   { text-align: center; }
  .banner-label  { font-size: 7.5pt; color: #666; margin-bottom: 3px; }
  .banner-value  { font-size: 10pt; font-weight: 700; }
  .banner-dark   { background: #1a1a1a; border-radius: 4px; padding: 6px 4px; }

  /* ── Payment table ── */
  .pay-table     { width: 100%; border-collapse: collapse; margin: 8px 0; page-break-inside: avoid; }
  .pay-table th  { background: #f0ede4; font-size: 9pt; font-weight: 700; padding: 6px 10px; border: 0.5px solid #ddd; text-align: left; }
  .pay-table td  { padding: 7px 10px; border: 0.5px solid #ddd; font-size: 9pt; }
  .total-row td  { background: #f5f3ee; font-weight: 700; border: 0.75px solid #aaa; }

  /* ── Cost breakdown table ── */
  .cost-table    { width: 65%; border-collapse: collapse; margin: 8px 0; page-break-inside: avoid; }
  .cost-table td { padding: 6px 10px; border: 0.5px solid #ddd; font-size: 9pt; }
  .cost-table .subtotal-row td { background: #f5f3ee; font-weight: 600; }
  .cost-table .total-row td    { background: #f0ede4; font-weight: 700; border: 0.75px solid #aaa; }
  .cost-table .dark-row td     { background: #1a1a1a; color: #fff; font-weight: 700; border: 0.75px solid #333; }

  /* ── Alert box ── */
  .alert-box {
    background: #fff8e6;
    border: 1px solid #e6c84a;
    border-radius: 6px;
    padding: 10px 14px;
    margin: 10px 0;
    font-size: 9pt;
    page-break-inside: avoid;
  }

  /* ── Signature block ── */
  .sig-wrap      { page-break-inside: avoid; margin-top: 16px; }
  .sig-table     { width: 100%; border-collapse: collapse; }
  .sig-table td  { width: 50%; padding: 3px 0; vertical-align: bottom; font-size: 9pt; }
  .sig-line      { border-top: 1px solid #555; width: 220px; margin-top: 22px; padding-top: 3px; }
  .sig-short-line{ border-top: 1px solid #555; width: 140px; margin-top: 18px; padding-top: 3px; }
  .sig-hint      { font-size: 7.5pt; color: #999; }
  .binding       { text-align: center; font-weight: 700; font-size: 10pt; margin-top: 14px; page-break-inside: avoid; }

  /* ── Keep section heading with content ── */
  h2.section-head + p,
  h2.section-head + table,
  h2.section-head + div,
  h2.section-head + p.bullet { page-break-before: avoid; }
</style>
</head>
<body>

<!-- ═══ RUNNING HEADER ════════════════════════════════════════════════════════ -->
<div id="page-header">
  <div class="header-inner">
    ${logoHtml}
    <div style="flex:1;">
      <div class="header-company">${settings.company_name || ""}</div>
      <div class="header-sub">
        ${settings.company_address || ""}<br/>
        Phone: ${settings.company_phone || ""} &nbsp;|&nbsp; Email: ${settings.company_email || ""}<br/>
        Owner: ${settings.owner_name || ""}
      </div>
    </div>
  </div>
</div>

<!-- ═══ RUNNING FOOTER ════════════════════════════════════════════════════════ -->
<div id="page-footer">
  <div class="footer-left">Strong Builds. Stronger Books.</div>
  <div class="footer-center">${mbbLogoHtml}</div>
  <div class="footer-right">Powered by MikeBuildsBooks</div>
</div>

<!-- ═══ TITLE ═════════════════════════════════════════════════════════════════ -->
<h1 class="co-title">CHANGE ORDER</h1>
<hr class="title-rule"/>

<!-- ═══ INFO TABLE ════════════════════════════════════════════════════════════ -->
<table class="info-table">
  <tr>
    <td class="info-label">Client/Owner:</td>
    <td>${clientName}</td>
    <td class="info-label">Change Order #:</td>
    <td><strong>${co.change_order_number || "CO-001"}</strong></td>
  </tr>
  <tr>
    <td class="info-label">Project:</td>
    <td>${co.job_title || ""}</td>
    <td class="info-label">Date Issued:</td>
    <td>${co.created_at ? new Date(co.created_at).toLocaleDateString("en-US") : new Date().toLocaleDateString("en-US")}</td>
  </tr>
  <tr>
    <td class="info-label">Address:</td>
    <td>${co.client_address || ""}</td>
    <td class="info-label">Reason:</td>
    <td>${co.reason || ""}</td>
  </tr>
  <tr>
    <td class="info-label">Original Contract:</td>
    <td>$${fmt(originalContract)}</td>
    <td class="info-label">This Change Order:</td>
    <td><strong>$${fmt(changeOrderAmount)}</strong></td>
  </tr>
  <tr>
    <td class="info-label">Revised Contract Total:</td>
    <td class="new-total">$${fmt(revisedContractTotal)}</td>
    <td class="info-label">Est. Duration:</td>
    <td>${co.estimated_duration || "TBD"}</td>
  </tr>
</table>
<hr class="light-rule"/>

<!-- ═══ PAYMENT STATUS BANNER ════════════════════════════════════════════════ -->
<div class="payment-banner">
  <div class="banner-cell">
    <div class="banner-label">Original Contract</div>
    <div class="banner-value">$${fmt(originalContract)}</div>
  </div>
  <div class="banner-cell" style="border-left:1px solid #b8d4f0;">
    <div class="banner-label">Paid to Date</div>
    <div class="banner-value" style="color:#1a6b3a;">$${fmt(amountPaid)}</div>
  </div>
  <div class="banner-cell" style="border-left:1px solid #b8d4f0;">
    <div class="banner-label">Original Remaining</div>
    <div class="banner-value" style="color:#b8860b;">$${fmt(originalRemaining)}</div>
  </div>
  <div class="banner-cell banner-dark" style="border-left:1px solid #b8d4f0;">
    <div class="banner-label" style="color:#aaa;">AMOUNT NOW DUE</div>
    <div class="banner-value" style="color:#fff;">$${fmt(amountNowDue)}</div>
  </div>
</div>

<!-- ═══ 1. PROJECT DESCRIPTION ═══════════════════════════════════════════════ -->
<hr class="section-rule"/>
<h2 class="section-head">1. DESCRIPTION OF CHANGE</h2>
<p>${co.project_description || co.scope_summary || ""}</p>

<!-- ═══ 2. SCOPE OF ADDITIONAL WORK ══════════════════════════════════════════ -->
<hr class="section-rule"/>
<h2 class="section-head">2. SCOPE OF ADDITIONAL WORK</h2>
${scopeHTML}

<!-- ═══ 3. COST BREAKDOWN ════════════════════════════════════════════════════ -->
<hr class="section-rule"/>
<h2 class="section-head">3. COST BREAKDOWN</h2>
<table class="cost-table">
  ${laborCost > 0 ? `<tr><td>Labor (${co.labor_hours || 0} hrs @ $${fmt(co.labor_rate)}/hr)</td><td style="text-align:right;">$${fmt(laborCost)}</td></tr>` : ""}
  ${materialCost > 0 ? `<tr><td>Materials${co.material_description ? " — " + co.material_description : ""}</td><td style="text-align:right;">$${fmt(materialCost)}</td></tr>` : ""}
  ${subCost > 0 ? `<tr><td>Subcontractor</td><td style="text-align:right;">$${fmt(subCost)}</td></tr>` : ""}
  ${equipmentCost > 0 ? `<tr><td>Equipment</td><td style="text-align:right;">$${fmt(equipmentCost)}</td></tr>` : ""}
  ${permitCost > 0 ? `<tr><td>Permits</td><td style="text-align:right;">$${fmt(permitCost)}</td></tr>` : ""}
  <tr class="total-row"><td>TOTAL THIS CHANGE ORDER</td><td style="text-align:right;">$${fmt(changeOrderAmount)}</td></tr>
</table>

<!-- ═══ 4. CONTRACT PRICE ADJUSTMENT ═════════════════════════════════════════ -->
<hr class="section-rule"/>
<h2 class="section-head">4. CONTRACT PRICE ADJUSTMENT</h2>
<table class="cost-table">
  <tr><td>Original Contract Amount</td><td style="text-align:right;">$${fmt(originalContract)}</td></tr>
  <tr><td>This Change Order</td><td style="text-align:right;">+ $${fmt(changeOrderAmount)}</td></tr>
  <tr class="total-row"><td>REVISED CONTRACT TOTAL</td><td style="text-align:right;">$${fmt(revisedContractTotal)}</td></tr>
</table>
<table class="cost-table" style="margin-top:10px;">
  <tr><td>Amount Paid to Date</td><td style="text-align:right;color:#1a6b3a;">− $${fmt(amountPaid)}</td></tr>
  <tr><td>Original Remaining Balance</td><td style="text-align:right;">$${fmt(originalRemaining)}</td></tr>
  <tr class="dark-row"><td>AMOUNT NOW DUE</td><td style="text-align:right;">$${fmt(amountNowDue)}</td></tr>
</table>
<p style="font-size:8pt;color:#666;margin-top:4px;">
  * Amount Now Due = Original Remaining ($${fmt(originalRemaining)}) + This Change Order ($${fmt(changeOrderAmount)})
</p>

<!-- ═══ 5. PAYMENT SCHEDULE ═══════════════════════════════════════════════════ -->
<hr class="section-rule"/>
<h2 class="section-head">5. PAYMENT SCHEDULE</h2>
<table class="pay-table">
  <thead>
    <tr>
      <th style="width:38%">Milestone</th>
      <th style="width:18%">Amount</th>
      <th style="width:44%">When Due</th>
    </tr>
  </thead>
  <tbody>
    ${payRowsHTML}
    <tr class="total-row">
      <td>TOTAL THIS CHANGE ORDER</td>
      <td>$${fmt(changeOrderAmount)}</td>
      <td></td>
    </tr>
  </tbody>
</table>

<!-- ═══ 6. SCHEDULE IMPACT ════════════════════════════════════════════════════ -->
<hr class="section-rule"/>
<h2 class="section-head">6. SCHEDULE IMPACT</h2>
${co.estimated_duration
  ? `<p>This change order requires an estimated <strong>${co.estimated_duration}</strong> to complete. The project timeline will be adjusted accordingly.</p>`
  : `<p>This change order has no material impact on the project timeline unless otherwise agreed in writing.</p>`}

<!-- ═══ 7. PAYMENT TERMS ══════════════════════════════════════════════════════ -->
<hr class="section-rule"/>
<h2 class="section-head">7. PAYMENT TERMS</h2>
<div class="alert-box">
  <strong>Amount Now Due: $${fmt(amountNowDue)}</strong>
  &nbsp;(Original Remaining $${fmt(originalRemaining)} + This Change Order $${fmt(changeOrderAmount)})<br/><br/>
  Work on this change order will not begin until this Change Order is signed by both parties and the agreed payment has been received or confirmed.
  Failure to remit payment may result in suspension of work and assessment of a 1.5% monthly late fee on unpaid balances.
</div>
${disclaimerHTML}

<!-- ═══ UNFORESEEN / EXCLUSIONS / TERMS / NOTES ═══════════════════════════════ -->
${unforeseenHTML}
${exclusionsHTML}
${termsHTML}
${notesHTML}

<!-- ═══ 8. AUTHORIZATION ══════════════════════════════════════════════════════ -->
<hr class="section-rule"/>
<h2 class="section-head">8. AUTHORIZATION</h2>
<p>By signing below, both parties agree to the additional scope, cost, and terms described in this Change Order. This Change Order becomes part of the original Construction Agreement and is legally binding upon execution.</p>

<div class="sig-wrap">
  <table class="sig-table">
    <tr>
      <td><strong>CONTRACTOR</strong></td>
      <td><strong>CLIENT</strong></td>
    </tr>
    <tr>
      <td>${settings.company_name || ""}</td>
      <td>${clientName}</td>
    </tr>
    <tr>
      <td style="font-size:8.5pt;color:#555;">By: ${settings.owner_name || ""}</td>
      <td></td>
    </tr>
    <tr>
      <td><div class="sig-line"></div><div class="sig-hint">Signature</div></td>
      <td><div class="sig-line"></div><div class="sig-hint">Signature</div></td>
    </tr>
    <tr>
      <td><div class="sig-short-line"></div><div class="sig-hint">Date</div></td>
      <td><div class="sig-short-line"></div><div class="sig-hint">Date</div></td>
    </tr>
  </table>
  <p class="binding">This Change Order is legally binding when signed by both parties.</p>
</div>

</body>
</html>`;
}

// ─── Preview helper (opens in new tab — matches existing app behavior) ─────────
export function previewChangeOrderPDF(co, settings = {}, job = {}) {
  const html = generateChangeOrderHTML(co, settings, job);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export default generateChangeOrderHTML;