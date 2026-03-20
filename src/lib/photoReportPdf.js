import { formatDateShort } from "./docStyles";

function esc(str) {
  if (str == null) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function generatePhotoReportPdf(job, photos, company = {}, opts = {}) {
  const { dateFrom, dateTo, phases, clientVisibleOnly } = opts;

  // Filter photos
  let filtered = [...photos];
  if (clientVisibleOnly) filtered = filtered.filter(p => p.is_client_visible);
  if (dateFrom) filtered = filtered.filter(p => !p.taken_at || p.taken_at >= dateFrom);
  if (dateTo) filtered = filtered.filter(p => !p.taken_at || p.taken_at <= dateTo);
  if (phases && phases.length > 0) filtered = filtered.filter(p => phases.includes(p.phase));

  // Group by phase preserving order
  const phaseOrder = ["Pre-Construction","Demo","Foundation","Framing","Rough-In","Insulation","Drywall","Finish Work","Final","Other"];
  const grouped = {};
  phaseOrder.forEach(ph => { grouped[ph] = []; });
  filtered.forEach(p => {
    const ph = p.phase || "Other";
    if (!grouped[ph]) grouped[ph] = [];
    grouped[ph].push(p);
  });

  const dateRangeLabel = [dateFrom, dateTo].filter(Boolean).join(" – ") || "All Dates";

  const phaseSections = phaseOrder
    .filter(ph => grouped[ph].length > 0)
    .map(ph => {
      const phasePhotos = grouped[ph];
      // Pair photos into rows of 2
      const rows = [];
      for (let i = 0; i < phasePhotos.length; i += 2) {
        rows.push(phasePhotos.slice(i, i + 2));
      }

      const rowsHtml = rows.map(row => `
        <tr style="page-break-inside:avoid;">
          ${row.map(photo => `
            <td style="width:50%;padding:8px;vertical-align:top;">
              <div style="border:1px solid #e2e8f0;border-radius:4px;overflow:hidden;">
                <img src="${esc(photo.file_url)}" alt="" style="width:100%;height:200px;object-fit:cover;display:block;" />
                <div style="padding:8px 10px;background:#f8fafc;">
                  ${photo.caption ? `<div style="font-size:10pt;font-weight:600;color:#1e293b;margin-bottom:3px;">${esc(photo.caption)}</div>` : ""}
                  <div style="font-size:9pt;color:#64748b;">${formatDateShort(photo.taken_at)}</div>
                  ${photo.is_client_visible ? `<div style="font-size:8pt;color:#16a34a;margin-top:2px;">&#x2713; Client Visible</div>` : ""}
                </div>
              </div>
            </td>
          `).join("")}
          ${row.length === 1 ? `<td style="width:50%;padding:8px;"></td>` : ""}
        </tr>
      `).join("");

      return `
        <div class="section-title">${esc(ph)} <span style="font-size:10pt;font-weight:normal;text-transform:none;">(${phasePhotos.length} photo${phasePhotos.length !== 1 ? "s" : ""})</span></div>
        <table style="width:100%;border-collapse:collapse;margin:0 0 16px 0;">
          <tbody>${rowsHtml}</tbody>
        </table>
      `;
    }).join("");

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
          </div>
        </div>
      </div>
      <div class="doc-header-right">
        <div class="doc-title">Photo Report</div>
        <div class="doc-meta">
          Job: ${esc(job?.title || "—")}<br/>
          Date Range: ${esc(dateRangeLabel)}<br/>
          Generated: ${formatDateShort(new Date().toISOString())}
        </div>
      </div>
    </div>
  </div>

  <!-- SUMMARY -->
  <div class="info-grid">
    <div class="info-item"><label>Job</label><span>${esc(job?.title || "—")}</span></div>
    <div class="info-item"><label>Client</label><span>${esc(job?.client_name || "—")}</span></div>
    <div class="info-item"><label>Date Range</label><span>${esc(dateRangeLabel)}</span></div>
    <div class="info-item"><label>Total Photos</label><span>${filtered.length}</span></div>
  </div>

  ${filtered.length === 0 ? `
    <div class="highlight-box"><p style="text-align:center;color:#999;">No photos match the selected criteria.</p></div>
  ` : phaseSections}

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