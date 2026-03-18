import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Edit2 } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/69b9774720c1d890b1162f57/17e5112da_MikeBuildsBooksLogo.png";
const SLOGAN = "Strong Builds. Stronger Books.";

function formatMoney(n) {
  return (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderLines(text) {
  if (!text) return "";
  return text.split("\n").map(line => {
    const t = line.trim();
    if (!t) return "";
    if (t.match(/^[-•*]/)) {
      return `<div class="bullet">• ${t.replace(/^[-•*]\s*/, "")}</div>`;
    }
    return `<div class="para">${t}</div>`;
  }).join("");
}

export default function AdvancedContractEditor({ contract, company, onClose }) {
  const frameRef = useRef(null);
  const [editData, setEditData] = useState(contract);
  const [showEdit, setShowEdit] = useState(false);

  const c = company || {};
  const d = editData || {};
  const clientName = (d.client_name || "") + (d.client_last_name ? " " + d.client_last_name : "");

  const footerHtml = `
    <div class="page-footer">
      <img src="${LOGO_URL}" class="footer-logo" alt="MikeBuildsBooks" />
      <div class="footer-slogan">${SLOGAN}</div>
    </div>`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.55;
      color: #000;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Screen: show each section as a paper-like card ── */
    .doc-wrapper {
      width: 8.5in;
      margin: 16px auto;
      background: #f0f0f0;
    }
    .doc-page {
      background: white;
      padding: 1in 1in 1in 1in;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      position: relative;
      page-break-after: always;
    }
    .doc-page:last-child {
      margin-bottom: 0;
    }

    /* ── Print: strict 1in margins, no shadows ── */
    @page {
      size: letter;
      margin: 1in 1in 1in 1in;
    }
    @media print {
      body { background: white; }
      .doc-wrapper { margin: 0; background: white; width: 100%; }
      .doc-page {
        padding: 0;
        margin: 0;
        box-shadow: none;
        page-break-after: always;
      }
      .doc-page:last-child { page-break-after: avoid; }
    }

    /* ── Company Header ── */
    .co-header {
      display: flex;
      align-items: flex-start;
      gap: 18px;
      border-bottom: 2.5px solid #000;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .co-logo { max-height: 68px; max-width: 160px; object-fit: contain; }
    .co-info { flex: 1; }
    .co-name { font-size: 14pt; font-weight: bold; margin-bottom: 3px; }
    .co-details { font-size: 9pt; line-height: 1.45; color: #222; }
    .co-owner { text-align: right; font-size: 9pt; }
    .co-owner strong { display: block; }

    /* ── Document Title ── */
    .doc-title {
      font-size: 14pt;
      font-weight: bold;
      text-align: center;
      text-decoration: underline;
      margin: 12px 0 14px 0;
      letter-spacing: 0.5px;
    }

    /* ── Info Grid ── */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 20px;
      margin-bottom: 16px;
      font-size: 10pt;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #bbb;
      padding-bottom: 3px;
    }
    .info-lbl { font-weight: bold; }

    /* ── Sections ── */
    .sec-title {
      font-size: 11pt;
      font-weight: bold;
      text-decoration: underline;
      margin: 14px 0 5px 0;
    }
    .sec-body {
      font-size: 10pt;
      padding-left: 8px;
      margin-bottom: 8px;
    }
    .bullet { margin: 2px 0 2px 16px; }
    .para { margin-bottom: 4px; }

    /* ── Signatures ── */
    .sig-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-top: 28px;
    }
    .sig-block {}
    .sig-party { font-weight: bold; font-size: 10pt; margin-bottom: 6px; }
    .sig-name { font-size: 9.5pt; margin-bottom: 8px; }
    .sig-line { border-bottom: 1px solid #000; height: 36px; margin-bottom: 3px; }
    .sig-label { font-size: 8.5pt; font-weight: bold; text-align: center; margin-bottom: 12px; }
    .binding-note {
      text-align: center;
      font-weight: bold;
      font-size: 10pt;
      margin-top: 20px;
    }

    /* ── Page Footer (logo + slogan) ── */
    .page-footer {
      margin-top: 28px;
      padding-top: 8px;
      border-top: 1px solid #999;
      text-align: center;
    }
    .footer-logo { max-height: 44px; object-fit: contain; margin-bottom: 3px; }
    .footer-slogan { font-size: 8.5pt; color: #444; }
  </style>
</head>
<body>
<div class="doc-wrapper">

  <!-- ═══════════════════ PAGE 1 ═══════════════════ -->
  <div class="doc-page">

    <!-- Company Header -->
    <div class="co-header">
      ${c.company_logo_url ? `<img src="${c.company_logo_url}" class="co-logo" alt="Logo" />` : ""}
      <div class="co-info">
        <div class="co-name">${c.company_name || "CONSTRUCTION COMPANY"}</div>
        <div class="co-details">
          ${c.company_address ? c.company_address + "<br>" : ""}
          ${c.company_phone ? "Phone: " + c.company_phone + "<br>" : ""}
          ${c.company_email ? "Email: " + c.company_email : ""}
        </div>
      </div>
      <div class="co-owner">
        <strong>Company Owner:</strong>
        ${c.owner_name || "Joshua Thornburg"}
      </div>
    </div>

    <!-- Title -->
    <div class="doc-title">CONSTRUCTION CONTRACT AGREEMENT</div>

    <!-- Info Grid -->
    <div class="info-grid">
      <div class="info-row">
        <span class="info-lbl">Client / Owner:</span>
        <span>${clientName || "___________________"}</span>
      </div>
      <div class="info-row">
        <span class="info-lbl">Contract Amount:</span>
        <span>$${formatMoney(d.contract_amount)}</span>
      </div>
      <div class="info-row">
        <span class="info-lbl">Start Date:</span>
        <span>${d.start_date || "___________________"}</span>
      </div>
      <div class="info-row">
        <span class="info-lbl">Est. Completion:</span>
        <span>${d.estimated_completion || "___________________"}</span>
      </div>
    </div>

    <!-- 1. Scope of Work -->
    <div class="sec-title">1. SCOPE OF WORK</div>
    <div class="sec-body">
      ${d.scope_summary ? renderLines(d.scope_summary) : '<span style="color:#666;font-style:italic;">As detailed in the attached bid document.</span>'}
    </div>

    <!-- 2. Payment Schedule -->
    <div class="sec-title">2. PAYMENT SCHEDULE</div>
    <div class="sec-body">
      <div class="bullet">• Deposit (Upon Acceptance): &nbsp;<strong>$${formatMoney(d.deposit_amount)}</strong></div>
      <div class="bullet">• Start of Construction: &nbsp;<strong>$${formatMoney(d.start_of_construction_amount)}</strong></div>
      <div class="bullet">• Final Payment (Upon Completion): &nbsp;<strong>$${formatMoney(d.final_payment_amount)}</strong></div>
    </div>

    <!-- 3. Unforeseen Circumstances -->
    <div class="sec-title">3. UNFORESEEN CIRCUMSTANCES</div>
    <div class="sec-body">
      <div class="para">Any unforeseen conditions or changes discovered during the work that were not originally apparent or specified in this Contract may require additional time and/or cost. The Contractor will notify the Owner/Client of such conditions and provide a written estimate for any additional work required. Work shall not proceed on unforeseen items until written approval is received from the Owner/Client.</div>
    </div>

    ${d.change_order_terms ? `
    <!-- 4. Change Orders -->
    <div class="sec-title">4. CHANGE ORDERS</div>
    <div class="sec-body">${renderLines(d.change_order_terms)}</div>
    ` : ""}

    ${d.notes ? `
    <!-- 5. Terms & Conditions -->
    <div class="sec-title">5. TERMS &amp; CONDITIONS</div>
    <div class="sec-body">${renderLines(d.notes)}</div>
    ` : ""}

    <!-- Page Footer -->
    ${footerHtml}
  </div>

  <!-- ═══════════════════ PAGE 2 ═══════════════════ -->
  <div class="doc-page">

    <!-- 6. Legal Terms -->
    <div class="sec-title">6. LEGAL TERMS</div>
    <div class="sec-body">
      <div class="para">This Contract constitutes the entire agreement between the parties. All work shall be performed in a professional manner in compliance with all applicable federal, state, and local laws and building codes. The Contractor warrants that all materials will be of good quality and all work will be completed in a workmanlike manner.</div>
      <div class="para">Any modifications to this Contract must be made in writing and signed by both parties. The Contractor is responsible for obtaining all necessary permits unless otherwise specified. Neither party may assign this Contract without written consent of the other.</div>
    </div>

    <!-- Signatures -->
    <div class="sig-grid">
      <div class="sig-block">
        <div class="sig-party">CONTRACTOR:</div>
        <div class="sig-name">${c.company_name || "Company Name"}<br>By: ${c.owner_name || "Owner Name"}</div>
        <div class="sig-line"></div>
        <div class="sig-label">Signature</div>
        <div class="sig-line"></div>
        <div class="sig-label">Date</div>
      </div>
      <div class="sig-block">
        <div class="sig-party">OWNER / CLIENT:</div>
        <div class="sig-name">By: ${clientName || "___________________"}</div>
        <div class="sig-line"></div>
        <div class="sig-label">Signature</div>
        <div class="sig-line"></div>
        <div class="sig-label">Date</div>
      </div>
    </div>

    <div class="binding-note">This contract is legally binding when signed by both parties.</div>

    <!-- Page Footer -->
    ${footerHtml}
  </div>

</div>
</body>
</html>`;

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col">
      <div className="flex gap-2 p-3 border-b bg-white">
        <Button size="sm" onClick={() => frameRef.current?.contentWindow.print()}>
          🖨️ Print / Save as PDF
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowEdit(!showEdit)}>
          <Edit2 className="w-4 h-4 mr-1" />
          {showEdit ? "Hide" : "Edit"} Values
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose} className="ml-auto">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {showEdit && (
        <div className="border-b bg-blue-50 p-3 overflow-y-auto max-h-28">
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div>
              <label className="text-xs font-bold">Deposit ($)</label>
              <Input type="number" value={editData.deposit_amount} onChange={e => setEditData({ ...editData, deposit_amount: parseFloat(e.target.value) || 0 })} className="text-xs" />
            </div>
            <div>
              <label className="text-xs font-bold">Start of Construction ($)</label>
              <Input type="number" value={editData.start_of_construction_amount} onChange={e => setEditData({ ...editData, start_of_construction_amount: parseFloat(e.target.value) || 0 })} className="text-xs" />
            </div>
            <div>
              <label className="text-xs font-bold">Final Payment ($)</label>
              <Input type="number" value={editData.final_payment_amount} onChange={e => setEditData({ ...editData, final_payment_amount: parseFloat(e.target.value) || 0 })} className="text-xs" />
            </div>
            <div>
              <label className="text-xs font-bold">Contract Total ($)</label>
              <Input type="number" value={editData.contract_amount} onChange={e => setEditData({ ...editData, contract_amount: parseFloat(e.target.value) || 0 })} className="text-xs" />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-gray-200 flex justify-center p-6">
        <iframe
          ref={frameRef}
          srcDoc={html}
          className="border shadow-md"
          style={{ width: "8.5in", height: "100%", minHeight: "20in" }}
          title="Contract Preview"
          key={JSON.stringify(editData)}
        />
      </div>
    </div>
  );
}