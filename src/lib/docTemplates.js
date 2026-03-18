import { formatCurrencyDoc, formatDateDoc, formatDateShort, genDocNumber } from "./docStyles";

// ─────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────

function header(company, docTitle, meta = []) {
  return `
<div class="doc-header">
  <div class="doc-header-content">
    <div class="doc-header-logo-section">
      ${company.company_logo_url ? `<div class="doc-header-logo"><img src="${company.company_logo_url}" alt="${esc(company.company_name)}" /></div>` : ""}
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
      <div class="doc-title">${esc(docTitle)}</div>
      <div class="doc-meta">${meta.map(m => esc(m)).join("<br/>")}</div>
    </div>
  </div>
</div>`;
}

function footer(company, pageLabel = "Page 1") {
   const today = formatDateShort(new Date().toISOString());
   const MIKEBUILDSBOOKS_LOGO = "https://media.base44.com/images/public/69b9774720c1d890b1162f57/77973bc53_MikeBuildsBooksLogo.png";
   return `
 <div class="doc-footer">
   <div class="doc-footer-content">
     <img src="${MIKEBUILDSBOOKS_LOGO}" alt="MikeBuildsBooks" class="doc-footer-mbb-logo" />
     <div class="doc-footer-slogan">Strong Builds. Stronger Books.</div>
   </div>
   <div class="doc-footer-meta">
     <span>${esc(company.company_name || "")} &nbsp;|&nbsp; ${esc(company.company_address || "")}</span>
     <span>Generated ${today}</span>
   </div>
 </div>`;
}

function infoGrid(items, cols = 2) {
   const cls = cols === 3 ? "info-grid three-col" : "info-grid";
   return `<div class="${cls}">${items.map(([label, value]) => `
   <div class="info-item"><label>${esc(label)}</label><span><strong>${value ?? "—"}</strong></span></div>`).join("")}
</div>`;
}

function sectionTitle(title) {
  return `<div class="section-title">${esc(title)}</div>`;
}

