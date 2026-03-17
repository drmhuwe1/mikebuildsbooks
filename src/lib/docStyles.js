// Shared print/document styles injected into the print window
export const PRINT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    color: #111;
    background: #fff;
  }

  /* ── Page wrapper ── */
  @page {
    size: 8.5in 11in;
    margin: 0;
    padding: 0;
  }
  .doc-page {
    width: 8.5in;
    height: 11in;
    padding: 0.75in 0.75in 0.9in 0.75in;
    background: #fff;
    position: relative;
    page-break-after: always;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }
  .doc-page:last-child { page-break-after: avoid; }

  /* ── Header ── */
  .doc-header {
    margin-bottom: 20px;
    margin-top: 0;
    flex-shrink: 0;
  }
  .doc-header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #0a1f3d;
    padding-bottom: 12px;
    gap: 20px;
    page-break-inside: avoid;
  }
  
  /* Logo and Company Info Section */
  .doc-header-logo-section {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    flex: 1;
  }
  .doc-header-logo {
    flex-shrink: 0;
  }
  .doc-header-logo img {
    max-height: 45px;
    width: auto;
    object-fit: contain;
  }
  .doc-header-company {
    flex: 1;
  }
  .doc-header-company .company-name {
    font-size: 16pt;
    font-weight: bold;
    color: #0a1f3d;
    line-height: 1.3;
    margin-bottom: 6px;
    letter-spacing: 0.02em;
  }
  .doc-header-company .company-meta {
    font-size: 10pt;
    color: #444;
    line-height: 1.6;
    font-weight: 600;
  }
  
  /* Document Title Section */
  .doc-header-right {
    text-align: right;
    flex-shrink: 0;
  }
  .doc-header-right .doc-title {
    font-size: 13pt;
    font-weight: bold;
    color: #0a1f3d;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 10px;
  }
  .doc-header-right .doc-meta {
    font-size: 9.5pt;
    color: #666;
    line-height: 1.7;
    font-weight: 500;
  }

  /* ── Footer ── */
  .doc-footer {
    margin-top: auto;
    border-top: 1px solid #ddd;
    padding-top: 12px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 8px;
    font-size: 8pt;
    color: #999;
    text-align: center;
    flex-shrink: 0;
    page-break-inside: avoid;
  }
  .doc-footer-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .doc-footer-mbb-logo {
    height: 28px;
    object-fit: contain;
  }
  .doc-footer-slogan {
    font-size: 9pt;
    font-weight: 600;
    color: #333;
    letter-spacing: 0.04em;
  }
  .doc-footer-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    font-size: 8pt;
    color: #999;
  }

  /* ── Section titles ── */
  .section-title {
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #0a1f3d;
    border-bottom: 3px solid #0a1f3d;
    padding-bottom: 11px;
    margin-bottom: 18px;
    margin-top: 32px;
  }
  .section-title:first-of-type { margin-top: 0; }
  .section-title + table { margin-top: 16px; }

  /* ── Info grid ── */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px 28px;
    margin-bottom: 24px;
  }
  .info-grid.three-col { 
    grid-template-columns: 1fr 1fr 1fr;
    gap: 18px 24px;
  }
  .info-item label {
    font-size: 10pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #0a1f3d;
    display: block;
    margin-bottom: 7px;
  }
  .info-item span {
    font-size: 12pt;
    color: #111;
    font-weight: 600;
    line-height: 1.65;
  }

  /* ── Tables ── */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0 24px 0;
    font-size: 11pt;
    line-height: 1.6;
    page-break-inside: auto;
  }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th {
    background: #0a1f3d;
    color: #fff;
    padding: 12px 14px;
    text-align: left;
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  th.num, td.num { text-align: right; }
  td {
    padding: 11px 13px;
    border-bottom: 1px solid #ddd;
    vertical-align: top;
    font-size: 11pt;
  }
  tr:nth-child(even) td { background: #f9f9f9; }
  tr.subtotal td {
    background: #eef1f6;
    font-weight: bold;
    border-top: 2px solid #0a1f3d;
  }
  tr.total td {
    background: #0a1f3d;
    color: #fff;
    font-weight: bold;
    font-size: 12pt;
    border-top: 3px solid #0a1f3d;
  }
  tr.total td.num { text-align: right; }

  /* ── Totals box ── */
  .totals-box {
    margin-left: auto;
    width: 3.2in;
    background: #f8f9fb;
    border: 1.5px solid #d4dde8;
    border-radius: 2px;
    overflow: hidden;
    page-break-inside: avoid;
    margin-bottom: 24px;
  }
  .totals-box .row {
    display: flex;
    justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid #eee;
    font-size: 11pt;
  }
  .totals-box .row:last-child { border-bottom: none; }
  .totals-box .row.grand {
    background: #0a1f3d;
    color: #fff;
    font-weight: bold;
    font-size: 11pt;
  }
  .totals-box .row label { color: #444; font-weight: 500; }
  .totals-box .row.grand label { color: #d8dcf0; }

  /* ── Highlight box ── */
  .highlight-box {
    background: #f8f9fb;
    border: 1.5px solid #d4dde8;
    border-left: 5px solid #0a1f3d;
    border-radius: 2px;
    padding: 16px 20px;
    margin-bottom: 22px;
    page-break-inside: avoid;
  }
  .highlight-box .hl-title {
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    color: #0a1f3d;
    margin-bottom: 12px;
    letter-spacing: 0.05em;
  }
  .highlight-box p { font-size: 11pt; line-height: 1.8; color: #333; margin-bottom: 13px; }
  .highlight-box p:last-child { margin-bottom: 0; }
  .highlight-box strong { color: #0a1f3d; font-weight: bold; }
  .highlight-box ul { margin: 0 0 12px 20px; padding: 0; }
  .highlight-box li { font-size: 11pt; line-height: 1.8; color: #333; margin: 9px 0; }

  /* ── Two-column summary layout ── */
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 14px;
  }

  /* ── Signature block ── */
  .signature-block {
    page-break-inside: avoid;
    margin-top: 40px;
  }
  .signature-block .sig-title {
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    color: #0a1f3d;
    margin-bottom: 24px;
    letter-spacing: 0.06em;
    border-bottom: 2px solid #0a1f3d;
    padding-bottom: 8px;
  }
  .sig-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }
  .sig-column {
    display: flex;
    flex-direction: column;
  }
  .sig-column .sig-label {
    font-size: 10pt;
    font-weight: bold;
    color: #0a1f3d;
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .sig-line {
    border-top: 1.5px solid #333;
    min-height: 32px;
    margin-bottom: 10px;
  }
  .sig-name {
    font-size: 9pt;
    color: #555;
    margin-bottom: 12px;
  }
  .sig-printed-name {
    font-size: 9pt;
    color: #555;
  }

  /* ── Misc ── */
  .text-muted { color: #777; font-size: 8.5pt; }
  .tag {
    display: inline-block;
    background: #eef1f6;
    border: 1px solid #c8d2e4;
    border-radius: 3px;
    padding: 1px 6px;
    font-size: 7.5pt;
    font-weight: 600;
    color: #1d3461;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .profit-positive { color: #16a34a; }
  .profit-negative { color: #dc2626; }
  .page-break { page-break-before: always; }
  p { 
    line-height: 1.6; 
    margin-bottom: 14px; 
    font-size: 12pt;
    orphans: 3;
    widows: 3;
  }
  p:last-child { margin-bottom: 0; }
  ul { 
    margin: 14px 0 16px 20px; 
    padding: 0;
  }
  ol {
    margin: 14px 0 16px 20px;
    padding: 0;
  }
  li { 
    font-size: 12pt; 
    line-height: 1.7; 
    margin-bottom: 9px;
  }

  @media print {
    * { margin: 0; padding: 0; }
    html, body { margin: 0; padding: 0; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; width: 8.5in; }
    .doc-page { 
      width: 8.5in; 
      height: 11in; 
      padding: 0.75in; 
      margin: 0; 
      page-break-after: always;
      page-break-inside: avoid;
    }
    .doc-page:last-child { page-break-after: avoid; }
  }
`;

export function formatCurrencyDoc(n) {
  if (n == null || isNaN(n)) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
export function formatDateDoc(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
export function formatDateShort(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
export function genDocNumber(prefix) {
  return `${prefix}-${Date.now().toString().slice(-6)}`;
}