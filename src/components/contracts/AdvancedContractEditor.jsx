import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Edit2 } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/69b9774720c1d890b1162f57/17e5112da_MikeBuildsBooksLogo.png";

function money(n) {
  return "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function lines(text) {
  if (!text) return "";
  return text.split("\n").filter(l => l.trim()).map(l => {
    const t = l.trim();
    if (t.match(/^[-•*]/)) return `<p style="margin:2px 0 2px 18px;">&#8226; ${t.replace(/^[-•*]\s*/, "")}</p>`;
    return `<p style="margin:3px 0;">${t}</p>`;
  }).join("");
}

export default function AdvancedContractEditor({ contract, company, onClose }) {
  const frameRef = useRef(null);
  const [data, setData] = useState({ ...contract });
  const [showEdit, setShowEdit] = useState(false);

  const co = company || {};
  const client = (data.client_name || "") + (data.client_last_name ? " " + data.client_last_name : "");

  const buildHtml = () => {
    const scopeHtml = data.scope_summary ? lines(data.scope_summary) : "<p><em>As detailed in the attached bid document.</em></p>";
    const changeOrderHtml = data.change_order_terms ? lines(data.change_order_terms) : "";
    const notesHtml = data.notes ? lines(data.notes) : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Construction Contract</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #111;
    background: #ddd;
  }

  /* ---- SCREEN: paper cards ---- */
  .sheet {
    width: 8.5in;
    margin: 20px auto;
    background: white;
    padding: 1in;
    box-shadow: 0 3px 12px rgba(0,0,0,0.2);
  }

  /* ---- PRINT ---- */
  @page { size: letter; margin: 1in; }

  @media print {
    body { background: white; }
    .sheet {
      width: auto;
      margin: 0;
      padding: 0;
      box-shadow: none;
      page-break-after: always;
    }
    .sheet:last-child { page-break-after: avoid; }
    .no-print { display: none !important; }
  }

  /* ---- HEADER ---- */
  .hdr {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding-bottom: 10px;
    border-bottom: 2px solid #000;
    margin-bottom: 14px;
  }
  .hdr-logo { max-height: 64px; max-width: 150px; object-fit: contain; }
  .hdr-co { flex: 1; }
  .hdr-co-name { font-size: 15pt; font-weight: bold; }
  .hdr-co-detail { font-size: 9pt; margin-top: 3px; line-height: 1.4; }
  .hdr-owner { font-size: 9pt; text-align: right; }

  /* ---- TITLE ---- */
  .doc-title {
    font-size: 14pt;
    font-weight: bold;
    text-align: center;
    text-decoration: underline;
    margin: 12px 0 14px;
    letter-spacing: 0.3px;
  }

  /* ---- KEY INFO ---- */
  .kv-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 24px;
    margin-bottom: 16px;
    font-size: 10pt;
  }
  .kv {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid #ccc;
    padding-bottom: 3px;
  }
  .kv-label { font-weight: bold; }

  /* ---- SECTIONS ---- */
  .sec-head {
    font-size: 11pt;
    font-weight: bold;
    text-decoration: underline;
    margin: 16px 0 5px;
  }
  .sec-body {
    font-size: 10pt;
    padding-left: 6px;
  }
  .sec-body p { margin: 3px 0; }

  /* ---- SIGNATURES ---- */
  .sig-wrap {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 36px;
    margin-top: 30px;
  }
  .sig-label { font-weight: bold; font-size: 10pt; margin-bottom: 6px; }
  .sig-name { font-size: 9.5pt; margin-bottom: 10px; }
  .sig-line { border-bottom: 1px solid #000; margin-bottom: 3px; height: 34px; }
  .sig-cap { font-size: 8.5pt; font-weight: bold; text-align: center; margin-bottom: 14px; }
  .binding { text-align: center; font-weight: bold; font-size: 10pt; margin-top: 20px; }

  /* ---- FOOTER (inside each sheet) ---- */
  .sheet-footer {
    margin-top: 30px;
    padding-top: 8px;
    border-top: 1px solid #999;
    text-align: center;
  }
  .sheet-footer img { max-height: 40px; object-fit: contain; display: block; margin: 0 auto 3px; }
  .sheet-footer span { font-size: 8.5pt; color: #555; }
</style>
</head>
<body>

<!-- ============================================================ -->
<!--  SHEET 1: Header + Contract Details + Scope + Payment        -->
<!-- ============================================================ -->
<div class="sheet">

  <div class="hdr">
    ${co.company_logo_url ? `<img src="${co.company_logo_url}" class="hdr-logo" alt="Company Logo">` : ""}
    <div class="hdr-co">
      <div class="hdr-co-name">${co.company_name || "CONSTRUCTION COMPANY"}</div>
      <div class="hdr-co-detail">
        ${co.company_address || ""}${co.company_address ? "<br>" : ""}
        ${co.company_phone ? "Phone: " + co.company_phone : ""}${co.company_phone && co.company_email ? " &nbsp;|&nbsp; " : ""}
        ${co.company_email ? "Email: " + co.company_email : ""}
      </div>
    </div>
    <div class="hdr-owner">
      <strong>Owner:</strong><br>${co.owner_name || "Joshua Thornburg"}
    </div>
  </div>

  <div class="doc-title">CONSTRUCTION CONTRACT AGREEMENT</div>

  <div class="kv-grid">
    <div class="kv"><span class="kv-label">Client / Owner:</span> <span>${client || "________________________"}</span></div>
    <div class="kv"><span class="kv-label">Contract Total:</span> <span>${money(data.contract_amount)}</span></div>
    <div class="kv"><span class="kv-label">Start Date:</span> <span>${data.start_date || "________________________"}</span></div>
    <div class="kv"><span class="kv-label">Est. Completion:</span> <span>${data.estimated_completion || "________________________"}</span></div>
  </div>

  <div class="sec-head">1. SCOPE OF WORK</div>
  <div class="sec-body">${scopeHtml}</div>

  <div class="sec-head">2. PAYMENT SCHEDULE</div>
  <div class="sec-body">
    <p style="margin:3px 0 3px 18px;">&#8226; Deposit (Upon Acceptance): &nbsp;<strong>${money(data.deposit_amount)}</strong></p>
    <p style="margin:3px 0 3px 18px;">&#8226; Due at Start of Construction: &nbsp;<strong>${money(data.start_of_construction_amount)}</strong></p>
    <p style="margin:3px 0 3px 18px;">&#8226; Final Payment (Upon Completion): &nbsp;<strong>${money(data.final_payment_amount)}</strong></p>
  </div>

  <div class="sec-head">3. UNFORESEEN CIRCUMSTANCES</div>
  <div class="sec-body">
    <p>Any unforeseen conditions discovered during work that were not apparent or specified in this Contract may require additional time and/or cost. The Contractor will notify the Owner/Client of such conditions and provide a written estimate before proceeding. No additional work shall begin without written authorization from the Owner/Client.</p>
  </div>

  ${changeOrderHtml ? `
  <div class="sec-head">4. CHANGE ORDERS</div>
  <div class="sec-body">${changeOrderHtml}</div>
  ` : ""}

  ${notesHtml ? `
  <div class="sec-head">5. TERMS &amp; CONDITIONS</div>
  <div class="sec-body">${notesHtml}</div>
  ` : ""}

  <div class="sheet-footer">
    <img src="${LOGO_URL}" alt="MikeBuildsBooks">
    <span>Strong Builds. Stronger Books.</span>
  </div>

</div>

<!-- ============================================================ -->
<!--  SHEET 2: Legal Terms + Signatures                           -->
<!-- ============================================================ -->
<div class="sheet">

  <div class="sec-head" style="margin-top:0;">6. LEGAL TERMS</div>
  <div class="sec-body">
    <p>This Contract constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements. All work shall be performed in a professional manner in compliance with applicable federal, state, and local laws and building codes.</p>
    <p style="margin-top:6px;">The Contractor warrants that all materials supplied will be of good quality and that all work will be completed in a workmanlike manner. Any modifications to this Contract must be made in writing and signed by both parties.</p>
    <p style="margin-top:6px;">The Contractor is responsible for obtaining all necessary permits unless otherwise agreed in writing. Neither party may assign this Contract without prior written consent of the other party.</p>
    <p style="margin-top:6px;">In the event of a dispute, the parties agree to attempt resolution through good-faith negotiation before pursuing legal remedies. This Contract shall be governed by the laws of the state where the work is performed.</p>
  </div>

  <div class="sig-wrap">
    <div>
      <div class="sig-label">CONTRACTOR</div>
      <div class="sig-name">${co.company_name || "Company Name"}<br>By: ${co.owner_name || "Owner Name"}</div>
      <div class="sig-line"></div>
      <div class="sig-cap">Signature</div>
      <div class="sig-line"></div>
      <div class="sig-cap">Date</div>
    </div>
    <div>
      <div class="sig-label">OWNER / CLIENT</div>
      <div class="sig-name">By: ${client || "________________________"}</div>
      <div class="sig-line"></div>
      <div class="sig-cap">Signature</div>
      <div class="sig-line"></div>
      <div class="sig-cap">Date</div>
    </div>
  </div>

  <div class="binding">This contract is legally binding upon execution by both parties.</div>

  <div class="sheet-footer">
    <img src="${LOGO_URL}" alt="MikeBuildsBooks">
    <span>Strong Builds. Stronger Books.</span>
  </div>

</div>

</body>
</html>`;
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b bg-white no-print">
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

      {showEdit && (
        <div className="border-b bg-slate-50 p-3 no-print">
          <div className="grid grid-cols-4 gap-3">
            {[
              ["Deposit", "deposit_amount"],
              ["Start of Construction", "start_of_construction_amount"],
              ["Final Payment", "final_payment_amount"],
              ["Contract Total", "contract_amount"],
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

      <div className="flex-1 overflow-y-auto bg-gray-400">
        <iframe
          ref={frameRef}
          srcDoc={buildHtml()}
          title="Contract"
          style={{ width: "100%", height: "100%", border: "none", minHeight: "800px" }}
          key={JSON.stringify(data)}
        />
      </div>
    </div>
  );
}