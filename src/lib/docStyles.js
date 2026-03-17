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
  .doc-page {
    width: 8.5in;
    min-height: 11in;
    padding: 1in 1in 1.1in 1in;
    background: #fff;
    position: relative;
    page-break-after: always;
  }
  .doc-page:last-child { page-break-after: avoid; }

  /* ── Header ── */
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #1d3461;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }
  .doc-header-left .company-name {
    font-size: 18pt;
    font-weight: bold;
    color: #1d3461;
    line-height: 1.2;
    margin-bottom: 6px;
  }
  .doc-header-left .company-meta {
    font-size: 11pt;
    color: #333;
    margin-top: 4px;
    line-height: 1.8;
  }
  .doc-header-right {
    text-align: right;
  }
  .doc-header-right .doc-title {
    font-size: 16pt;
    font-weight: bold;
    color: #1d3461;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 8px;
  }
  .doc-header-right .doc-meta {
    font-size: 11pt;
    color: #333;
    margin-top: 4px;
    line-height: 1.8;
  }

  /* ── Footer ── */
  .doc-footer {
    position: absolute;
    bottom: 0.5in;
    left: 1in;
    right: 1in;
    border-top: 1px solid #ccc;
    padding-top: 6px;
    display: flex;
    justify-content: space-between;
    font-size: 7.5pt;
    color: #777;
  }

  /* ── Section titles ── */
  .section-title {
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #1d3461;
    border-bottom: 2px solid #1d3461;
    padding-bottom: 8px;
    margin-bottom: 14px;
    margin-top: 24px;
  }
  .section-title:first-of-type { margin-top: 0; }

  /* ── Info grid ── */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 32px;
    margin-bottom: 20px;
  }
  .info-grid.three-col { grid-template-columns: 1fr 1fr 1fr; }
  .info-item label {
    font-size: 10pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #555;
    display: block;
    margin-bottom: 4px;
  }
  .info-item span {
    font-size: 12pt;
    color: #111;
    font-weight: normal;
    line-height: 1.5;
  }

  /* ── Tables ── */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 18px;
    font-size: 11pt;
    page-break-inside: auto;
  }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th {
    background: #1d3461;
    color: #fff;
    padding: 10px 12px;
    text-align: left;
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  th.num, td.num { text-align: right; }
  td {
    padding: 8px 12px;
    border-bottom: 1px solid #ddd;
    vertical-align: top;
  }
  tr:nth-child(even) td { background: #f9f9f9; }
  tr.subtotal td {
    background: #eef1f6;
    font-weight: bold;
    border-top: 2px solid #1d3461;
  }
  tr.total td {
    background: #1d3461;
    color: #fff;
    font-weight: bold;
    font-size: 12pt;
    border-top: 2px solid #1d3461;
  }
  tr.total td.num { text-align: right; }

  /* ── Totals box ── */
  .totals-box {
    margin-left: auto;
    width: 3.2in;
    border: 1px solid #c8d2e4;
    border-radius: 4px;
    overflow: hidden;
    page-break-inside: avoid;
  }
  .totals-box .row {
    display: flex;
    justify-content: space-between;
    padding: 5px 12px;
    border-bottom: 1px solid #eef1f6;
    font-size: 9pt;
  }
  .totals-box .row:last-child { border-bottom: none; }
  .totals-box .row.grand {
    background: #1d3461;
    color: #fff;
    font-weight: 700;
    font-size: 10.5pt;
  }
  .totals-box .row label { color: #555; }
  .totals-box .row.grand label { color: #cdd8f0; }

  /* ── Highlight box ── */
  .highlight-box {
    background: #f5f7fb;
    border: 1px solid #c8d2e4;
    border-left: 5px solid #1d3461;
    border-radius: 0;
    padding: 12px 16px;
    margin-bottom: 16px;
    page-break-inside: avoid;
  }
  .highlight-box .hl-title {
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    color: #1d3461;
    margin-bottom: 8px;
  }
  .highlight-box p { font-size: 11pt; line-height: 1.6; color: #333; margin-bottom: 6px; }
  .highlight-box ul { margin-left: 20px; }
  .highlight-box li { font-size: 11pt; line-height: 1.6; color: #333; margin: 4px 0; }

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
    margin-top: 36px;
  }
  .signature-block .sig-title {
    font-size: 12pt;
    font-weight: bold;
    text-transform: uppercase;
    color: #1d3461;
    margin-bottom: 14px;
  }
  .sig-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }
  .sig-line {
    border-top: 1px solid #333;
    margin-top: 40px;
    padding-top: 6px;
    font-size: 10pt;
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
  p { line-height: 1.6; margin-bottom: 10px; font-size: 12pt; }
  ul { margin-left: 20px; margin-bottom: 12px; }
  li { font-size: 12pt; line-height: 1.6; margin-bottom: 6px; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .doc-page { padding: 0; width: auto; min-height: auto; }
    .doc-footer { position: fixed; bottom: 0; }
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