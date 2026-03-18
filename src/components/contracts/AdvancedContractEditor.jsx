import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Edit2 } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/69b9774720c1d890b1162f57/17e5112da_MikeBuildsBooksLogo.png";

function money(n) {
  return "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderLines(text) {
  if (!text) return "";
  return text.split("\n").filter(l => l.trim()).map(l => {
    const t = l.trim();
    if (t.match(/^[-•*]/)) return `<p style="margin:2px 0 2px 24px;">&#8226; ${t.replace(/^[-•*]\s*/, "")}</p>`;
    return `<p style="margin:4px 0;">${t}</p>`;
  }).join("");
}

export default function AdvancedContractEditor({ contract, company, onClose }) {
  const frameRef = useRef(null);
  const [data, setData] = useState({ ...contract });
  const [showEdit, setShowEdit] = useState(false);

  const co = company || {};
  const client = [data.client_name, data.client_last_name].filter(Boolean).join(" ");

  const buildHtml = () => {
    const scopeHtml = data.scope_summary ? renderLines(data.scope_summary) : "<p><em>As detailed in the attached bid document.</em></p>";
    const changeOrderHtml = data.change_order_terms ? renderLines(data.change_order_terms) : "<p>Any changes to the scope of work must be approved in writing and may affect project cost and timeline.</p>";
    const notesHtml = data.notes ? renderLines(data.notes) : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Construction Contract</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt;
    line-height: 1.55;
    color: #111;
    background: #ccc;
  }

  /* ── SCREEN: paper card preview ── */
  .page-wrap {
    width: 8.5in;
    margin: 24px auto;
    background: white;
    padding: 1in 1in 0.85in 1in;
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    min-height: 11in;
    position: relative;
    padding-bottom: 1.2in; /* leave room for footer */
  }

  /* ── PRINT ── */
  @page {
    size: letter;
    margin: 1in 1in 1in 1in;
  }

  @media print {
    body { background: white; }
    .page-wrap {
      width: auto;
      margin: 0;
      padding: 0;
      box-shadow: none;
      min-height: 0;
      page-break-after: always;
    }
    .page-wrap:last-child { page-break-after: avoid; }
    .no-print { display: none !important; }
    .screen-footer { display: none !important; }

    /* Fixed footer prints on every page within the bottom margin */
    .print-footer {
      position: fixed;
      bottom: -0.85in;
      left: 0;
      right: 0;
      height: 0.8in;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-top: 1px solid #bbb;
      padding-top: 4px;
    }
  }

  /* Screen footer inside each card */
  .screen-footer {
    position: absolute;
    bottom: 0;
    left: 1in;
    right: 1in;
    border-top: 1px solid #bbb;
    padding: 8px 0 12px;
    text-align: center;
  }

  /* ── HEADER ── */
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

  /* ── TITLE ── */
  .doc-title {
    font-size: 14pt;
    font-weight: bold;
    text-align: center;
    text-decoration: underline;
    margin: 10px 0 18px;
  }

  /* ── KEY INFO TABLE ── */
  table.info { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  table.info td { font-size: 10.5pt; padding: 4px 0; vertical-align: bottom; }
  table.info td.lbl { font-weight: bold; width: 130px; }
  table.info td.val { border-bottom: 1px solid #111; padding-bottom: 2px; min-width: 160px; }
  table.info td.gap { width: 36px; }

  /* ── SECTIONS ── */
  .sec-head {
    font-size: 11pt;
    font-weight: bold;
    text-decoration: underline;
    margin: 16px 0 5px;
  }
  .sec-body {
    font-size: 10.5pt;
    padding-left: 8px;
    line-height: 1.55;
  }
  .sec-body p { margin: 3px 0; }

  /* ── SIGNATURE ── */
  .sig-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    margin-top: 32px;
  }
  .sig-party { font-size: 10.5pt; font-weight: bold; margin-bottom: 6px; }
  .sig-name { font-size: 10pt; margin-bottom: 14px; }
  .sig-line-wrap { margin-bottom: 18px; }
  .sig-line { border-bottom: 1.5px solid #111; height: 36px; }
  .sig-cap { font-size: 9pt; font-weight: bold; text-align: center; margin-top: 3px; }
  .binding {
    text-align: center;
    font-weight: bold;
    font-size: 10.5pt;
    margin-top: 22px;
  }

  /* ── FOOTER CONTENT (shared) ── */
  .footer-inner img { max-height: 38px; display: block; margin: 0 auto 3px; }
  .footer-inner span { font-size: 8.5pt; color: #666; display: block; }
</style>
</head>
<body>

<!-- Print footer: fixed on every page during printing -->
<div class="print-footer">
  <div class="footer-inner">
    <img src="${LOGO_URL}" alt="MikeBuildsBooks Logo">
    <span>Strong Builds. Stronger Books.</span>
  </div>
</div>

<!-- ════════════════════════════════════════ -->
<!--  PAGE 1                                  -->
<!-- ════════════════════════════════════════ -->
<div class="page-wrap">

  <!-- HEADER -->
  <div class="hdr">
    ${co.company_logo_url ? `<img src="${co.company_logo_url}" class="hdr-logo" alt="Logo">` : ""}
    <div class="hdr-co">
      <div class="hdr-co-name">${co.company_name || "Thornburg Construction"}</div>
      <div class="hdr-co-detail">
        ${co.company_address ? co.company_address + "<br>" : ""}
        ${co.company_phone ? "Phone: " + co.company_phone : ""}
        ${co.company_email ? "<br>Email: " + co.company_email : ""}
      </div>
    </div>
    <div class="hdr-owner">
      <strong>Company Owner:</strong>
      ${co.owner_name || "Joshua Thornburg"}
    </div>
  </div>

  <div class="doc-title">CONSTRUCTION CONTRACT AGREEMENT</div>

  <!-- KEY INFO -->
  <table class="info">
    <tr>
      <td class="lbl">Client/Owner:</td>
      <td class="val">${client || "________________________________"}</td>
      <td class="gap"></td>
      <td class="lbl">Contract Amount:</td>
      <td class="val">${money(data.contract_amount)}</td>
    </tr>
    <tr>
      <td class="lbl" style="padding-top:10px;">Start Date:</td>
      <td class="val" style="padding-top:10px;">${data.start_date || "________________________________"}</td>
      <td class="gap"></td>
      <td class="lbl" style="padding-top:10px;">Est. Completion:</td>
      <td class="val" style="padding-top:10px;">${data.estimated_completion || "________________________________"}</td>
    </tr>
  </table>

  <!-- SCOPE -->
  <div class="sec-head">1. SCOPE OF WORK</div>
  <div class="sec-body">${scopeHtml}</div>

  <!-- PAYMENT -->
  <div class="sec-head">2. PAYMENT SCHEDULE</div>
  <div class="sec-body">
    <p>&#8226; Deposit (Upon Acceptance): &nbsp;<strong>${money(data.deposit_amount)}</strong></p>
    <p>&#8226; Start of Construction: &nbsp;<strong>${money(data.start_of_construction_amount)}</strong></p>
    <p>&#8226; Final Payment (Upon Completion): &nbsp;<strong>${money(data.final_payment_amount)}</strong></p>
  </div>

  <!-- UNFORESEEN -->
  <div class="sec-head">3. UNFORESEEN CIRCUMSTANCES</div>
  <div class="sec-body">
    <p>Any unforeseen conditions or changes discovered during the work that were not originally apparent or specified in this Contract may require additional time and/or cost. The Contractor will notify the Owner/Client of such conditions and provide a written estimate for any additional work required. Work shall not proceed on unforeseen items until written approval and authorization is received from the Owner/Client.</p>
  </div>

  <!-- CHANGE ORDERS -->
  <div class="sec-head">4. CHANGE ORDERS</div>
  <div class="sec-body">${changeOrderHtml}</div>

  ${notesHtml ? `
  <!-- TERMS & CONDITIONS -->
  <div class="sec-head">5. TERMS &amp; CONDITIONS</div>
  <div class="sec-body">${notesHtml}</div>
  ` : ""}

  <!-- LEGAL TERMS -->
  <div class="sec-head">${notesHtml ? "6" : "5"}. LEGAL TERMS</div>
  <div class="sec-body">
    <p>This Contract constitutes the entire agreement between the parties. All work shall be performed in a professional manner in compliance with all applicable federal, state, and local laws and building codes. The Contractor warrants that all materials will be of good quality and all work will be completed in a workmanlike manner.</p>
    <p style="margin-top:6px;">Any modifications to this Contract must be made in writing and signed by both parties. The Contractor is responsible for obtaining all necessary permits unless otherwise specified.</p>
  </div>

  <!-- SIGNATURES -->
  <div class="sig-grid">
    <div>
      <div class="sig-party">CONTRACTOR:</div>
      <div class="sig-name">
        <strong>${co.company_name || "Thornburg Construction"}</strong><br>
        By: ${co.owner_name || "Joshua Thornburg"}
      </div>
      <div class="sig-line-wrap">
        <div class="sig-line"></div>
        <div class="sig-cap">Signature</div>
      </div>
      <div class="sig-line-wrap">
        <div class="sig-line"></div>
        <div class="sig-cap">Date</div>
      </div>
    </div>
    <div>
      <div class="sig-party">OWNER/CLIENT:</div>
      <div class="sig-name">By: ${client || "________________________________"}</div>
      <div class="sig-line-wrap">
        <div class="sig-line"></div>
        <div class="sig-cap">Signature</div>
      </div>
      <div class="sig-line-wrap">
        <div class="sig-line"></div>
        <div class="sig-cap">Date</div>
      </div>
    </div>
  </div>

  <div class="binding">This contract is legally binding when signed by both parties.</div>

  <!-- Screen-only footer (print uses the fixed one) -->
  <div class="screen-footer no-print">
    <div class="footer-inner">
      <img src="${LOGO_URL}" alt="MikeBuildsBooks Logo">
      <span>Strong Builds. Stronger Books.</span>
    </div>
  </div>

</div>

</body>
</html>`;
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b bg-white no-print shrink-0">
        <Button size="sm" onClick={() => frameRef.current?.contentWindow.print()}>
          🖨️ Print / Save as PDF
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowEdit(v => !v)}>
          <Edit2 className="w-4 h-4 mr-1" />{showEdit ? "Hide" : "Edit"} Amounts
        </Button>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Quick amount editor */}
      {showEdit && (
        <div className="border-b bg-slate-50 p-3 no-print shrink-0">
          <div className="grid grid-cols-4 gap-3">
            {[
              ["Contract Total", "contract_amount"],
              ["Deposit", "deposit_amount"],
              ["Start of Construction", "start_of_construction_amount"],
              ["Final Payment", "final_payment_amount"],
            ].map(([label, key]) => (
              <div key={key}>
                <label className="text-xs font-semibold block mb-1">{label}</label>
                <Input
                  type="number"
                  value={data[key] || 0}
                  onChange={e => setData(d => ({ ...d, [key]: parseFloat(e.target.value) || 0 }))}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document preview */}
      <div className="flex-1 overflow-hidden">
        <iframe
          ref={frameRef}
          srcDoc={buildHtml()}
          title="Contract Preview"
          style={{ width: "100%", height: "100%", border: "none" }}
          key={JSON.stringify(data)}
        />
      </div>
    </div>
  );
}