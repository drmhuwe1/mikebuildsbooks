import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function AdvancedContractEditor({ contract, company, onClose }) {
  const frameRef = useRef(null);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { size: 8.5in 11in; margin: 0.5in; }
    @media print {
      body { margin: 0; padding: 0; }
      .page { margin: 0; page-break-after: always; }
    }
    .page { 
      width: 8.5in;
      min-height: 11in;
      padding: 0.5in;
      margin: 10px auto;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      border-bottom: 3px solid #0a1f3d;
      padding-bottom: 15px;
    }
    .logo { max-height: 80px; max-width: 200px; object-fit: contain; }
    .company-info {
      flex: 1;
    }
    .company-name {
      font-size: 18pt;
      font-weight: bold;
      color: #0a1f3d;
      margin-bottom: 8px;
    }
    .company-details {
      font-size: 9pt;
      color: #333;
      line-height: 1.5;
    }
    .title {
      font-size: 16pt;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
      color: #0a1f3d;
    }
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      background: #0a1f3d;
      color: white;
      padding: 8px 10px;
      margin-top: 15px;
      margin-bottom: 10px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
    }
    .info-item {
      display: flex;
      justify-content: space-between;
    }
    .info-label {
      font-weight: bold;
      font-size: 10pt;
    }
    .info-value {
      font-size: 10pt;
    }
    .section-content {
      background: #f9f9f9;
      padding: 10px;
      margin-bottom: 10px;
      border-left: 4px solid #0a1f3d;
      font-size: 10pt;
      line-height: 1.7;
    }
    .bullet-list {
      margin-left: 20px;
    }
    .bullet-list li {
      margin-bottom: 6px;
    }
    .footer {
      margin-top: 30px;
      border-top: 1px solid #ccc;
      padding-top: 10px;
      font-size: 9pt;
      text-align: center;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      ${company?.company_logo_url ? `<img src="${company.company_logo_url}" class="logo" />` : ""}
      <div class="company-info">
        <div class="company-name">${company?.company_name || "Construction Company"}</div>
        <div class="company-details">
          ${company?.company_address ? company.company_address + "<br/>" : ""}
          ${company?.company_phone ? "Phone: " + company.company_phone + "<br/>" : ""}
          ${company?.company_email ? "Email: " + company.company_email : ""}
        </div>
      </div>
    </div>

    <div class="title">CONSTRUCTION CONTRACT</div>

    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Client Name:</span>
        <span class="info-value">${(contract?.client_name || "") + (contract?.client_last_name ? " " + contract.client_last_name : "")}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Contract Amount:</span>
        <span class="info-value">$${(contract?.contract_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Start Date:</span>
        <span class="info-value">${contract?.start_date || "TBD"}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Est. Completion:</span>
        <span class="info-value">${contract?.estimated_completion || "TBD"}</span>
      </div>
    </div>

    ${contract?.scope_summary ? `
    <div class="section-title">SCOPE OF WORK</div>
    <div class="section-content">
      ${contract.scope_summary.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed.match(/^[-•*]/)) {
          return "<li>" + trimmed.replace(/^[-•*]\s*/, '') + "</li>";
        }
        return trimmed;
      }).join('')}
    </div>
    ` : ""}

    ${contract?.payment_schedule ? `
    <div class="section-title">PAYMENT SCHEDULE</div>
    <div class="section-content">
      ${contract.payment_schedule.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed.match(/^[-•*]/)) {
          return "<li>" + trimmed.replace(/^[-•*]\s*/, '') + "</li>";
        }
        return trimmed ? "<p>" + trimmed + "</p>" : "";
      }).join('')}
    </div>
    ` : ""}

    ${contract?.deposit_amount ? `
    <div class="section-title">DEPOSIT TERMS</div>
    <div class="section-content">
      <p><strong>Deposit Amount:</strong> $${(contract.deposit_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      <p><strong>Deposit Percentage:</strong> ${contract.deposit_percent || 0}%</p>
    </div>
    ` : ""}

    ${contract?.change_order_terms ? `
    <div class="section-title">CHANGE ORDER POLICY</div>
    <div class="section-content">
      ${contract.change_order_terms.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed.match(/^[-•*]/)) {
          return "<li>" + trimmed.replace(/^[-•*]\s*/, '') + "</li>";
        }
        return trimmed ? "<p>" + trimmed + "</p>" : "";
      }).join('')}
    </div>
    ` : ""}

    ${contract?.notes ? `
    <div class="section-title">TERMS & CONDITIONS</div>
    <div class="section-content">
      ${contract.notes.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed.match(/^[-•*]/)) {
          return "<li>" + trimmed.replace(/^[-•*]\s*/, '') + "</li>";
        }
        return trimmed ? "<p>" + trimmed + "</p>" : "";
      }).join('')}
    </div>
    ` : ""}

    <div class="footer">
      <p>This contract is binding when signed by both parties.</p>
    </div>
  </div>
</body>
</html>`;

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col">
      <div className="flex gap-2 p-4 border-b bg-white">
        <Button size="sm" onClick={() => frameRef.current?.contentWindow.print()}>
          🖨️ Print / Save PDF
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose} className="ml-auto">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-100 flex justify-center p-4">
        <iframe
          ref={frameRef}
          srcDoc={html}
          className="border rounded shadow-sm"
          style={{ width: "8.5in", minHeight: "11in" }}
          title="Contract Preview"
        />
      </div>
    </div>
  );
}