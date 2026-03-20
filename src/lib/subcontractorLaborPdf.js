import { PRINT_CSS, formatCurrencyDoc, formatDateShort } from "./docStyles";

function esc(str) {
  if (str == null) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function generate1099SubReport(sub, subData, company = {}, year) {
  const { payments, workEntries } = subData;
  const totalPaid = payments.reduce((s, p) => s + (p.amount_paid || 0), 0);

  // Group payments by job
  const byJob = {};
  payments.forEach(p => {
    const key = p.job_id || "no-job";
    if (!byJob[key]) byJob[key] = { title: p.job_title || "Unknown Job", total: 0, payments: [] };
    byJob[key].total += p.amount_paid || 0;
    byJob[key].payments.push(p);
  });

  const jobBreakdown = Object.values(byJob).map(j => `
    <tr>
      <td>${esc(j.title)}</td>
      <td class="num">${formatCurrencyDoc(j.total)}</td>
      <td class="num">${j.payments.length}</td>
    </tr>
  `).join("");

  const paymentRows = payments.map(p => `
    <tr>
      <td>${formatDateShort(p.payment_date)}</td>
      <td>${esc(p.job_title || "—")}</td>
      <td>${esc(p.payment_method || "—")}</td>
      <td>${esc(p.check_number || "—")}</td>
      <td class="num">${formatCurrencyDoc(p.total_amount_due || 0)}</td>
      <td class="num">${formatCurrencyDoc(p.amount_paid || 0)}</td>
    </tr>
  `).join("");

  const threshold1099 = totalPaid >= 600;

  return `
<div class="doc-page">
  <div class="doc-header">
    <div class="doc-header-content">
      <div class="doc-header-logo-section">
        ${company.company_logo_url ? `<div class="doc-header-logo"><img src="${esc(company.company_logo_url)}" alt="${esc(company.company_name)}" /></div>` : ""}
        <div class="doc-header-company">
          <div class="company-name">${esc(company.company_name || "Your Company")}</div>
          <div class="company-meta">
            ${esc(company.company_address || "")}<br/>
            ${esc(company.company_phone || "")}${company.company_email ? ` &nbsp;|&nbsp; ${esc(company.company_email)}` : ""}
          </div>
        </div>
      </div>
      <div class="doc-header-right">
        <div class="doc-title">1099-NEC Summary</div>
        <div class="doc-meta">
          Tax Year: ${esc(String(year))}<br/>
          Generated: ${formatDateShort(new Date().toISOString())}
        </div>
      </div>
    </div>
  </div>

  <div class="section-title">Contractor Information</div>
  <div class="info-grid">
    <div class="info-item"><label>Legal Name</label><span>${esc(sub.w9_full_name || sub.name)}</span></div>
    <div class="info-item"><label>Business Name</label><span>${esc(sub.w9_business_name || sub.company || "—")}</span></div>
    <div class="info-item"><label>EIN / SSN (last 4)</label><span>${esc(sub.ssn_or_ein || "—")}</span></div>
    <div class="info-item"><label>Address</label><span>${esc(sub.address || "—")}</span></div>
    <div class="info-item"><label>Specialty</label><span>${esc(sub.specialty || "—")}</span></div>
    <div class="info-item"><label>W-9 on File</label><span>${sub.w9_received ? "Yes ✓" : "No — Required"}</span></div>
  </div>

  <div class="highlight-box" style="${threshold1099 ? "border-left-color:#dc2626;" : "border-left-color:#16a34a;"}">
    <div class="hl-title">1099-NEC Compensation — Tax Year ${esc(String(year))}</div>
    <p><strong>Total NEC Compensation: ${formatCurrencyDoc(totalPaid)}</strong></p>
    <p>1099 Required: <strong style="color:${threshold1099 ? "#dc2626" : "#16a34a"};">${threshold1099 ? "YES — $600 threshold met" : "NO — Under $600 threshold"}</strong></p>
  </div>

  <div class="section-title">Payment Breakdown by Job</div>
  <table>
    <thead><tr><th>Job</th><th class="num">Amount Paid</th><th class="num">Payments</th></tr></thead>
    <tbody>${jobBreakdown || "<tr><td colspan='3' style='text-align:center;color:#999;'>No payments</td></tr>"}</tbody>
    <tr class="total"><td>Total NEC Compensation</td><td class="num">${formatCurrencyDoc(totalPaid)}</td><td></td></tr>
  </table>

  <div class="section-title">Full Payment History</div>
  <table>
    <thead><tr><th>Date</th><th>Job</th><th>Method</th><th>Check #</th><th class="num">Amount Due</th><th class="num">Amount Paid</th></tr></thead>
    <tbody>${paymentRows || "<tr><td colspan='6' style='text-align:center;color:#999;'>No payments recorded</td></tr>"}</tbody>
  </table>

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