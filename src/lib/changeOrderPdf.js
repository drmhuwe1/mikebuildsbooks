/**
 * Change Order PDF Template
 * Matches contractTemplateV1 style: Times New Roman, .75" margins, proper pagination.
 */

function esc(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const money = (n) =>
  "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const dateStr = (d) => {
  if (!d) return "________________________________";
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const REASON_LABELS = {
  client_request: "Client Request",
  unforeseen_condition: "Unforeseen Condition",
  design_change: "Design Change",
  material_substitution: "Material Substitution",
  other: "Other",
};

const renderLines = (text) => {
  if (!text) return "";
  return text.split("\n").filter(l => l.trim()).map(l => {
    const t = l.trim();
    if (t.match(/^[-•*]/)) return `<p style="margin:2px 0 2px 24px;">&#8226; ${t.replace(/^[-•*]\s*/, "")}</p>`;
    return `<p style="margin:4px 0;">${esc(t)}</p>`;
  }).join("");
};

export function generateChangeOrderPdf(co, company = {}) {
  const docNum = co.change_order_number || `CO-${(co.id || "").slice(-6).toUpperCase()}`;
  const clientName = [co.client_name, co.client_last_name].filter(Boolean).join(" ") || "________________________________";
  const c = company || {};
  const LOGO_URL = "https://media.base44.com/images/public/69b9774720c1d890b1162f57/17e5112da_MikeBuildsBooksLogo.png";

  const coAmount = co.change_order_amount || 0;
  const originalAmount = co.original_contract_amount || 0;
  const revisedAmount = co.revised_contract_amount || (originalAmount + coAmount);

  // Payment schedule lines
  let paymentHtml = "";
  if (co.payment_schedule && Array.isArray(co.payment_schedule) && co.payment_schedule.length > 0) {
    paymentHtml = co.payment_schedule.map(p => {
      const amt = p.percent > 0 ? money(coAmount * p.percent / 100) : money(p.amount || 0);
      return `<p>&#8226; <strong>${esc(p.milestone)}:</strong> ${amt} &mdash; ${esc(p.condition)}</p>`;
    }).join("");
  } else {
    const depositAmt = co.deposit_amount || (coAmount * (co.deposit_percent || 50) / 100);
    const finalAmt = Math.max(0, coAmount - depositAmt);
    paymentHtml = `
      <p>&#8226; <strong>Deposit (Upon Acceptance):</strong> ${money(depositAmt)}</p>
      <p>&#8226; <strong>Final Payment (Upon Completion):</strong> ${money(finalAmt)}</p>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Change Order ${esc(docNum)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @page {
    size: letter;
    margin: 0.75in;
  }

  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 10pt;
    line-height: 1.5;
    color: #111;
    background: white;
  }

  .page-wrap {
    margin: 0;
    padding: 0;
  }

  /* ── HEADER ── */
  .hdr {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding-bottom: 10px;
    border-bottom: 2.5px solid #111;
    margin-bottom: 18px;
    page-break-inside: avoid;
  }
  .hdr-logo { max-height: 70px; max-width: 100px; object-fit: contain; }
  .hdr-co { flex: 1; }
  .hdr-co-name { font-size: 16pt; font-weight: bold; }
  .hdr-co-detail { font-size: 9.5pt; margin-top: 4px; line-height: 1.45; }
  .hdr-right { text-align: right; white-space: nowrap; }
  .hdr-right .doc-title { font-size: 14pt; font-weight: bold; text-decoration: underline; }
  .hdr-right .doc-meta { font-size: 9pt; margin-top: 4px; line-height: 1.5; color: #444; }

  /* ── KEY INFO TABLE ── */
  table.info { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  table.info td { font-size: 10.5pt; padding: 4px 0; vertical-align: bottom; }
  table.info td.lbl { font-weight: bold; width: 140px; }
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
    line-height: 1.6;
    margin-bottom: 14px;
  }
  .sec-body p { margin: 3px 0; }

  /* ── FINANCIAL SUMMARY BOX ── */
  .fin-box {
    width: 3.2in;
    margin-left: auto;
    margin-bottom: 18px;
    border: 1.5px solid #ccc;
    border-collapse: collapse;
    page-break-inside: avoid;
  }
  .fin-box td { padding: 6px 10px; font-size: 10.5pt; border-bottom: 1px solid #eee; }
  .fin-box td.lbl { color: #444; }
  .fin-box td.val { text-align: right; font-weight: bold; }
  .fin-box tr.grand td { background: #111; color: #fff; font-weight: bold; }

  /* ── SIGNATURE ── */
  .sig-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    margin-top: 32px;
    page-break-inside: avoid;
  }
  .sig-party { font-size: 10.5pt; font-weight: bold; margin-bottom: 6px; }
  .sig-name { font-size: 10pt; margin-bottom: 14px; }
  .sig-line-wrap { margin-bottom: 18px; }
  .sig-line { border-bottom: 1.5px solid #111; height: 36px; }
  .sig-cap { font-size: 9pt; font-weight: bold; text-align: center; margin-top: 3px; }

  /* ── FOOTER ── */
  .page-footer {
    text-align: center;
    margin-top: 0.3in;
    font-size: 8pt;
    color: #666;
    page-break-inside: avoid;
    border-top: 1px solid #ddd;
    padding-top: 8px;
  }
  .page-footer img { height: 18px; width: auto; display: block; margin: 0 auto 4px; }

  .binding {
    text-align: center;
    font-weight: bold;
    font-size: 10.5pt;
    margin-top: 22px;
  }

  @media print {
    @page { size: letter; margin: 0.75in; }
    body { background: white; margin: 0; padding: 0; }
  }
</style>
</head>
<body>
<div class="page-wrap">

  <!-- HEADER -->
  <div class="hdr">
    ${c.company_logo_url
      ? `<img src="${esc(c.company_logo_url)}" class="hdr-logo" alt="Logo">`
      : `<img src="${LOGO_URL}" class="hdr-logo" alt="Logo">`}
    <div class="hdr-co">
      <div class="hdr-co-name">${esc(c.company_name || "Thornburg Construction")}</div>
      <div class="hdr-co-detail">
        ${c.company_address ? esc(c.company_address) + "<br>" : ""}
        ${c.company_phone ? "Phone: " + esc(c.company_phone) : ""}
        ${c.company_email ? "<br>Email: " + esc(c.company_email) : ""}
      </div>
    </div>
    <div class="hdr-right">
      <div class="doc-title">CHANGE ORDER</div>
      <div class="doc-meta">
        CO #: ${esc(docNum)}<br>
        Date: ${dateStr(new Date().toISOString())}<br>
        Job: ${esc(co.job_title || "—")}
      </div>
    </div>
  </div>

  <!-- KEY INFO -->
  <table class="info">
    <tr>
      <td class="lbl">Client/Owner:</td>
      <td class="val">${esc(clientName)}</td>
      <td class="gap"></td>
      <td class="lbl">Change Order Amount:</td>
      <td class="val">${money(coAmount)}</td>
    </tr>
    <tr>
      <td class="lbl" style="padding-top:10px;">Address:</td>
      <td class="val" style="padding-top:10px;">${esc(co.client_address || "________________________________")}</td>
      <td class="gap"></td>
      <td class="lbl" style="padding-top:10px;">Reason:</td>
      <td class="val" style="padding-top:10px;">${esc(REASON_LABELS[co.reason] || co.reason || "—")}</td>
    </tr>
    ${co.estimated_duration ? `<tr>
      <td class="lbl" style="padding-top:10px;">Est. Duration:</td>
      <td class="val" style="padding-top:10px;">${esc(co.estimated_duration)}</td>
      <td class="gap"></td><td></td><td></td>
    </tr>` : ""}
  </table>

  ${co.project_description ? `
  <div class="sec-head">1. BACKGROUND / REASON FOR CHANGE</div>
  <div class="sec-body">${renderLines(co.project_description)}</div>
  ` : ""}

  <div class="sec-head">${co.project_description ? "2" : "1"}. SCOPE OF WORK</div>
  <div class="sec-body">
    ${co.scope_summary ? renderLines(co.scope_summary) : "<p><em>As described above.</em></p>"}
  </div>

  ${co.included_in_change_order ? `
  <div class="sec-head">${co.project_description ? "3" : "2"}. INCLUDED IN THIS CHANGE ORDER</div>
  <div class="sec-body">${renderLines(co.included_in_change_order)}</div>
  ` : ""}

  <div class="sec-head">${co.project_description ? (co.included_in_change_order ? "4" : "3") : (co.included_in_change_order ? "3" : "2")}. PAYMENT SCHEDULE</div>
  <div class="sec-body">
    ${paymentHtml}
  </div>

  <!-- FINANCIAL SUMMARY -->
  <table class="fin-box">
    <tr><td class="lbl">Original Contract Amount</td><td class="val">${money(originalAmount)}</td></tr>
    <tr><td class="lbl">This Change Order</td><td class="val" style="color:#16a34a;">+ ${money(coAmount)}</td></tr>
    <tr class="grand"><td class="lbl">Revised Contract Total</td><td class="val">${money(revisedAmount)}</td></tr>
  </table>

  ${co.exclusions ? `
  <div class="sec-head">EXCLUSIONS</div>
  <div class="sec-body">${renderLines(co.exclusions)}</div>
  ` : ""}

  ${co.unforeseen_conditions ? `
  <div class="sec-head">UNFORESEEN CONDITIONS</div>
  <div class="sec-body">${renderLines(co.unforeseen_conditions)}</div>
  ` : ""}

  ${co.change_order_terms ? `
  <div class="sec-head">CHANGE ORDER TERMS</div>
  <div class="sec-body">${renderLines(co.change_order_terms)}</div>
  ` : ""}

  ${co.disclaimer ? `
  <div class="sec-head">ADDITIONAL FEES &amp; CONDITIONS</div>
  <div class="sec-body">${renderLines(co.disclaimer)}</div>
  ` : ""}

  <!-- SIGNATURES -->
  <div class="sig-grid">
    <div>
      <div class="sig-party">CONTRACTOR:</div>
      <div class="sig-name"><strong>${esc(c.company_name || "Thornburg Construction")}</strong><br>By: ${esc(c.owner_name || "")}</div>
      <div class="sig-line-wrap"><div class="sig-line"></div><div class="sig-cap">Signature</div></div>
      <div class="sig-line-wrap"><div class="sig-line"></div><div class="sig-cap">Date</div></div>
    </div>
    <div>
      <div class="sig-party">OWNER/CLIENT:</div>
      <div class="sig-name"><strong>${esc(clientName)}</strong></div>
      <div class="sig-line-wrap"><div class="sig-line"></div><div class="sig-cap">Signature</div></div>
      <div class="sig-line-wrap"><div class="sig-line"></div><div class="sig-cap">Date</div></div>
    </div>
  </div>

  <div class="binding" style="margin-top:16px;">This change order is legally binding when signed by both parties.</div>

  <!-- FOOTER -->
  <div class="page-footer">
    <img src="${LOGO_URL}" alt="MikeBuildsBooks" />
    <div>Strong Builds. Stronger Books.</div>
    <div style="margin-top:4px;">${esc(c.company_name || "")} &nbsp;|&nbsp; ${esc(c.company_address || "")} &nbsp;|&nbsp; Generated ${dateStr(new Date().toISOString())}</div>
  </div>

</div>
<script>
  window.onload = function() { setTimeout(() => { window.print(); }, 800); };
<\/script>
</body>
</html>`;
}