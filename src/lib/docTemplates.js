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

function escWithBold(str, boldKeywords = []) {
   if (str == null) return "";
   let escaped = String(str)
     .replace(/&/g, "&amp;")
     .replace(/</g, "&lt;")
     .replace(/>/g, "&gt;")
     .replace(/"/g, "&quot;");

   if (boldKeywords && boldKeywords.length > 0) {
     boldKeywords.forEach(keyword => {
       const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
       escaped = escaped.replace(regex, (match) => `<strong>${match}</strong>`);
     });
   }
   return escaped;
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

    const boldKeywords = contract.bold_keywords || [];
    const depositAmount = contract.deposit_amount || (contract.contract_amount * (contract.deposit_percent || 50) / 100);
    const secondPaymentAmount = contract.start_of_construction_amount || 0;
    const finalPayment = contract.contract_amount - depositAmount - secondPaymentAmount;
    const clientPaid = contract.client_paid_amount || 0;

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

${contract.project_description ? `<div class="highlight-box"><div class="hl-title">Project Description</div><p>${escWithBold(contract.project_description, boldKeywords)}</p></div>` : ""}

${sectionTitle("Scope of Work")}
${scopeLines.length > 0 ? `<div class="scope-list">${scopeLines.map(item => `<div class="scope-item" style="margin:8px 0;padding-left:16px;">• ${escWithBold(item, boldKeywords)}</div>`).join("")}</div>` : `<div class="highlight-box"><p>${escWithBold(contract.scope_summary || "See details above.", boldKeywords)}</p></div>`}

${sectionTitle("Contract Amount & Payment Schedule")}
<div class="highlight-box">
    ${contract.payment_schedule && contract.payment_schedule.split("\n").filter(l => l.trim()).length >= 1 ? `
    <p style="margin-bottom:12px;"><strong>Payment Breakdown:</strong></p>
    <div style="margin-left:16px;margin-bottom:12px;">
      ${contract.payment_schedule.split("\n").map(line => line.trim()).filter(l => l).map(line => `<p style="margin:8px 0;padding:6px 10px;background:#f8f8f8;border-left:3px solid #c0a020;">${escWithBold(line, boldKeywords)}</p>`).join("")}
    </div>
    ` : `
    <p><strong>${formatCurrencyDoc(depositAmount)} (${contract.deposit_percent || 50}%) Deposit:</strong></p>
    <p style="margin-left:16px;margin-top:6px;margin-bottom:12px;">Due upon acceptance of contract, prior to beginning work.</p>
    ${secondPaymentAmount > 0 ? `<p><strong>${formatCurrencyDoc(secondPaymentAmount)} ${escWithBold(contract.start_of_construction_label || "Start of Construction", boldKeywords)}:</strong></p>
    <p style="margin-left:16px;margin-top:6px;margin-bottom:12px;">As scheduled.</p>` : ""}
    ${finalPayment > 0 ? `<p><strong>${formatCurrencyDoc(finalPayment)} Final Payment:</strong></p>
    <p style="margin-left:16px;margin-top:6px;margin-bottom:12px;">Due upon substantial completion of all work.</p>` : ""}
    `}
    ${clientPaid > 0 ? `<div style="margin-top:14px;padding-top:12px;border-top:1px solid #ddd;"><p><strong>Amount Paid to Date:</strong> ${formatCurrencyDoc(clientPaid)}</p><p style="margin-top:6px;"><strong>Balance Due:</strong> ${formatCurrencyDoc(Math.max(0, contract.contract_amount - clientPaid))}</p></div>` : ""}
</div>

${sectionTitle("Change Orders")}
${contract.change_order_terms ? `<div class="highlight-box"><p>${escWithBold(contract.change_order_terms, boldKeywords)}</p></div>` : `<div class="highlight-box"><p>Any changes to the scope of work, timeline, or specifications must be documented in writing and signed by both parties prior to commencement of the changed work. Change orders may result in adjustments to the contract price and/or timeline. No extra charges shall be incurred without prior written authorization.</p></div>`}

${sectionTitle("Terms & Conditions")}
<div class="highlight-box">
    <div style="margin-bottom:12px;">
      <strong>Contractor Responsibilities:</strong>
      <p style="margin:6px 0 0 0;">${escWithBold("Contractor shall perform all work in a professional and workmanlike manner, in full compliance with applicable building codes and regulations. Contractor shall obtain all required permits unless otherwise specified. Contractor shall maintain workers' compensation and general liability insurance throughout the project duration and provide proof of insurance upon request.", boldKeywords)}</p>
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

${contract.notes ? `${sectionTitle("Additional Notes & Conditions")}<div class="highlight-box"><p>${escWithBold(contract.notes, boldKeywords)}</p></div>` : ""}

${contract.disclaimer ? `${sectionTitle("Important Disclaimers")}<div class="highlight-box"><p><strong>Additional Fees & Conditions:</strong> ${escWithBold(contract.disclaimer, boldKeywords)}</p></div>` : ""}

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
export function generateJobFinancialSummary(job, settings, company, subPayments = [], forPrint = false) {
  const docNum = `JFS-${(job.id || "").slice(-6).toUpperCase()}`;
  const s = settings || {};

  // Revenue — use actual contract + change orders
  const adjustedContract = (job.contract_amount || 0) + (job.change_orders_total || 0);
  const totalCollected = (job.total_paid_by_customer || 0) > 0 ? (job.total_paid_by_customer || 0) : (job.deposits_received || 0);
  const writeOff = job.write_off_amount || 0;
  const outstanding = Math.max(0, adjustedContract - totalCollected - writeOff);

  // Costs
  const materialCosts = job.material_costs || 0;
  const laborCosts = job.labor_costs || 0;
  const subCosts = job.subcontractor_costs || 0;
  const otherCosts = (job.permit_costs || 0) + (job.equipment_costs || 0) + (job.overhead_costs || 0) + (job.other_costs || 0);
  const totalCosts = materialCosts + laborCosts + subCosts + otherCosts;
  const grossProfit = adjustedContract - totalCosts;
  const margin = adjustedContract > 0 ? (grossProfit / adjustedContract * 100) : 0;

  // Deductions
  const managerPct = s.manager_pay_percent ?? 10;
  const managerPay = Math.max(0, grossProfit) * (managerPct / 100);
  const taxPct = s.tax_reserve_percent ?? 25;
  const opsPct = s.operating_reserve_percent ?? 5;
  const netAfterManager = grossProfit - managerPay;
  const taxReserve = Math.max(0, netAfterManager) * (taxPct / 100);
  const opsReserve = Math.max(0, netAfterManager) * (opsPct / 100);
  const ownerProfit = netAfterManager - taxReserve - opsReserve;

  const h = header(company, "Job Financial Summary", [
    `Document #: ${docNum}`,
    `Date: ${formatDateShort(new Date().toISOString())}`,
    `Project: ${esc(job.title)}`,
  ]);
  const f = footer(company);

  const body = `
${infoGrid([
  ["Client", esc(job.client_name || "—")],
  ["Project", esc(job.title || "—")],
  ["Status", `<span class="tag">${esc(job.status?.replace(/_/g, " ") || "—")}</span>`],
  ["Address", esc(job.address || "—")],
])}

${sectionTitle("Revenue")}
<table>
  <thead><tr><th>Item</th><th class="num">Amount</th></tr></thead>
  <tbody>
    <tr><td>Contract Amount</td><td class="num">${formatCurrencyDoc(job.contract_amount)}</td></tr>
    ${(job.change_orders_total || 0) > 0 ? `<tr><td>Change Orders</td><td class="num">+ ${formatCurrencyDoc(job.change_orders_total)}</td></tr>` : ""}
    <tr class="subtotal"><td>Adjusted Contract Total</td><td class="num">${formatCurrencyDoc(adjustedContract)}</td></tr>
    <tr><td>Total Collected</td><td class="num">${formatCurrencyDoc(totalCollected)}</td></tr>
    ${writeOff > 0 ? `<tr><td>Written Off</td><td class="num">${formatCurrencyDoc(writeOff)}</td></tr>` : ""}
    <tr><td>Outstanding Balance</td><td class="num">${formatCurrencyDoc(outstanding)}</td></tr>
  </tbody>
</table>

${sectionTitle("Cost Breakdown")}
<table>
  <thead><tr><th>Cost Category</th><th class="num">Amount</th></tr></thead>
  <tbody>
    ${materialCosts > 0 ? `<tr><td>Materials / Receipts</td><td class="num">${formatCurrencyDoc(materialCosts)}</td></tr>` : ""}
    ${laborCosts > 0 ? `<tr><td>Labor Costs</td><td class="num">${formatCurrencyDoc(laborCosts)}</td></tr>` : ""}
    ${subCosts > 0 ? `<tr><td>Subcontractor Pay</td><td class="num">${formatCurrencyDoc(subCosts)}</td></tr>` : ""}
    ${otherCosts > 0 ? `<tr><td>Permits / Equipment / Other</td><td class="num">${formatCurrencyDoc(otherCosts)}</td></tr>` : ""}
    <tr class="total"><td>Total Costs</td><td class="num">${formatCurrencyDoc(totalCosts)}</td></tr>
  </tbody>
</table>

${sectionTitle("Profit & Owner Distribution")}
<table>
  <tbody>
    <tr><td>Adjusted Contract Total</td><td class="num">${formatCurrencyDoc(adjustedContract)}</td></tr>
    <tr><td>Total Costs</td><td class="num">− ${formatCurrencyDoc(totalCosts)}</td></tr>
    <tr class="subtotal"><td>Gross Profit (${margin.toFixed(1)}% margin)</td><td class="num">${formatCurrencyDoc(grossProfit)}</td></tr>
    <tr><td>Manager Pay (${managerPct}%)</td><td class="num">− ${formatCurrencyDoc(managerPay)}</td></tr>
    <tr><td>Tax Reserve (${taxPct}%)</td><td class="num">− ${formatCurrencyDoc(taxReserve)}</td></tr>
    <tr><td>Operating Reserve (${opsPct}%)</td><td class="num">− ${formatCurrencyDoc(opsReserve)}</td></tr>
    <tr class="total"><td>Owner Final Profit</td><td class="num">${formatCurrencyDoc(ownerProfit)}</td></tr>
  </tbody>
</table>

${subPayments && subPayments.length > 0 ? `
${sectionTitle("Subcontractor Payment Detail")}
<table>
  <thead><tr><th>Subcontractor</th><th>Date Paid</th><th>Description</th><th class="num">Amount</th><th>Status</th></tr></thead>
  <tbody>
    ${subPayments.map(sp => `<tr>
      <td>${esc(sp.subcontractor_name || "—")}</td>
      <td>${formatDateShort(sp.payment_date) || "—"}</td>
      <td>${esc(sp.calculation_notes || sp.description || "—")}</td>
      <td class="num">${formatCurrencyDoc(sp.amount || 0)}</td>
      <td>${esc(sp.status || "—")}</td>
    </tr>`).join("")}
    <tr class="total"><td colspan="3">Total Subcontractor Payouts</td><td class="num">${formatCurrencyDoc(subPayments.reduce((sum, sp) => sum + (sp.amount || 0), 0))}</td><td></td></tr>
  </tbody>
</table>
` : ""}
`;

  return page(body, h, f);
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
  const clientPaid = bid.client_paid_amount || 0;

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

${bid.project_description ? `<div class="highlight-box"><div class="hl-title">Project Description</div><p>${esc(bid.project_description)}</p></div>` : ""}

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
    ${finalPayAmt > 0 ? `<p><strong>Final Payment (Upon Completion):</strong> ${formatCurrencyDoc(finalPayAmt)}</p>` : ""}
    ${clientPaid > 0 ? `<p style="margin-top:8px;padding-top:8px;border-top:1px solid #ddd;"><strong>Amount Paid to Date:</strong> ${formatCurrencyDoc(clientPaid)}</p>` : ""}
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
  const clientPaid = bid.client_paid_amount || 0;

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

${bid.project_description ? `<div class="highlight-box"><div class="hl-title">Project Description</div><p>${esc(bid.project_description)}</p></div>` : ""}

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
    ${finalPayAmt > 0 ? `<p><strong>Final Payment (Upon Completion):</strong> ${formatCurrencyDoc(finalPayAmt)}</p>` : ""}
    ${clientPaid > 0 ? `<p style="margin-top:8px;padding-top:8px;border-top:1px solid #ddd;"><strong>Amount Paid to Date:</strong> ${formatCurrencyDoc(clientPaid)}</p>` : ""}
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