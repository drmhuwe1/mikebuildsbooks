import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Edit2 } from "lucide-react";

export default function AdvancedContractEditor({ contract, company, onClose }) {
  const frameRef = useRef(null);
  const [editData, setEditData] = useState(contract);
  const [showEdit, setShowEdit] = useState(false);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { height: 100%; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      margin: 0;
      padding: 0;
    }
    @page {
      size: letter;
      margin-top: 0.85in;
      margin-bottom: 0.85in;
      margin-left: 0.9in;
      margin-right: 0.9in;
    }
    @media print {
      html, body { margin: 0; padding: 0; }
      .page { margin: 0; padding: 0.85in 0.9in; page-break-after: always; box-shadow: none; }
    }
    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.85in 0.9in;
      margin: 10px auto;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      page-break-after: always;
      position: relative;
    }
    .header {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    .logo { max-height: 70px; max-width: 180px; object-fit: contain; }
    .company-name { font-size: 14pt; font-weight: bold; margin-bottom: 4px; }
    .company-details { font-size: 9pt; line-height: 1.4; }
    .title {
      font-size: 14pt;
      font-weight: bold;
      text-align: center;
      margin: 12px 0;
      text-decoration: underline;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
      font-size: 10pt;
    }
    .info-item {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #ccc;
      padding-bottom: 3px;
    }
    .info-label { font-weight: bold; }
    .section-title {
      font-size: 11pt;
      font-weight: bold;
      margin-top: 10px;
      margin-bottom: 6px;
      text-decoration: underline;
    }
    .section-content {
      font-size: 10pt;
      margin-bottom: 10px;
      line-height: 1.5;
      padding-left: 10px;
    }
    .bullet-item {
      margin-left: 15px;
      margin-bottom: 4px;
    }
    .payment-schedule { margin-top: 6px; margin-bottom: 6px; }
    .payment-row { page-break-inside: avoid; margin-bottom: 6px; }
    .signature-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 24px;
      font-size: 10pt;
      page-break-inside: avoid;
    }
    .signature-label { font-size: 9pt; font-weight: bold; }
    .legal-footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #000;
      font-size: 9pt;
      text-align: center;
      color: #333;
      page-break-inside: avoid;
    }
    .footer-logo { max-height: 70px; margin: 6px 0; object-fit: contain; }
    .page-break-before-section-3 { page-break-before: always; }
  </style>
