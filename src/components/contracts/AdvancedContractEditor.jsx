import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Edit2, Printer } from "lucide-react";
import { base44 } from "@/api/base44Client";

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
  const [data, setData] = useState({ ...contract });
  const [showEdit, setShowEdit] = useState(false);
  const [printing, setPrinting] = useState(false);

  const co = company || {};

  const buildHtml = (forPrint = false) => {
    const clientName = data.client_name && data.client_last_name 
      ? `${data.client_name} ${data.client_last_name}`
      : data.client_name || data.client_last_name || "";
    const scopeHtml = data.scope_summary ? renderLines(data.scope_summary) : "<p><em>As detailed in the attached bid document.</em></p>";
    const changeOrderHtml = data.change_order_terms ? renderLines(data.change_order_terms) : "<p>Any changes to the scope of work must be approved in writing and may affect project cost and timeline.</p>";
    const notesHtml = data.notes ? renderLines(data.notes) : "";

    const previewStyles = forPrint ? "" : `
      body { background: #ccc; margin: 0; padding: 12px; }
      .page-wrap {
        width: 8.5in;
        margin: 0 auto;
        background: white;
        padding: 1in;
        box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        min-height: 11in;
      }
    `;

    const printStyles = forPrint ? `
      body { background: white; margin: 0; padding: 0; }
      .page-wrap { 
        width: 100%;
        margin: 0;
        padding: 1in;
        box-sizing: border-box;
        page-break-after: always;
      }
      .page-wrap:last-of-type { page-break-after: avoid; }
      .doc-footer { position: relative; margin-top: auto; }
    ` : `
      @media print { body { display: none; } }
    `;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Construction Contract</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @page {
    size: letter;
    margin: 1in;
  }

  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt;
    line-height: 1.55;
    color: #111;
  }

  ${previewStyles}
  ${printStyles}

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

  /* ── FOOTER ── */
  .doc-footer {
    margin-top: 28px;
    border-top: 1px solid #bbb;
    padding-top: 8px;
    text-align: center;
  }
  .doc-footer img { max-height: 36px; display: block; margin: 0 auto 3px; }
  .doc-footer span { font-size: 8.5pt; color: #666; display: block; }
</style>
</head>
<body>
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
      <td class="val">${clientName || "________________________________"}</td>
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
    <p>&#8226; ${data.start_of_construction_label || 'Upon completion and passing of framing and footer inspection:'} &nbsp;<strong>${money(data.start_of_construction_amount)}</strong></p>
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
      <div class="sig-name">By: ${data.client_last_name ? clientName : "________________________________"}</div>
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

  <!-- FOOTER -->
  <div class="doc-footer">
    <img src="${LOGO_URL}" alt="MikeBuildsBooks">
    <span>Strong Builds. Stronger Books.</span>
  </div>

</div>
</body>
</html>`;
  };

  const fetchImageAsDataUrl = async (url) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const handlePrint = async () => {
    try {
      setPrinting(true);
      // Fetch images as data URLs so they embed in the print window
      const companyLogoData = co.company_logo_url ? await fetchImageAsDataUrl(co.company_logo_url) : null;
      const appLogoData = await fetchImageAsDataUrl(LOGO_URL);
      
      // Build HTML with embedded images
      let html = buildHtml(true);
      if (companyLogoData) {
        html = html.replace(new RegExp(`src="[^"]*${co.company_logo_url}[^"]*"`, 'i'), `src="${companyLogoData}"`);
      }
      if (appLogoData) {
        html = html.replace(/src="[^"]*MikeBuildsBooksLogo[^"]*"/i, `src="${appLogoData}"`);
      }
      
      const printWindow = window.open('', '', 'width=900,height=800');
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b bg-white shrink-0">
        <Button size="sm" onClick={handlePrint} disabled={printing}>
          <Printer className="w-4 h-4 mr-1" /> {printing ? "Generating PDF..." : "Print / Save as PDF"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowEdit(v => !v)}>
          <Edit2 className="w-4 h-4 mr-1" />{showEdit ? "Hide" : "Edit"} Details
        </Button>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Quick editor panel */}
      {showEdit && (
        <div className="border-b bg-slate-50 p-3 shrink-0">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Client First Name</label>
              <Input value={data.client_name || ""} onChange={e => setData(d => ({ ...d, client_name: e.target.value }))} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Client Last Name</label>
              <Input value={data.client_last_name || ""} onChange={e => setData(d => ({ ...d, client_last_name: e.target.value }))} className="text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Start Date</label>
              <Input type="date" value={data.start_date || ""} onChange={e => setData(d => ({ ...d, start_date: e.target.value }))} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Est. Completion</label>
              <Input type="date" value={data.estimated_completion || ""} onChange={e => setData(d => ({ ...d, estimated_completion: e.target.value }))} className="text-sm" />
            </div>
          </div>
          <div className="mb-3">
            <label className="text-xs font-semibold block mb-1">2nd Payment Milestone Label</label>
            <Input value={data.start_of_construction_label || ""} onChange={e => setData(d => ({ ...d, start_of_construction_label: e.target.value }))} className="text-sm" placeholder="Upon completion and passing of framing and footer inspection:" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              ["Contract Total", "contract_amount"],
              ["Deposit", "deposit_amount"],
              ["2nd Payment", "start_of_construction_amount"],
              ["Final Payment", "final_payment_amount"],
            ].map(([label, key]) => (
              <div key={key}>
                <label className="text-xs font-semibold block mb-1">{label}</label>
                <Input type="number" value={data[key] || 0} onChange={e => setData(d => ({ ...d, [key]: parseFloat(e.target.value) || 0 }))} className="text-sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live preview - shows the paper-card layout */}
      <div className="flex-1 overflow-hidden">
        <iframe
          srcDoc={buildHtml(false)}
          title="Contract Preview"
          style={{ width: "100%", height: "100%", border: "none" }}
          key={JSON.stringify(data)}
        />
      </div>
    </div>
  );
}