function esc(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function totalsBox(rows) {
  return `<div class="totals-box">${rows.map(([label, value, grand]) => `
  <div class="row${grand ? " grand" : ""}"><label>${esc(label)}</label><span>${esc(value)}</span></div>`).join("")}
</div>`;
}

function sigBlock(labels = ["Contractor", "Client"], ownerName = "") {
  return `<div class="signature-block">
  <div class="sig-title">Authorized Signatures</div>
  <div class="sig-grid">
    <div class="sig-column">
      <div class="sig-label">${esc(labels[0] || "Contractor")}</div>
      <div class="sig-line"></div>
      <div class="sig-name">Signature &amp; Date</div>
      <div class="sig-printed-name">${esc(ownerName || "Printed Name")}</div>
    </div>
    <div class="sig-column">
      <div class="sig-label">${esc(labels[1] || "Client / Owner")}</div>
      <div class="sig-line"></div>
      <div class="sig-name">Signature &amp; Date</div>
      <div class="sig-printed-name">Printed Name</div>
    </div>
  </div>
</div>`;
}

function page(content, headerHtml, footerHtml) {
  return `<div class="doc-page">${headerHtml}${content}${footerHtml}</div>`;
}

// ─────────────────────────────────────────────
// TEMPLATE 1 — BID ESTIMATE
// ─────────────────────────────────────────────
export function generateBidEstimate(bid, company, showInternalDetails = false) {
   const docNum = bid.id ? `EST-${bid.id.slice(-6).toUpperCase()}` : genDocNumber("EST");
   const h = header(company, "Bid Estimate", [
     `Estimate #: ${docNum}`,
     `Date: ${formatDateShort(new Date().toISOString())}`,
     bid.valid_until ? `Valid Until: ${formatDateShort(bid.valid_until)}` : "",
   ]);
   const f = footer(company, "Page 1 of 1");

   const laborCost = (bid.labor_hours || 0) * (bid.labor_rate || 0);
   const directCosts = (bid.material_cost || 0) + laborCost + (bid.subcontractor_cost || 0) + (bid.permit_cost || 0) + (bid.equipment_cost || 0);
   const overhead = directCosts * ((bid.overhead_percent || 0) / 100);
   const subtotal = directCosts + overhead;
   const contingency = subtotal * ((bid.contingency_percent || 0) / 100);
   const totalCost = subtotal + contingency;
   const bidAmount = bid.bid_amount || totalCost / (1 - (bid.target_profit_margin || 0) / 100);
   const grossProfit = bidAmount - totalCost;
   const depositAmt = bid.deposit_amount || (bidAmount * (bid.deposit_percent || 50) / 100);
   const finalPayment = bidAmount - depositAmt;

   const costRows = (showInternalDetails
     ? [
         ["Materials", "", formatCurrencyDoc(bid.material_cost)],
         [`Labor (${bid.labor_hours || 0}h @ ${formatCurrencyDoc(bid.labor_rate || 0)}/hr)`, "", formatCurrencyDoc(laborCost)],
         ["Subcontractor Work", "", formatCurrencyDoc(bid.subcontractor_cost)],
         ["Permits & Fees", "", formatCurrencyDoc(bid.permit_cost)],
         ["Equipment & Rentals", "", formatCurrencyDoc(bid.equipment_cost)],
       ]
     : [
         ["Materials", "", formatCurrencyDoc(bid.material_cost)],
         ["Labor", "", formatCurrencyDoc(laborCost)],
         ["Subcontractor Work", "", formatCurrencyDoc(bid.subcontractor_cost)],
         ["Permits & Fees", "", formatCurrencyDoc(bid.permit_cost)],
         ["Equipment & Rentals", "", formatCurrencyDoc(bid.equipment_cost)],
       ]).filter(([, , v]) => v !== "$0.00");

  const body = `
${infoGrid([
    ["Client", esc(bid.client_name || "—")],
    ["Project", esc(bid.title)],
    ["Status", `<span class="tag">${esc(bid.status || "draft")}</span>`],
    ["Prepared By", esc(company.company_name || "—")],
  ])}

${bid.project_description ? `<div class="highlight-box"><div class="hl-title">Project Description</div><p>${esc(bid.project_description)}</p></div>` : ""}

${bid.scope_summary ? `<div class="highlight-box"><div class="hl-title">Scope of Work</div><p>${esc(bid.scope_summary)}</p></div>` : ""}

${sectionTitle("Cost Breakdown")}
<table>
  <thead><tr><th>Description</th><th></th><th class="num">Amount</th></tr></thead>
  <tbody>
    ${costRows.map(([d, , v]) => `<tr><td>${d}</td><td></td><td class="num">${v}</td></tr>`).join("")}
    <tr class="subtotal"><td colspan="2">Direct Costs Subtotal</td><td class="num">${formatCurrencyDoc(directCosts)}</td></tr>
    <tr><td colspan="2">Overhead (${bid.overhead_percent || 0}%)</td><td class="num">${formatCurrencyDoc(overhead)}</td></tr>
    <tr><td colspan="2">Contingency (${bid.contingency_percent || 0}%)</td><td class="num">${formatCurrencyDoc(contingency)}</td></tr>
    <tr class="subtotal"><td colspan="2">Total Estimated Cost</td><td class="num">${formatCurrencyDoc(totalCost)}</td></tr>
  </tbody>
</table>

${bid.material_description ? `<div style="margin-top:12px;padding:8px;background:#f9f9f9;border-left:3px solid var(--primary);"><strong style="font-size:0.9em">Materials:</strong><p style="margin:4px 0 0 0;font-size:0.9em">${esc(bid.material_description)}</p></div>` : ""}
${bid.equipment_description ? `<div style="margin-top:8px;padding:8px;background:#f9f9f9;border-left:3px solid var(--primary);"><strong style="font-size:0.9em">Equipment & Rentals:</strong><p style="margin:4px 0 0 0;font-size:0.9em">${esc(bid.equipment_description)}</p></div>` : ""}
${bid.subcontractor_description ? `<div style="margin-top:8px;padding:8px;background:#f9f9f9;border-left:3px solid var(--primary);"><strong style="font-size:0.9em">Subcontractor Work:</strong><p style="margin:4px 0 0 0;font-size:0.9em">${esc(bid.subcontractor_description)}</p></div>` : ""}
${bid.permit_description ? `<div style="margin-top:8px;padding:8px;background:#f9f9f9;border-left:3px solid var(--primary);"><strong style="font-size:0.9em">Permits & Inspections:</strong><p style="margin:4px 0 0 0;font-size:0.9em">${esc(bid.permit_description)}</p></div>` : ""}

${totalsBox([
    ["Total Estimated Cost", formatCurrencyDoc(totalCost)],
    [`Profit Margin (${bid.target_profit_margin || 0}%)`, formatCurrencyDoc(grossProfit)],
    ["TOTAL BID AMOUNT", formatCurrencyDoc(bidAmount), true],
  ])}

${sectionTitle("Payment Terms")}
<div class="highlight-box">
  <p><strong>${formatCurrencyDoc(depositAmt)} (${bid.deposit_percent || 50}%) Deposit Due:</strong> Prior to beginning work.</p>
  ${bid.start_of_construction_amount ? `<p><strong>${formatCurrencyDoc(bid.start_of_construction_amount)} ${bid.start_of_construction_label || "Start of Construction"}:</strong> As scheduled.</p>` : ""}
  <p><strong>${formatCurrencyDoc(finalPayment)} Final Payment Due:</strong> Upon completion of work.</p>
</div>

${bid.notes ? `<div class="highlight-box"><div class="hl-title">Notes & Exclusions</div><p>${esc(bid.notes)}</p></div>` : ""}

${bid.disclaimer ? `<div class="highlight-box"><div class="hl-title">Important Notice</div><p><strong>Additional Fees & Conditions:</strong> ${esc(bid.disclaimer)}</p></div>` : ""}

${sigBlock(["Contractor", "Client / Owner"], company.owner_name)}`;

  return page(body, h, f);
}

// ─────────────────────────────────────────────
// TEMPLATE 2 — CLIENT PROPOSAL
// ─────────────────────────────────────────────
export function generateClientProposal(job, bid, company) {
  const docNum = `PROP-${(job.id || "").slice(-6).toUpperCase()}`;
  const h = header(company, "Construction Proposal", [
    `Proposal #: ${docNum}`,
    `Date: ${formatDateShort(new Date().toISOString())}`,
    `Project: ${esc(job.title)}`,
  ]);
  const f = footer(company, "Page 1 of 1");

  const bidAmount = bid?.bid_amount || job.contract_amount || 0;

  const body = `
${infoGrid([
    ["Prepared For", esc(job.client_name || "—")],
    ["Project Title", esc(job.title)],
    ["Project Address", esc(job.address || "—")],
    ["Prepared By", esc(company.company_name || "—")],
    ["Proposed Start", formatDateShort(job.start_date)],
    ["Est. Completion", formatDateShort(job.projected_completion)],
  ])}

${sectionTitle("Project Overview")}
${job.scope ? `<div class="highlight-box"><p>${esc(job.scope)}</p></div>` : "<p class='text-muted'>No scope description entered.</p>"}

${sectionTitle("Proposed Investment")}
${totalsBox([
    ["Base Contract Amount", formatCurrencyDoc(bidAmount)],
    ["Change Orders (if applicable)", "As quoted"],
    ["TOTAL INVESTMENT", formatCurrencyDoc(bidAmount), true],
  ])}

${sectionTitle("Terms & Conditions")}
<div class="highlight-box">
  <p>All work shall be performed in a professional and workmanlike manner in compliance with applicable building codes. ${company.company_name || "Contractor"} shall obtain all required permits unless otherwise specified. Client is responsible for providing access to the project site during scheduled work hours. Payment is due per the agreed payment schedule. Any changes to scope must be documented via written Change Order and may affect price and timeline.</p>
</div>

${sigBlock(["Contractor", "Client / Owner"], company.owner_name)}`;

  return page(body, h, f);
}

// ─────────────────────────────────────────────
// TEMPLATE 3 — CONSTRUCTION CONTRACT
// ─────────────────────────────────────────────
export function generateContract(contract, company) {
   const docNum = `CONT-${(contract.id || "").slice(-6).toUpperCase()}`;
   const h = header(company, "Construction Contract", [
     `Contract #: ${docNum}`,
     `Date: ${formatDateShort(new Date().toISOString())}`,
     `Status: ${esc(contract.status || "draft")}`,
   ]);
   const f = footer(company, "Page 1 of 1");

   const depositAmount = contract.deposit_amount || (contract.contract_amount * (contract.deposit_percent || 50) / 100);
   const secondPaymentAmount = contract.start_of_construction_amount || 0;
   const finalPayment = contract.contract_amount - depositAmount - secondPaymentAmount;

   // Parse scope summary into bullet points if it contains delimiters
   const scopeLines = (contract.scope_summary || "")
     .split(/[\n•\-*]/)
     .map(l => l.trim())
     .filter(l => l && l.length < 250);

   const body = `
${infoGrid([
     ["Client / Owner", esc(contract.client_name || "—")],
     ["Contractor", esc(company.company_name || "—")],
     ["Contract Amount", `<strong>${formatCurrencyDoc(contract.contract_amount)}</strong>`],
     ["Deposit Required", `${formatCurrencyDoc(depositAmount)} (${contract.deposit_percent || 50}%)`],
     ["Start Date", formatDateShort(contract.start_date)],
     ["Est. Completion", formatDateShort(contract.estimated_completion)],
   ])}

${sectionTitle("Scope of Work")}
${scopeLines.length > 0 ? `<div class="scope-list">${scopeLines.map(item => `<div class="scope-item" style="margin:8px 0;padding-left:16px;">• ${esc(item)}</div>`).join("")}</div>` : `<div class="highlight-box"><p>${esc(contract.scope_summary || "See details above.")}</p></div>`}

${sectionTitle("Contract Amount & Payment Schedule")}
<div class="highlight-box">
   <p><strong>${formatCurrencyDoc(depositAmount)} (${contract.deposit_percent || 50}%) Deposit:</strong></p>
   <p style="margin-left:16px;margin-top:6px;margin-bottom:12px;">Due upon acceptance of contract, prior to beginning work.</p>
   ${secondPaymentAmount > 0 ? `<p><strong>${formatCurrencyDoc(secondPaymentAmount)} ${contract.start_of_construction_label || "Start of Construction"}:</strong></p>
   <p style="margin-left:16px;margin-top:6px;margin-bottom:12px;">As scheduled.</p>` : ""}
   <p><strong>${formatCurrencyDoc(finalPayment)} Final Payment:</strong></p>
   <p style="margin-left:16px;margin-top:6px;margin-bottom:12px;">Due upon substantial completion of all work.</p>
   ${contract.payment_schedule ? `<div style="margin-top:14px;padding-top:12px;border-top:1px solid #ddd;"><strong>Detailed Payment Schedule:</strong><p style="margin-top:6px;">${esc(contract.payment_schedule)}</p></div>` : ""}
</div>

${sectionTitle("Change Orders")}
${contract.change_order_terms ? `<div class="highlight-box"><p>${esc(contract.change_order_terms)}</p></div>` : `<div class="highlight-box"><p>Any changes to the scope of work, timeline, or specifications must be documented in writing and signed by both parties prior to commencement of the changed work. Change orders may result in adjustments to the contract price and/or timeline. No extra charges shall be incurred without prior written authorization.</p></div>`}

${sectionTitle("Terms & Conditions")}
<div class="highlight-box">
   <div style="margin-bottom:12px;">
     <strong>Contractor Responsibilities:</strong>
     <p style="margin:6px 0 0 0;">Contractor shall perform all work in a professional and workmanlike manner, in full compliance with applicable building codes and regulations. Contractor shall obtain all required permits unless otherwise specified. Contractor shall maintain workers' compensation and general liability insurance throughout the project duration and provide proof of insurance upon request.</p>
   </div>
   <div style="margin-bottom:12px;">
     <strong>Owner Responsibilities:</strong>
     <p style="margin:6px 0 0 0;">Owner shall provide reasonable access to the project site during scheduled working hours and coordinate with Contractor regarding site logistics. Owner shall ensure that the property is clear of personal belongings in work areas.</p>
   </div>
   <div>
     <strong>Dispute Resolution:</strong>
     <p style="margin:6px 0 0 0;">Either party may terminate this contract with written notice if there is a material breach not cured within 7 days of notice. This contract constitutes the entire agreement between the parties and supersedes all prior negotiations and agreements.</p>
   </div>
</div>

${contract.notes ? `${sectionTitle("Additional Notes & Conditions")}<div class="highlight-box"><p>${esc(contract.notes)}</p></div>` : ""}

${contract.disclaimer ? `${sectionTitle("Important Disclaimers")}<div class="highlight-box"><p><strong>Additional Fees & Conditions:</strong> ${esc(contract.disclaimer)}</p></div>` : ""}

${sigBlock(["Contractor", "Client / Owner"], company.owner_name)}`;

   return page(body, h, f);
}

// ─────────────────────────────────────────────
// TEMPLATE 4 — CHANGE ORDER
// ─────────────────────────────────────────────
export function generateChangeOrder(job, changeData, company) {
  const docNum = `CO-${Date.now().toString().slice(-6)}`;
  const h = header(company, "Change Order", [
    `Change Order #: ${docNum}`,
    `Date: ${formatDateShort(new Date().toISOString())}`,
    `Job: ${esc(job.title)}`,
  ]);
  const f = footer(company, "Page 1 of 1");

  const body = `
${infoGrid([
    ["Client", esc(job.client_name || "—")],
    ["Project", esc(job.title)],
    ["Project Address", esc(job.address || "—")],
    ["Original Contract Amount", formatCurrencyDoc(job.contract_amount)],
    ["Previous Change Orders", formatCurrencyDoc(job.change_orders_total || 0)],
    ["Change Order Amount", formatCurrencyDoc(changeData.amount || 0)],
  ])}

${sectionTitle("Change Order Description")}
<div class="highlight-box"><p>${esc(changeData.description || "See details below.")}</p></div>

${sectionTitle("Financial Impact")}
<table>
  <thead><tr><th>Item</th><th class="num">Amount</th></tr></thead>
  <tbody>
    <tr><td>Original Contract Amount</td><td class="num">${formatCurrencyDoc(job.contract_amount)}</td></tr>
    <tr><td>Previous Change Orders</td><td class="num">${formatCurrencyDoc(job.change_orders_total || 0)}</td></tr>
    <tr><td>This Change Order</td><td class="num">${formatCurrencyDoc(changeData.amount || 0)}</td></tr>
    <tr class="total"><td>Revised Contract Total</td><td class="num">${formatCurrencyDoc((job.contract_amount || 0) + (job.change_orders_total || 0) + (changeData.amount || 0))}</td></tr>
  </tbody>
</table>

${sectionTitle("Schedule Impact")}
<div class="highlight-box"><p>${esc(changeData.scheduleImpact || "No change to project schedule.")}</p></div>

${sigBlock(["Contractor", "Client / Owner"], company.owner_name)}`;

  return page(body, h, f);
}

// ─────────────────────────────────────────────
// TEMPLATE 5 — JOB FINANCIAL SUMMARY
// ─────────────────────────────────────────────
export function generateJobFinancialSummary(job, settings, company, forPrint = false) {
   const docNum = `JFS-${(job.id || "").slice(-6).toUpperCase()}`;
   const co = company || {};
   const s = settings || {};

   const revenue = (job.total_paid_by_customer || 0) + (job.change_orders_total || 0);
   const costs = (job.material_costs || 0) + (job.labor_costs || 0) + (job.subcontractor_costs || 0) + (job.permit_costs || 0) + (job.equipment_costs || 0) + (job.overhead_costs || 0) + (job.other_costs || 0);
   const grossProfit = revenue - costs;
   const margin = revenue > 0 ? (grossProfit / revenue * 100) : 0;
   const outstanding = (job.contract_amount || 0) - (job.total_paid_by_customer || 0);

   const basis = s.payout_basis === "gross_profit" ? grossProfit : s.payout_basis === "cash_collected" ? revenue : grossProfit;
   const allocations = [
     ["Tax Reserve", s.tax_reserve_percent || 25],
     ["Subcontractor Reserve", s.subcontractor_reserve_percent || 10],
     ["Operating Reserve", s.operating_reserve_percent || 10],
     ["Owner Payout", s.owner_payout_percent || 30],
     ["Admin Compensation", s.admin_compensation_percent || 15],
     ["Retained Earnings", s.retained_earnings_percent || 10],
   ];

   const money = (n) => "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

   const footerHtml = forPrint ? `
     <div class="page-footer">
       ${co.company_logo_url ? `<img src="${co.company_logo_url}" alt="Logo" />` : ''}
       <p>Strong Builds. Stronger Books.</p>
     </div>
   ` : '';

   const mbbLogo = "https://media.base44.com/images/public/69b9774720c1d890b1162f57/77973bc53_MikeBuildsBooksLogo.png";

   const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Job Financial Summary</title>
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

  .page-wrap:last-of-type { page-break-after: avoid; }

  .page-content { ${forPrint ? 'flex: 1;' : ''} }

  .page-footer {
    ${forPrint ? 'text-align: center; margin-top: 0.3in; font-size: 8pt; color: #666; flex-shrink: 0;' : 'display: none;'}
  }

  .page-footer img {
    ${forPrint ? 'height: 0.15in; width: auto; display: block; margin: 0 auto 0.01in;' : ''}
  }

  .page-footer p { ${forPrint ? 'margin: 0; font-size: 7pt; line-height: 1.2;' : ''} }

  @media print {
    body { background: white; margin: 0; padding: 0; }
    .page-wrap:last-of-type { page-break-after: avoid; }
  }

  /* HEADER */
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

  /* TITLE */
  .doc-title {
    font-size: 14pt;
    font-weight: bold;
    text-align: center;
    text-decoration: underline;
    margin: 10px 0 18px;
  }

  /* INFO TABLE */
  table.info { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  table.info td { font-size: 10.5pt; padding: 4px 0; vertical-align: bottom; }
  table.info td.lbl { font-weight: bold; width: 130px; }
  table.info td.val { border-bottom: 1px solid #111; padding-bottom: 2px; min-width: 160px; }
  table.info td.gap { width: 36px; }

  /* SECTIONS */
  .sec-head {
    font-size: 11pt;
    font-weight: bold;
    text-decoration: underline;
    margin: 14px 0 6px;
  }
  .sec-body { font-size: 10.5pt; padding-left: 8px; line-height: 1.55; }
  .sec-body p { margin: 3px 0; }

  /* DATA TABLES */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
    font-size: 10pt;
  }
  table thead { background: #f9f9f9; border-bottom: 2px solid #111; }
  table th { text-align: left; padding: 6px 4px; font-weight: bold; }
  table td { padding: 4px; }
  table tr.subtotal { border-top: 1px solid #ccc; font-weight: bold; }
  table tr.total { border-top: 2px solid #111; font-weight: bold; }
  table td.num { text-align: right; font-family: monospace; }
</style>
</head>
<body>

<div class="page-wrap">
<div class="page-content">

  <!-- HEADER -->
  <div class="hdr">
    ${co.company_logo_url ? `<img src="${co.company_logo_url}" class="hdr-logo" alt="Logo">` : ""}
    <div class="hdr-co">
      <div class="hdr-co-name">${co.company_name || "Construction Co"}</div>
      <div class="hdr-co-detail">
        ${co.company_address ? co.company_address + "<br>" : ""}
        ${co.company_phone ? "Phone: " + co.company_phone : ""}
        ${co.company_email ? "<br>Email: " + co.company_email : ""}
      </div>
    </div>
    <div class="hdr-owner">
      <strong>Document:</strong>
      Financial Summary
    </div>
  </div>

  <div class="doc-title">JOB FINANCIAL SUMMARY</div>

  <!-- KEY INFO -->
  <table class="info">
    <tr>
      <td class="lbl">Client:</td>
      <td class="val">${esc(job.client_name || "—")}</td>
      <td class="gap"></td>
      <td class="lbl">Project:</td>
      <td class="val">${esc(job.title || "—")}</td>
    </tr>
    <tr>
      <td class="lbl" style="padding-top:10px;">Status:</td>
      <td class="val" style="padding-top:10px;">${esc(job.status?.replace(/_/g, " ") || "—")}</td>
      <td class="gap"></td>
      <td class="lbl" style="padding-top:10px;">Address:</td>
      <td class="val" style="padding-top:10px;">${esc(job.address || "—")}</td>
    </tr>
  </table>

  <div class="sec-head">Revenue Summary</div>
  <table>
    <thead><tr><th>Item</th><th class="num">Amount</th></tr></thead>
    <tbody>
      <tr><td>Contract Amount</td><td class="num">${money(job.contract_amount)}</td></tr>
      <tr><td>Change Orders</td><td class="num">${money(job.change_orders_total)}</td></tr>
      <tr class="subtotal"><td>Total Revenue</td><td class="num">${money(job.contract_amount + (job.change_orders_total || 0))}</td></tr>
      <tr><td>Cash Collected</td><td class="num">${money(job.total_paid_by_customer)}</td></tr>
      <tr><td>Outstanding Balance</td><td class="num">${money(outstanding)}</td></tr>
    </tbody>
  </table>

  <div class="sec-head">Cost Breakdown</div>
  <table>
    <thead><tr><th>Cost Category</th><th class="num">Amount</th></tr></thead>
    <tbody>
      ${[["Materials", job.material_costs], ["Labor", job.labor_costs], ["Subcontractors", job.subcontractor_costs], ["Permits & Fees", job.permit_costs], ["Equipment", job.equipment_costs], ["Overhead", job.overhead_costs], ["Other", job.other_costs]]
        .map(([l, v]) => `<tr><td>${l}</td><td class="num">${money(v)}</td></tr>`).join("")}
      <tr class="total"><td>Total Costs</td><td class="num">${money(costs)}</td></tr>
    </tbody>
  </table>

  <div class="sec-head">Profit Analysis</div>
  <table>
    <tbody>
      <tr><td>Total Revenue</td><td class="num">${money(revenue)}</td></tr>
      <tr><td>Total Costs</td><td class="num">${money(costs)}</td></tr>
      <tr class="total"><td>Gross Profit (${margin.toFixed(1)}%)</td><td class="num">${money(grossProfit)}</td></tr>
    </tbody>
  </table>

  <div class="sec-head">Reserve & Payout Allocations</div>
  <table>
    <thead><tr><th>Allocation</th><th class="num">%</th><th class="num">Amount</th></tr></thead>
    <tbody>
      ${allocations.map(([label, pct]) => `<tr><td>${label}</td><td class="num">${pct}%</td><td class="num">${money(Math.max(0, basis * pct / 100))}</td></tr>`).join("")}
      <tr class="total"><td>Total Allocated</td><td class="num">100%</td><td class="num">${money(basis)}</td></tr>
    </tbody>
  </table>

</div>
${footerHtml}
</div>

</body>
</html>`;

   return html;
}

// ─────────────────────────────────────────────
// TEMPLATE 6 — SUBCONTRACTOR PAYMENT SUMMARY
// ─────────────────────────────────────────────
export function generateSubPaymentSummary(subcontractors, payments, company) {
  const docNum = `SPS-${Date.now().toString().slice(-6)}`;
  const h = header(company, "Subcontractor Payment Summary", [
    `Document #: ${docNum}`,
    `Date: ${formatDateShort(new Date().toISOString())}`,
    `Period: All Time`,
  ]);
  const f = footer(company, "Page 1 of 1");

  const year = new Date().getFullYear();
  const ytdPayments = payments.filter(p => p.status === "paid" && p.payment_date?.startsWith(String(year)));

  const rows = subcontractors.map(sub => {
    const subPayments = ytdPayments.filter(p => p.subcontractor_id === sub.id);
    const total = subPayments.reduce((s, p) => s + (p.amount || 0), 0);
    return { sub, total, count: subPayments.length };
  }).filter(r => r.total > 0 || r.sub.status === "active");

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const threshold1099 = 600;

  const body = `
${infoGrid([
    ["Period", `Year ${year} (YTD)`],
    ["Total Subcontractors", String(subcontractors.length)],
    ["Total Paid YTD", formatCurrencyDoc(grandTotal)],
    ["1099 Threshold", formatCurrencyDoc(threshold1099)],
  ])}

${sectionTitle("Subcontractor Payments — Year-to-Date")}
<table>
  <thead><tr><th>Name</th><th>Company</th><th>W-9</th><th class="num">Payments</th><th class="num">YTD Total</th><th>1099 Required</th></tr></thead>
  <tbody>
    ${rows.map(({ sub, total, count }) => `
    <tr>
      <td>${esc(sub.name)}</td>
      <td>${esc(sub.company || "—")}</td>
      <td>${sub.w9_received ? "✓ On File" : "<strong>MISSING</strong>"}</td>
      <td class="num">${count}</td>
      <td class="num">${formatCurrencyDoc(total)}</td>
      <td>${total >= threshold1099 ? "<strong>Yes</strong>" : "No"}</td>
    </tr>`).join("")}
    <tr class="total"><td colspan="4">Grand Total</td><td class="num">${formatCurrencyDoc(grandTotal)}</td><td></td></tr>
  </tbody>
</table>

${sectionTitle("Payment Detail")}
<table>
  <thead><tr><th>Subcontractor</th><th>Job</th><th>Date</th><th>Description</th><th class="num">Amount</th></tr></thead>
  <tbody>
    ${ytdPayments.length === 0 ? `<tr><td colspan="5" style="text-align:center;color:#888">No payments recorded for ${year}</td></tr>` :
      ytdPayments.map(p => `<tr>
      <td>${esc(p.subcontractor_name || "—")}</td>
      <td>${esc(p.job_title || "—")}</td>
      <td>${formatDateShort(p.payment_date)}</td>
      <td>${esc(p.description || "—")}</td>
      <td class="num">${formatCurrencyDoc(p.amount)}</td>
    </tr>`).join("")}
    ${ytdPayments.length > 0 ? `<tr class="subtotal"><td colspan="4">Total</td><td class="num">${formatCurrencyDoc(grandTotal)}</td></tr>` : ""}
  </tbody>
</table>`;

  return page(body, h, f);
}

// ─────────────────────────────────────────────
// TEMPLATE 7 — PROFESSIONAL BID (CUSTOMER COPY - NO LABOR RATE)
// ─────────────────────────────────────────────
export function generateProfessionalBidCustomer(bid, company) {
  const docNum = `BID-${(bid.id || "").slice(-6).toUpperCase()}`;
  const h = header(company, bid.title || "Project Proposal & Bid", [
    `Bid #: ${docNum}`,
    `Date: ${formatDateShort(new Date().toISOString())}`,
    bid.valid_until ? `Valid Until: ${formatDateShort(bid.valid_until)}` : "",
  ]);
  const f = footer(company, "Customer Copy");

  const depositAmt = bid.deposit_amount || (bid.bid_amount * ((bid.deposit_percent || 50) / 100));
  const startConstAmt = bid.start_of_construction_amount || 0;
  const finalPayAmt = bid.final_payment_amount || (bid.bid_amount - depositAmt - startConstAmt);

  const scopeLines = (bid.scope_summary || "")
    .split(/[\n•\-*]/)
    .map(l => l.trim())
    .filter(l => l && l.length < 200);

  const body = `
${infoGrid([
  ["Client", esc(bid.client_name || "—")],
  ["Project", esc(bid.title)],
  ["Address", esc(bid.project_address || "—")],
  ["Date", formatDateShort(new Date().toISOString())],
])}

${bid.project_description ? `${sectionTitle("Project Description")}
<div class="highlight-box"><p>${esc(bid.project_description)}</p></div>` : ""}

${sectionTitle("Scope of Work")}
${scopeLines.length > 0 ? `<div class="scope-list">${scopeLines.map(item => `<div class="scope-item">• ${esc(item)}</div>`).join("")}</div>` : `<p>${esc(bid.scope_summary || "See details above.")}</p>`}

${bid.included_in_bid ? `${sectionTitle("Included in This Bid")}
<ul style="margin:12px 0;padding-left:20px;">
${(bid.included_in_bid || "").split(/[\n•\-*]/).map(l => l.trim()).filter(l => l).map(item => `<li style="margin:6px 0;line-height:1.5">${esc(item)}</li>`).join("")}
</ul>` : ""}

${bid.material_description ? `${sectionTitle("Materials")}<div class="highlight-box"><p>${esc(bid.material_description)}</p></div>` : ""}
${bid.equipment_description ? `${sectionTitle("Equipment & Rentals")}<div class="highlight-box"><p>${esc(bid.equipment_description)}</p></div>` : ""}
${bid.subcontractor_description ? `${sectionTitle("Subcontractor Work")}<div class="highlight-box"><p>${esc(bid.subcontractor_description)}</p></div>` : ""}
${bid.permit_description ? `${sectionTitle("Permits & Inspections")}<div class="highlight-box"><p>${esc(bid.permit_description)}</p></div>` : ""}

${sectionTitle("Proposed Investment")}
${totalsBox([
  ["Base Project Cost", formatCurrencyDoc(bid.bid_amount || 0)],
  ["TOTAL PROJECT INVESTMENT", formatCurrencyDoc(bid.bid_amount || 0), true],
])}

${sectionTitle("Payment Schedule")}
<div class="highlight-box">
  <div style="margin:12px 0;padding:8px;border-left:3px solid var(--primary);background:#f0f0f0;">
    <p><strong>Deposit (Upon Acceptance):</strong> ${formatCurrencyDoc(depositAmt)}</p>
    ${startConstAmt > 0 ? `<p><strong>Start of Construction:</strong> ${formatCurrencyDoc(startConstAmt)}</p>` : ""}
    <p><strong>Final Payment (Upon Completion):</strong> ${formatCurrencyDoc(finalPayAmt)}</p>
  </div>
</div>

${bid.material_responsibility ? `${sectionTitle("Material Responsibility")}
<div class="highlight-box"><p>${esc(bid.material_responsibility)}</p></div>` : ""}

${bid.project_timeline ? `${sectionTitle("Project Timeline")}
<div class="highlight-box"><p><strong>Estimated Duration:</strong> ${esc(bid.project_timeline)}</p></div>` : ""}

${bid.terms_and_conditions ? `${sectionTitle("Terms & Conditions")}
<div class="highlight-box">
${bid.unforeseen_conditions ? `<div style="margin-bottom:12px;"><strong>Unforeseen Conditions:</strong><p style="margin:4px 0 0 0;font-size:0.95em">${esc(bid.unforeseen_conditions)}</p></div>` : ""}
${bid.change_orders ? `<div style="margin-bottom:12px;"><strong>Potential Changes:</strong><p style="margin:4px 0 0 0;font-size:0.95em">${esc(bid.change_orders)}</p></div>` : ""}
${bid.permits_inspections ? `<div style="margin-bottom:12px;"><strong>Permits & Inspections:</strong><p style="margin:4px 0 0 0;font-size:0.95em">${esc(bid.permits_inspections)}</p></div>` : ""}
${bid.weather_delays ? `<div style="margin-bottom:12px;"><strong>Weather Delays:</strong><p style="margin:4px 0 0 0;font-size:0.95em">${esc(bid.weather_delays)}</p></div>` : ""}
${bid.site_access ? `<div><strong>Site Access:</strong><p style="margin:4px 0 0 0;font-size:0.95em">${esc(bid.site_access)}</p></div>` : ""}
</div>` : ""}

${bid.exclusions ? `${sectionTitle("Exclusions")}
<div class="highlight-box"><p><strong>The following are NOT included in this bid:</strong></p>
<ul style="margin:8px 0;padding-left:20px;">
${(bid.exclusions || "").split(/[\n•\-*]/).map(l => l.trim()).filter(l => l).map(item => `<li style="margin:4px 0;font-size:0.95em">${esc(item)}</li>`).join("")}
</ul></div>` : ""}

${bid.notes ? `${sectionTitle("Additional Information")}
<div class="highlight-box"><p>${esc(bid.notes)}</p></div>` : ""}

${sigBlock(["Contractor", "Client / Owner"], company.owner_name)}`;

  return page(body, h, f);
}

// ─────────────────────────────────────────────
// TEMPLATE 8 — PROFESSIONAL BID (CONTRACTOR COPY - WITH LABOR RATE)
// ─────────────────────────────────────────────
export function generateProfessionalBidContractor(bid, company) {
  const docNum = `BID-${(bid.id || "").slice(-6).toUpperCase()}`;
  const h = header(company, bid.title || "Project Proposal & Bid", [
    `Bid #: ${docNum}`,
    `Date: ${formatDateShort(new Date().toISOString())}`,
    `[CONTRACTOR COPY — CONFIDENTIAL]`,
  ]);
  const f = footer(company, "Contractor Copy");

  const laborCost = (bid.labor_hours || 0) * (bid.labor_rate || 0);
  const directCosts = (bid.material_cost || 0) + laborCost + (bid.subcontractor_cost || 0) + (bid.permit_cost || 0) + (bid.equipment_cost || 0);
  const overhead = directCosts * ((bid.overhead_percent || 0) / 100);
  const subtotal = directCosts + overhead;
  const contingency = subtotal * ((bid.contingency_percent || 0) / 100);
  const totalCost = subtotal + contingency;
  const grossProfit = bid.bid_amount - totalCost;
  const marginPct = bid.bid_amount > 0 ? (grossProfit / bid.bid_amount * 100) : 0;

  const depositAmt = bid.deposit_amount || (bid.bid_amount * ((bid.deposit_percent || 50) / 100));
  const startConstAmt = bid.start_of_construction_amount || 0;
  const finalPayAmt = bid.final_payment_amount || (bid.bid_amount - depositAmt - startConstAmt);

  const scopeLines = (bid.scope_summary || "")
    .split(/[\n•\-*]/)
    .map(l => l.trim())
    .filter(l => l && l.length < 200);

  const costRows = [
    ["Materials", formatCurrencyDoc(bid.material_cost)],
    [`Labor (${bid.labor_hours || 0}h @ ${formatCurrencyDoc(bid.labor_rate || 0)}/hr)`, formatCurrencyDoc(laborCost)],
    ["Subcontractors", formatCurrencyDoc(bid.subcontractor_cost)],
    ["Equipment & Rentals", formatCurrencyDoc(bid.equipment_cost)],
    ["Permits & Fees", formatCurrencyDoc(bid.permit_cost)],
  ].filter(([, v]) => v !== "$0.00");

  const body = `
${infoGrid([
  ["Client", esc(bid.client_name || "—")],
  ["Project", esc(bid.title)],
  ["Address", esc(bid.project_address || "—")],
  ["Date", formatDateShort(new Date().toISOString())],
])}

${bid.project_description ? `${sectionTitle("Project Description")}
<div class="highlight-box"><p>${esc(bid.project_description)}</p></div>` : ""}

${sectionTitle("Scope of Work")}
${scopeLines.length > 0 ? `<div class="scope-list">${scopeLines.map(item => `<div class="scope-item">• ${esc(item)}</div>`).join("")}</div>` : `<p>${esc(bid.scope_summary || "See details above.")}</p>`}

${sectionTitle("Cost Analysis")}
<table>
  <thead><tr><th>Description</th><th class="num">Amount</th></tr></thead>
  <tbody>
    ${costRows.map(([desc, amt]) => `<tr><td>${desc}</td><td class="num">${amt}</td></tr>`).join("")}
    <tr class="subtotal"><td>Direct Costs Subtotal</td><td class="num">${formatCurrencyDoc(directCosts)}</td></tr>
    <tr><td>Overhead (${bid.overhead_percent || 0}%)</td><td class="num">${formatCurrencyDoc(overhead)}</td></tr>
    <tr><td>Contingency (${bid.contingency_percent || 0}%)</td><td class="num">${formatCurrencyDoc(contingency)}</td></tr>
    <tr class="subtotal"><td>Total Estimated Cost</td><td class="num">${formatCurrencyDoc(totalCost)}</td></tr>
  </tbody>
</table>

${totalsBox([
  ["Total Estimated Cost", formatCurrencyDoc(totalCost)],
  [`Gross Profit (${marginPct.toFixed(1)}%)`, formatCurrencyDoc(grossProfit)],
  ["BID AMOUNT TO CLIENT", formatCurrencyDoc(bid.bid_amount || 0), true],
])}

${sectionTitle("Payment Schedule")}
<div class="highlight-box">
  <div style="margin:12px 0;padding:8px;border-left:3px solid var(--primary);background:#f0f0f0;">
    <p><strong>Deposit (Upon Acceptance):</strong> ${formatCurrencyDoc(depositAmt)}</p>
    ${startConstAmt > 0 ? `<p><strong>${bid.start_of_construction_label || "Start of Construction"}:</strong> ${formatCurrencyDoc(startConstAmt)}</p>` : ""}
    <p><strong>Final Payment (Upon Completion):</strong> ${formatCurrencyDoc(finalPayAmt)}</p>
    ${bid.client_paid_amount > 0 ? `<p style="margin-top:8px;padding-top:8px;border-top:1px solid #ddd;"><strong>Amount Paid to Date:</strong> ${formatCurrencyDoc(bid.client_paid_amount)}</p>` : ""}
  </div>
</div>

${bid.included_in_bid ? `${sectionTitle("Included in This Bid")}
<ul style="margin:12px 0;padding-left:20px;">
${(bid.included_in_bid || "").split(/[\n•\-*]/).map(l => l.trim()).filter(l => l).map(item => `<li style="margin:6px 0;line-height:1.5">${esc(item)}</li>`).join("")}
</ul>` : ""}

${bid.material_responsibility ? `${sectionTitle("Material Responsibility")}
<div class="highlight-box"><p>${esc(bid.material_responsibility)}</p></div>` : ""}

${bid.project_timeline ? `${sectionTitle("Project Timeline")}
<div class="highlight-box"><p><strong>Estimated Duration:</strong> ${esc(bid.project_timeline)}</p></div>` : ""}

${bid.terms_and_conditions ? `${sectionTitle("Terms & Conditions")}
<div class="highlight-box">
${bid.unforeseen_conditions ? `<div style="margin-bottom:12px;"><strong>Unforeseen Conditions:</strong><p style="margin:4px 0 0 0;font-size:0.95em">${esc(bid.unforeseen_conditions)}</p></div>` : ""}
${bid.change_orders ? `<div style="margin-bottom:12px;"><strong>Potential Changes:</strong><p style="margin:4px 0 0 0;font-size:0.95em">${esc(bid.change_orders)}</p></div>` : ""}
${bid.permits_inspections ? `<div style="margin-bottom:12px;"><strong>Permits & Inspections:</strong><p style="margin:4px 0 0 0;font-size:0.95em">${esc(bid.permits_inspections)}</p></div>` : ""}
${bid.weather_delays ? `<div style="margin-bottom:12px;"><strong>Weather Delays:</strong><p style="margin:4px 0 0 0;font-size:0.95em">${esc(bid.weather_delays)}</p></div>` : ""}
${bid.site_access ? `<div><strong>Site Access:</strong><p style="margin:4px 0 0 0;font-size:0.95em">${esc(bid.site_access)}</p></div>` : ""}
</div>` : ""}

${bid.exclusions ? `${sectionTitle("Exclusions")}
<div class="highlight-box"><p><strong>The following are NOT included in this bid:</strong></p>
<ul style="margin:8px 0;padding-left:20px;">
${(bid.exclusions || "").split(/[\n•\-*]/).map(l => l.trim()).filter(l => l).map(item => `<li style="margin:4px 0;font-size:0.95em">${esc(item)}</li>`).join("")}
</ul></div>` : ""}

${bid.notes ? `${sectionTitle("Additional Information")}
<div class="highlight-box"><p>${esc(bid.notes)}</p></div>` : ""}

${sigBlock(["Contractor", "Client / Owner"], company.owner_name)}`;

  return page(body, h, f);
}

// ─────────────────────────────────────────────
// TEMPLATE 9 — BILL CALENDAR SUMMARY
// ─────────────────────────────────────────────
export function generateBillSummary(bills, company) {
  const docNum = `BCS-${Date.now().toString().slice(-6)}`;
  const today = new Date().toISOString().split("T")[0];
  const h = header(company, "Bill Calendar Summary", [
    `Document #: ${docNum}`,
    `Date: ${formatDateShort(new Date().toISOString())}`,
    `As of: ${formatDateShort(today)}`,
  ]);
  const f = footer(company, "Page 1 of 1");

  const pending = bills.filter(b => b.status !== "paid").sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));
  const paid = bills.filter(b => b.status === "paid");
  const overdue = pending.filter(b => b.due_date < today);
  const upcoming = pending.filter(b => !b.due_date || b.due_date >= today);
  const totalPending = pending.reduce((s, b) => s + (b.amount || 0), 0);
  const totalPaid = paid.reduce((s, b) => s + (b.amount || 0), 0);
  const totalOverdue = overdue.reduce((s, b) => s + (b.amount || 0), 0);

  const billTable = (rows) => rows.length === 0 ? "<p class='text-muted'>None</p>" : `<table>
  <thead><tr><th>Description</th><th>Vendor</th><th>Category</th><th>Due Date</th><th class="num">Amount</th><th>Status</th></tr></thead>
  <tbody>
    ${rows.map(b => `<tr>
      <td>${esc(b.title)}</td>
      <td>${esc(b.vendor || "—")}</td>
      <td>${esc(b.category || "—")}</td>
      <td>${formatDateShort(b.due_date)}</td>
      <td class="num">${formatCurrencyDoc(b.amount)}</td>
      <td><span class="tag">${esc(b.status)}</span></td>
    </tr>`).join("")}
  </tbody>
</table>`;

  const body = `
${infoGrid([
    ["Total Pending", `<strong>${formatCurrencyDoc(totalPending)}</strong>`],
    ["Total Overdue", `<strong style="color:#dc2626">${formatCurrencyDoc(totalOverdue)}</strong>`],
    ["Total Paid", formatCurrencyDoc(totalPaid)],
    ["Total Bills", String(bills.length)],
  ])}

${overdue.length > 0 ? `${sectionTitle("⚠ Overdue Bills")}${billTable(overdue)}` : ""}

${sectionTitle("Upcoming Bills")}
${billTable(upcoming)}

${sectionTitle("Paid Bills")}
${billTable(paid)}

${totalsBox([
    ["Total Pending", formatCurrencyDoc(totalPending)],
    ["Total Paid", formatCurrencyDoc(totalPaid)],
    ["TOTAL", formatCurrencyDoc(totalPending + totalPaid), true],
  ])}`;

  return page(body, h, f);
}