</head>
<body>

  <!-- PAGE 1: Header, Title, Info Grid, Scope of Work, Payment Schedule -->
  <div class="page">
    <div class="header">
      ${company?.company_logo_url ? `<img src="${company.company_logo_url}" class="logo" alt="Company Logo" />` : ""}
      <div style="flex: 1;">
        <div class="company-name">${company?.company_name || "CONSTRUCTION COMPANY"}</div>
        <div class="company-details">
          ${company?.company_address ? company.company_address + "<br />" : ""}
          ${company?.company_phone ? "Phone: " + company.company_phone + "<br />" : ""}
          ${company?.company_email ? "Email: " + company.company_email : ""}
        </div>
      </div>
      <div style="text-align: right; font-size: 9pt;">
        <div style="font-weight: bold; margin-bottom: 4px;">Company Owner:</div>
        <div>${company?.owner_name || "Joshua Thornburg"}</div>
      </div>
    </div>

    <div class="title">CONSTRUCTION CONTRACT AGREEMENT</div>

    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Client/Owner:</span>
        <span>${(editData?.client_name || "") + (editData?.client_last_name ? " " + editData.client_last_name : "")}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Contract Amount:</span>
        <span>$${(editData?.contract_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Start Date:</span>
        <span>${editData?.start_date || "______________________"}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Est. Completion:</span>
        <span>${editData?.estimated_completion || "______________________"}</span>
      </div>
    </div>

    <div class="section-title">1. SCOPE OF WORK</div>
    <div class="section-content">
      ${editData?.scope_summary ? editData.scope_summary.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return "";
        if (trimmed.match(/^[-•*]/)) {
          return '<div class="bullet-item">• ' + trimmed.replace(/^[-•*]\s*/, '') + '</div>';
        }
        return '<div style="margin-bottom: 4px;">' + trimmed + '</div>';
      }).join('') : '<div style="font-style: italic; color: #666;">As detailed in attached bid document.</div>'}
    </div>

    <div class="section-title">2. PAYMENT SCHEDULE</div>
    <div class="section-content">
      <div class="payment-schedule">
        <div class="payment-row bullet-item">• Deposit (Upon Acceptance): $${(editData?.deposit_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="payment-row bullet-item">• Start of Construction: $${(editData?.start_of_construction_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="payment-row bullet-item">• Final Payment (Upon Completion): $${(editData?.final_payment_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
      ${editData?.payment_schedule ? '<div style="margin-top: 6px; border-top: 1px solid #ccc; padding-top: 6px;">' + editData.payment_schedule.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return "";
        if (trimmed.match(/^[-•*]/)) {
          return '<div class="bullet-item">• ' + trimmed.replace(/^[-•*]\s*/, '') + '</div>';
        }
        return '<div style="margin-bottom: 4px;">' + trimmed + '</div>';
      }).join('') + '</div>' : ''}
    </div>
  </div>

  <!-- PAGE 2: Sections 3–6, Signatures, Branding Footer -->
  <div class="page">
    <div class="section-title">3. UNFORESEEN CIRCUMSTANCES</div>
    <div class="section-content">
      Any unforeseen conditions or changes discovered during the work that were not originally apparent or specified in this Contract may require additional time and/or cost. The Contractor will notify the Owner/Client of such conditions and provide a written estimate for any additional work required. Work shall not proceed on unforeseen items until written approval and authorization is received from the Owner/Client.
    </div>

    ${editData?.change_order_terms ? `
    <div class="section-title">4. CHANGE ORDERS</div>
    <div class="section-content">
      ${editData.change_order_terms.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return "";
        if (trimmed.match(/^[-•*]/)) {
          return '<div class="bullet-item">• ' + trimmed.replace(/^[-•*]\s*/, '') + '</div>';
        }
        return '<div style="margin-bottom: 4px;">' + trimmed + '</div>';
      }).join('')}
    </div>
    ` : ""}

    ${editData?.notes ? `
    <div class="section-title">5. TERMS &amp; CONDITIONS</div>
    <div class="section-content">
      ${editData.notes.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return "";
        if (trimmed.match(/^[-•*]/)) {
          return '<div class="bullet-item">• ' + trimmed.replace(/^[-•*]\s*/, '') + '</div>';
        }
        return '<div style="margin-bottom: 4px;">' + trimmed + '</div>';
      }).join('')}
    </div>
    ` : ""}

    <div class="section-title" style="margin-top: 16px;">6. LEGAL TERMS</div>
    <div class="section-content">
      <div style="margin-bottom: 6px;">This Contract constitutes the entire agreement between the parties. All work shall be performed in a professional manner in compliance with all applicable federal, state, and local laws and building codes. The Contractor warrants that all materials will be of good quality and all work will be completed in a workmanlike manner.</div>
      <div style="margin-bottom: 6px;">Any modifications to this Contract must be made in writing and signed by both parties. The Contractor is responsible for obtaining all necessary permits unless otherwise specified.</div>
    </div>

    <div class="signature-section">
      <div class="signature-block">
        <div style="text-align: left; margin-bottom: 8px;">CONTRACTOR:</div>
        <div style="text-align: center; font-size: 10pt; margin-bottom: 6px; font-weight: bold;">${company?.company_name || "Company Name"}</div>
        <div style="text-align: center; font-size: 9pt; margin-bottom: 6px;">By: ${company?.owner_name || "Owner Name"}</div>
        <div style="border-bottom: 1px solid #000; height: 35px; margin-bottom: 2px;"></div>
        <div class="signature-label" style="text-align: center;">Signature</div>
        <div style="margin-top: 14px;"></div>
        <div style="border-bottom: 1px solid #000; height: 35px; margin-bottom: 2px;"></div>
        <div class="signature-label" style="text-align: center;">Date</div>
      </div>
      <div class="signature-block">
        <div style="text-align: left; margin-bottom: 8px;">OWNER/CLIENT:</div>
        <div style="text-align: left; font-size: 10pt; margin-bottom: 6px;">By: ${(editData?.client_name || "") + (editData?.client_last_name ? " " + editData.client_last_name : "")}</div>
        <div style="border-bottom: 1px solid #000; height: 35px; margin-bottom: 2px;"></div>
        <div class="signature-label" style="text-align: center;">Signature</div>
        <div style="margin-top: 14px;"></div>
        <div style="border-bottom: 1px solid #000; height: 35px; margin-bottom: 2px;"></div>
        <div class="signature-label" style="text-align: center;">Date</div>
      </div>
    </div>

    <div style="text-align: center; margin: 16px 0; font-weight: bold; font-size: 10pt;">
      This contract is legally binding when signed by both parties.
    </div>

    <div class="legal-footer">
      <img src="https://media.base44.com/images/public/69b9774720c1d890b1162f57/17e5112da_MikeBuildsBooksLogo.png" class="footer-logo" alt="MikeBuildsBooks" />
      <p style="margin: 4px 0; font-size: 9pt; color: #333;">Strong Builds. Stronger Books.</p>
      <p style="margin: 4px 0; font-size: 8pt; color: #999;">© ${new Date().getFullYear()}</p>
    </div>
  </div>

</body>
</html>`;

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col">
      <div className="flex gap-2 p-4 border-b bg-white">
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
        <div className="border-b bg-blue-50 p-4 space-y-3 max-h-32 overflow-y-auto">
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div>
              <label className="text-xs font-bold">Deposit</label>
              <Input
                type="number"
                value={editData.deposit_amount}
                onChange={(e) => setEditData({ ...editData, deposit_amount: parseFloat(e.target.value) || 0 })}
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold">Start of Construction</label>
              <Input
                type="number"
                value={editData.start_of_construction_amount}
                onChange={(e) => setEditData({ ...editData, start_of_construction_amount: parseFloat(e.target.value) || 0 })}
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold">Final Payment</label>
              <Input
                type="number"
                value={editData.final_payment_amount}
                onChange={(e) => setEditData({ ...editData, final_payment_amount: parseFloat(e.target.value) || 0 })}
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold">Contract Amount</label>
              <Input
                type="number"
                value={editData.contract_amount}
                onChange={(e) => setEditData({ ...editData, contract_amount: parseFloat(e.target.value) || 0 })}
                className="text-xs"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-gray-100 flex justify-center p-4">
        <iframe
          ref={frameRef}
          srcDoc={html}
          className="border rounded shadow-sm"
          style={{ width: "8.5in", minHeight: "22in" }}
          title="Contract Preview"
          key={JSON.stringify(editData)}
        />
      </div>
    </div>
  );
}