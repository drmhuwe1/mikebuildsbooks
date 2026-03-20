import { PRINT_CSS } from "./docStyles";

/**
 * Downloads a document as a named PDF by opening a styled print window.
 * The filename follows the format: DocType_ClientName_JobTitle_Date.pdf
 */
export function buildPdfFilename(docType, job) {
  const today = new Date().toISOString().slice(0, 10); // 2026-03-17
  const clean = (s) => (s || "").replace(/[^a-zA-Z0-9]+/g, "").slice(0, 24);

  const typeLabel = {
    estimate: "Estimate",
    bid_estimate: "Estimate",
    proposal: "Proposal",
    client_proposal: "Proposal",
    contract: "Contract",
    change_order: "ChangeOrder",
    financial: "FinancialSummary",
    job_financial: "FinancialSummary",
    sub_payment: "SubPaymentSummary",
    bill_summary: "BillSummary",
    document: "Document",
  }[docType] || "Document";

  const clientPart = clean(job?.client_name);
  const jobPart = clean(job?.title);
  const parts = [typeLabel, clientPart, jobPart, today].filter(Boolean);
  return parts.join("_") + ".pdf";
}

/**
 * Opens a new window, injects the HTML doc, and triggers the browser's Save as PDF dialog.
 * Title is set to the desired filename so "Save as PDF" pre-fills the correct name.
 */
export function downloadDocAsPdf(html, docType, job, docTitle) {
  const filename = buildPdfFilename(docType, job);
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("Please allow pop-ups so the PDF can be saved.");
    return;
  }

  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${filename}</title>
  <style>
    ${PRINT_CSS}
    @media print {
      html, body { margin: 0; padding: 0; }
    }
  </style>
</head>
<body>
${html}
<script>
  window.onload = function() {
    setTimeout(function() { window.print(); }, 700);
  };
<\/script>
</body>
</html>`);
  win.document.close();
}