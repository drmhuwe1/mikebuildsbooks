import { formatCurrencyDoc, formatDateDoc, formatDateShort, genDocNumber } from "./docStyles";

// ─────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────

function header(company, docTitle, meta = []) {
  return `
<div class="doc-header">
  <div class="doc-header-left">
    <div class="company-name">${esc(company.company_name || "Your Company")}</div>
    <div class="company-meta">
      ${esc(company.company_address || "")}<br/>
      ${esc(company.company_phone || "")}${company.company_email ? ` &nbsp;|&nbsp; ${esc(company.company_email)}` : ""}
      ${company.company_ein ? `<br/>${esc(company.company_ein)}` : ""}
    </div>
  </div>
  <div class="doc-header-right">
    <div class="doc-title">${esc(docTitle)}</div>
    <div class="doc-meta">${meta.map(m => esc(m)).join("<br/>")}</div>
  </div>
</div>`;
}

function footer(company, pageLabel = "Page 1") {
   const today = formatDateShort(new Date().toISOString());
   const MIKEBUILDSBOOKS_LOGO = "https://media.base44.com/images/public/69b9774720c1d890b1162f57/77973bc53_MikeBuildsBooksLogo.png";
   return `
 <div class="doc-footer">
   <span>${esc(company.company_name || "")} &nbsp;|&nbsp; ${esc(company.company_address || "")}</span>
   <span>Generated ${today}</span>
   <span style="display:flex;align-items:center;gap:4px;"><img src="${MIKEBUILDSBOOKS_LOGO}" alt="MikeBuildsBooks" style="height:14px;object-fit:contain;" /> ${esc(pageLabel)}</span>
 </div>`;
}

