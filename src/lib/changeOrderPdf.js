import { formatCurrencyDoc, formatDateShort, genDocNumber } from "./docStyles";

function esc(str) {
  if (str == null) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const REASON_LABELS = {
  client_request: "Client Request",
  unforeseen_condition: "Unforeseen Condition",
  design_change: "Design Change",
  material_substitution: "Material Substitution",
  other: "Other",
};

export function generateChangeOrderPdf(co, company = {}) {
  const docNum = co.change_order_number || `CO-${(co.id || "").slice(-6).toUpperCase()}`;
  const lineItems = co.line_items || [];
  const totalAmount = co.total_amount || 0;
  const isCredit = totalAmount < 0;

  // Group line items by category
  const grouped = {};
  lineItems.forEach(item => {
    const cat = item.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  const lineItemRows = Object.entries(grouped).map(([cat, items]) => `
    <tr><td colspan="5" style="background:#f0f4f8;font-weight:bold;font-size:9pt;padding:5px 8px;text-transform:uppercase;letter-spacing:0.05em;color:#0a1f3d;">${esc(cat)}</td></tr>
    ${items.map(item => `<tr>
      <td style="padding:5px 8px;">${esc(item.description)}</td>
      <td class="num" style="padding:5px 8px;">${item.quantity || 0}</td>
      <td style="padding:5px 8px;">${esc(item.unit)}</td>
      <td class="num" style="padding:5px 8px;">${formatCurrencyDoc(item.unit_cost)}</td>
      <td class="num" style="padding:5px 8px;">${formatCurrencyDoc(item.total_cost)}</td>
    </tr>`).join("")}
  `).join("");

  return `
<div class="doc-page">
  <!-- HEADER -->
  <div class="doc-header">
    <div class="doc-header-content">
      <div class="doc-header-logo-section">
        ${company.company_logo_url ? `<div class="doc-header-logo"><img src="${esc(company.company_logo_url)}" alt="${esc(company.company_name)}" /></div>` : ""}
        <div class="doc-header-company">
          <div class="company-name">${esc(company.company_name || "Your Company")}</div>
          <div class="company-meta">
            ${esc(company.company_address || "")}<br/>
            ${esc(company.company_phone || "")}${company.company_email ? ` &nbsp;|&nbsp; ${esc(company.company_email)}` : ""}
            ${company.company_ein ? `<br/>${esc(company.company_ein)}` : ""}
          </div>
        </div>
      </div>
      <div class="doc-header-right">
        <div class="doc-title">Change Order</div>
        <div class="doc-meta">
          CO #: ${esc(docNum)}<br/>
          Date: ${formatDateShort(new Date().toISOString())}
        </div>
      </div>
    </div>
  </div>

  <!-- INFO GRID -->
  <div class="info-grid">
    <div class="info-item"><label>Client</label><span><strong>${esc(co.client_name || "—")}</strong></span></div>
    <div class="info-item"><label>Job</label><span><strong>${esc(co.job_title || "—")}</strong></span></div>
    <div class="info-item"><label>Change Order #</label><span><strong>${esc(docNum)}</strong></span></div>
    <div class="info-item"><label>Reason</label><span><strong>${esc(REASON_LABELS[co.reason] || co.reason || "—")}</strong></span></div>
  </div>

  ${co.description ? `
  <div class="section-title">Description of Change</div>
  <div class="highlight-box"><p>${esc(co.description)}</p></div>
  ` : ""}

  <div class="section-title">Line Items</div>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="num">Qty</th>
        <th>Unit</th>
        <th class="num">Unit Cost</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemRows || `<tr><td colspan="5" style="text-align:center;padding:12px;color:#999;">No line items</td></tr>`}
      <tr class="subtotal">
        <td colspan="4">Subtotal</td>
        <td class="num">${formatCurrencyDoc(co.subtotal)}</td>
      </tr>
      ${co.tax_enabled ? `<tr><td colspan="4">Tax (${co.tax_rate || 0}%)</td><td class="num">${formatCurrencyDoc(co.tax_amount)}</td></tr>` : ""}
    </tbody>
  </table>

  <div class="totals-box">
    <div class="row"><label>Original Contract Amount</label><span>${formatCurrencyDoc(co.original_contract_amount)}</span></div>
    <div class="row"><label>${isCredit ? "Credit / Deduction" : "This Change Order"}</label><span style="color:${isCredit ? "#dc2626" : "#16a34a"};font-weight:bold;">${isCredit ? "" : "+"}${formatCurrencyDoc(totalAmount)}</span></div>
    <div class="row grand"><label>Revised Contract Amount</label><span>${formatCurrencyDoc(co.revised_contract_amount)}</span></div>
  </div>

  <!-- SIGNATURE BLOCK -->
  <div class="signature-block">
    <div class="sig-title">Authorized Signatures</div>
    <div class="sig-grid">
      <div class="sig-column">
        <div class="sig-label">Contractor</div>
        <div class="sig-line"></div>
        <div class="sig-name">Signature &amp; Date</div>
        <div class="sig-printed-name">${esc(company.owner_name || "Printed Name")}</div>
      </div>
      <div class="sig-column">
        <div class="sig-label">Client / Owner</div>
        <div class="sig-line"></div>
        <div class="sig-name">Signature &amp; Date</div>
        <div class="sig-printed-name">${co.client_signature ? esc(co.client_signature) : "Printed Name"}</div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="doc-footer">
    <div class="doc-footer-content">
      <img src="https://media.base44.com/images/public/69b9774720c1d890b1162f57/77973bc53_MikeBuildsBooksLogo.png" alt="MikeBuildsBooks" class="doc-footer-mbb-logo" />
      <div class="doc-footer-slogan">Strong Builds. Stronger Books.</div>
    </div>
    <div class="doc-footer-meta">
      <span>${esc(company.company_name || "")} &nbsp;|&nbsp; ${esc(company.company_address || "")}</span>
      <span>Generated ${formatDateShort(new Date().toISOString())}</span>
    </div>
  </div>
</div>`;
}