function infoGrid(items, cols = 2) {
  const cls = cols === 3 ? "info-grid three-col" : "info-grid";
  return `<div class="${cls}">${items.map(([label, value]) => `
  <div class="info-item"><label>${esc(label)}</label><span>${value ?? "—"}</span></div>`).join("")}
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

function sigBlock(labels = ["Contractor", "Client"]) {
  return `<div class="signature-block">
  <div class="sig-title">Authorized Signatures</div>
  <div class="sig-grid">${labels.map(l => `
    <div>
      <div class="sig-line">${esc(l)} Signature &amp; Date</div>
      <div class="sig-line" style="margin-top:20px">${esc(l)} Printed Name</div>
    </div>`).join("")}
  </div>
</div>`;
}

function page(content, headerHtml, footerHtml) {
  return `<div class="doc-page">${headerHtml}${content}${footerHtml}</div>`;
}

// ─────────────────────────────────────────────
// TEMPLATE 1 — BID ESTIMATE
// ─────────────────────────────────────────────
export function generateBidEstimate(bid, company) {
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

  const costRows = [
    ["Materials", "", formatCurrencyDoc(bid.material_cost)],
    [`Labor (${bid.labor_hours || 0} hrs @ ${formatCurrencyDoc(bid.labor_rate || 0)}/hr)`, "", formatCurrencyDoc(laborCost)],
    ["Subcontractor Work", "", formatCurrencyDoc(bid.subcontractor_cost)],
    ["Permits & Fees", "", formatCurrencyDoc(bid.permit_cost)],
    ["Equipment & Rentals", "", formatCurrencyDoc(bid.equipment_cost)],
  ].filter(([, , v]) => v !== "$0.00");

  const body = `
${infoGrid([
    ["Client", esc(bid.client_name || "—")],
    ["Project", esc(bid.title)],
    ["Status", `<span class="tag">${esc(bid.status || "draft")}</span>`],
    ["Prepared By", esc(company.company_name || "—")],
  ])}

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

${totalsBox([
    ["Total Estimated Cost", formatCurrencyDoc(totalCost)],
    [`Profit Margin (${bid.target_profit_margin || 0}%)`, formatCurrencyDoc(grossProfit)],
    ["TOTAL BID AMOUNT", formatCurrencyDoc(bidAmount), true],
  ])}

${sectionTitle("Payment Terms")}
<div class="highlight-box">
  <p><strong>${formatCurrencyDoc(depositAmt)} (${bid.deposit_percent || 50}%) Deposit Due:</strong> Prior to beginning work.</p>
  <p><strong>${formatCurrencyDoc(finalPayment)} Final Payment Due:</strong> Upon completion of work.</p>
</div>

${bid.notes ? `<div class="highlight-box"><div class="hl-title">Notes & Exclusions</div><p>${esc(bid.notes)}</p></div>` : ""}

${bid.disclaimer ? `<div class="highlight-box"><div class="hl-title">Important Notice</div><p><strong>Additional Fees & Conditions:</strong> ${esc(bid.disclaimer)}</p></div>` : ""}

${sigBlock(["Contractor", "Client / Owner"])}`;

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

${sigBlock(["Contractor", "Client / Owner"])}`;

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
  const finalPayment = contract.contract_amount - depositAmount;

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
${contract.scope_summary ? `<div class="highlight-box"><p>${esc(contract.scope_summary)}</p></div>` : "<p class='text-muted'>No scope entered.</p>"}

${sectionTitle("Payment Terms")}
<div class="highlight-box">
  <p><strong>${formatCurrencyDoc(depositAmount)} (${contract.deposit_percent || 50}%) Deposit Due:</strong> Prior to beginning work to cover material and labor costs.</p>
  <p><strong>${formatCurrencyDoc(finalPayment)} Final Payment Due:</strong> Upon completion of work.</p>
  ${contract.payment_schedule ? `<p>${esc(contract.payment_schedule)}</p>` : ""}
</div>

${sectionTitle("Change Order Terms")}
${contract.change_order_terms ? `<div class="highlight-box"><p>${esc(contract.change_order_terms)}</p></div>` : `<div class="highlight-box"><p>Any changes to the scope of work must be agreed upon in writing prior to commencement. Change orders may affect the contract price and project timeline.</p></div>`}

${sectionTitle("General Conditions")}
<div class="highlight-box">
  <p>Contractor shall perform all work in a good and workmanlike manner, in compliance with all applicable building codes and regulations. Contractor shall maintain all required insurance during the project. Owner shall provide reasonable access to the project site. Either party may terminate this contract with 14 days written notice for material breach not cured within 7 days. This contract constitutes the entire agreement between the parties.</p>
</div>

${contract.notes ? `${sectionTitle("Additional Notes")}<div class="highlight-box"><p>${esc(contract.notes)}</p></div>` : ""}

${contract.disclaimer ? `${sectionTitle("Important Disclaimers")}<div class="highlight-box"><p><strong>Additional Fees & Conditions:</strong> ${esc(contract.disclaimer)}</p></div>` : ""}

${sigBlock(["Contractor", "Client / Owner"])}`;

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

${sigBlock(["Contractor", "Client / Owner"])}`;

  return page(body, h, f);
}

// ─────────────────────────────────────────────
// TEMPLATE 5 — JOB FINANCIAL SUMMARY
// ─────────────────────────────────────────────
export function generateJobFinancialSummary(job, settings, company) {
  const docNum = `JFS-${(job.id || "").slice(-6).toUpperCase()}`;
  const h = header(company, "Job Financial Summary", [
    `Document #: ${docNum}`,
    `Date: ${formatDateShort(new Date().toISOString())}`,
    `Job: ${esc(job.title)}`,
  ]);
  const f = footer(company, "Page 1 of 1");

  const revenue = (job.contract_amount || 0) + (job.change_orders_total || 0);
  const costs = (job.material_costs || 0) + (job.labor_costs || 0) + (job.subcontractor_costs || 0) + (job.permit_costs || 0) + (job.equipment_costs || 0) + (job.overhead_costs || 0) + (job.other_costs || 0);
  const grossProfit = revenue - costs;
  const margin = revenue > 0 ? (grossProfit / revenue * 100) : 0;
  const cashCollected = job.deposits_received || 0;
  const outstanding = revenue - cashCollected;

  const s = settings || {};
  const basis = s.payout_basis === "gross_profit" ? grossProfit : s.payout_basis === "cash_collected" ? cashCollected : grossProfit;
  const allocations = [
    ["Tax Reserve", s.tax_reserve_percent || 25],
    ["Subcontractor Reserve", s.subcontractor_reserve_percent || 10],
    ["Operating Reserve", s.operating_reserve_percent || 10],
    ["Owner Payout", s.owner_payout_percent || 30],
    ["Admin Compensation", s.admin_compensation_percent || 15],
    ["Retained Earnings", s.retained_earnings_percent || 10],
  ];

  const body = `
${infoGrid([
    ["Client", esc(job.client_name || "—")],
    ["Project Address", esc(job.address || "—")],
    ["Status", `<span class="tag">${esc(job.status?.replace(/_/g, " ") || "—")}</span>`],
    ["Payout Basis", esc((s.payout_basis || "gross_profit").replace(/_/g, " "))],
    ["Start Date", formatDateShort(job.start_date)],
    ["Projected Completion", formatDateShort(job.projected_completion)],
  ])}

${sectionTitle("Revenue Summary")}
<table>
  <thead><tr><th>Item</th><th class="num">Amount</th></tr></thead>
  <tbody>
    <tr><td>Base Contract Amount</td><td class="num">${formatCurrencyDoc(job.contract_amount)}</td></tr>
    <tr><td>Change Orders</td><td class="num">${formatCurrencyDoc(job.change_orders_total)}</td></tr>
    <tr class="subtotal"><td>Total Contract Revenue</td><td class="num">${formatCurrencyDoc(revenue)}</td></tr>
    <tr><td>Cash Collected (Deposits)</td><td class="num">${formatCurrencyDoc(cashCollected)}</td></tr>
    <tr><td>Outstanding Balance</td><td class="num">${formatCurrencyDoc(outstanding)}</td></tr>
  </tbody>
</table>

${sectionTitle("Cost Breakdown")}
<table>
  <thead><tr><th>Cost Category</th><th class="num">Amount</th></tr></thead>
  <tbody>
    ${[["Materials", job.material_costs], ["Labor", job.labor_costs], ["Subcontractors", job.subcontractor_costs], ["Permits & Fees", job.permit_costs], ["Equipment", job.equipment_costs], ["Overhead", job.overhead_costs], ["Other", job.other_costs]]
      .map(([l, v]) => `<tr><td>${l}</td><td class="num">${formatCurrencyDoc(v)}</td></tr>`).join("")}
    <tr class="total"><td>Total Costs</td><td class="num">${formatCurrencyDoc(costs)}</td></tr>
  </tbody>
</table>

<div class="two-col">
  <div>
    ${totalsBox([
      ["Total Revenue", formatCurrencyDoc(revenue)],
      ["Total Costs", formatCurrencyDoc(costs)],
      [`Gross Profit (${margin.toFixed(1)}%)`, formatCurrencyDoc(grossProfit), true],
    ])}
  </div>
  <div></div>
</div>

${sectionTitle("Reserve & Payout Allocations")}
<table>
  <thead><tr><th>Bucket</th><th class="num">%</th><th class="num">Allocated Amount</th></tr></thead>
  <tbody>
    ${allocations.map(([label, pct]) => `<tr><td>${label}</td><td class="num">${pct}%</td><td class="num">${formatCurrencyDoc(Math.max(0, basis * pct / 100))}</td></tr>`).join("")}
    <tr class="subtotal"><td>Total Allocated</td><td class="num"></td><td class="num">${formatCurrencyDoc(allocations.reduce((s, [, p]) => s + Math.max(0, basis * p / 100), 0))}</td></tr>
  </tbody>
</table>`;

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
// TEMPLATE 7 — BILL CALENDAR SUMMARY
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