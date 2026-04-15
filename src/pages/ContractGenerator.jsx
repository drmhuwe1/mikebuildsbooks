import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import jsPDF from "jspdf";
import { Upload, FileText, Plus, Trash2, Download, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/shared/PageHeader";

// ─── MBB App Logo ───
const MBB_LOGO_URL = "https://media.base44.com/images/public/69b9774720c1d890b1162f57/e28d19baa_MikeBuildsBooksLogo.png";

// ─── AI PDF Scanning via InvokeLLM ────
async function scanPDFWithAI(pdfBase64) {
  const prompt = `Extract ALL information from this construction bid PDF and return ONLY a valid JSON object with no markdown, no code fences, no explanation. Use exactly these keys:
{
  "clientName": "full client name with title",
  "clientAddress": "full client address",
  "projectDescription": "complete project description",
  "estimatedDuration": "duration e.g. 8-10 weeks",
  "totalPrice": 0,
  "materialsCost": 0,
  "priceIncludes": ["item1","item2"],
  "scopes": ["Section Label: detail one, detail two, detail three"],
  "payments": [{"milestone":"name","amount":0,"due":"trigger"}],
  "extraNotes": "any extra terms"
}
Numbers must be integers with no $ or commas. Return ONLY the JSON.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    file_urls: [`data:application/pdf;base64,${pdfBase64}`],
    response_json_schema: {
      type: "object",
      properties: {
        clientName: { type: "string" },
        clientAddress: { type: "string" },
        projectDescription: { type: "string" },
        estimatedDuration: { type: "string" },
        totalPrice: { type: "number" },
        materialsCost: { type: "number" },
        priceIncludes: { type: "array", items: { type: "string" } },
        scopes: { type: "array", items: { type: "string" } },
        payments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              milestone: { type: "string" },
              amount: { type: "number" },
              due: { type: "string" },
            },
          },
        },
        extraNotes: { type: "string" },
      },
    },
  });

  return result;
}

// ─── HTML to PDF using jsPDF ────
function generatePDFFromHTML(html, filename) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "in",
    format: "letter",
  });

  // Use html2canvas to convert HTML to canvas, then to PDF
  const canvas = document.createElement("div");
  canvas.innerHTML = html;
  canvas.style.position = "absolute";
  canvas.style.left = "-9999px";
  document.body.appendChild(canvas);

  // For simplicity, we'll render HTML as text-based PDF
  // In production, you'd use html2canvas for complex layouts
  doc.html(canvas, {
    margin: [1.45, 0.75, 0.9, 0.75],
    x: 0.75,
    y: 1.45,
    width: 7.5,
    callback: (instance) => {
      document.body.removeChild(canvas);
    },
  });

  doc.save(filename);
}

// ─── HTML Contract Template ───────────────────────────────────────────────────
function buildContractHTML(settings, fields) {
  const logoHtml = settings.company_logo_url
    ? `<img src="${settings.company_logo_url}" style="width:56px;height:56px;object-fit:contain;" />`
    : `<div style="width:56px;height:56px;background:#f0ede4;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#888;">LOGO</div>`;

  const fmt = (n) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2 });

  const payRows = (fields.payments || [])
    .map(
      (p) => `
    <tr>
      <td style="padding:7px 10px;border:0.5px solid #ddd;font-size:9pt;">${p.milestone}</td>
      <td style="padding:7px 10px;border:0.5px solid #ddd;font-size:9pt;">$${fmt(p.amount)}</td>
      <td style="padding:7px 10px;border:0.5px solid #ddd;font-size:9pt;">${p.due}</td>
    </tr>`
    )
    .join("");

  const scopeHTML = (fields.scopes || [])
    .map((s, i) => {
      const letter = String.fromCharCode(65 + i);
      const colonIdx = s.indexOf(":");
      const label = colonIdx > -1 ? s.substring(0, colonIdx).trim() : s;
      const items =
        colonIdx > -1 ? s.substring(colonIdx + 1).split(",").map((x) => x.trim()).filter(Boolean) : [];
      return `
      <p style="font-weight:700;font-size:9.5pt;margin:10px 0 4px;">${letter}. ${label}</p>
      ${items.map((item) => `<p style="margin:2px 0 2px 20px;font-size:9pt;">• ${item}</p>`).join("")}
    `;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; }
  body { font-size: 10pt; line-height: 1.5; color: #1a1a1a; margin: 0; padding: 0; }
  h1.contract-title { text-align: center; font-size: 14pt; font-weight: 700; margin: 0 0 4px; }
  .title-rule { border: none; border-top: 1.5px solid #1a1a1a; margin: 0 0 14px; }
  .section-rule { border: none; border-top: 0.75px solid #1a1a1a; margin: 14px 0 3px; }
  .light-rule { border: none; border-top: 0.5px solid #ccccaa; margin: 8px 0; }
  h2.section-head { font-size: 10.5pt; font-weight: 700; margin: 0 0 6px; }
  .sub-head { font-size: 9.5pt; font-weight: 700; margin: 8px 0 3px; }
  p { margin: 0 0 6px; }
  .bullet { margin: 2px 0 2px 20px; font-size: 9.5pt; }
  .info-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  .info-table td { font-size: 9pt; padding: 4px 6px 4px 0; vertical-align: middle; }
  .info-label { font-weight: 700; white-space: nowrap; padding-right: 8px !important; }
  .pay-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  .pay-table th { background: #f0ede4; font-size: 9pt; font-weight: 700; padding: 6px 10px; border: 0.5px solid #ddd; text-align: left; }
  .pay-table .total-row td { background: #f5f3ee; font-weight: 700; font-size: 9pt; padding: 6px 10px; border: 0.75px solid #aaa; }
  .sig-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  .sig-table td { width: 50%; padding: 3px 0; vertical-align: bottom; font-size: 9pt; }
  .sig-line { border-top: 1px solid #555; width: 220px; margin-top: 20px; padding-top: 3px; }
  .sig-short-line { border-top: 1px solid #555; width: 140px; margin-top: 16px; padding-top: 3px; }
  .sig-hint { font-size: 7.5pt; color: #999; }
  .binding { text-align: center; font-weight: 700; font-size: 10pt; margin-top: 14px; }
  .header-inner { display: flex; align-items: flex-start; gap: 10px; }
  .header-company { font-size: 13pt; font-weight: 700; margin-bottom: 2px; }
  .header-sub { font-size: 8pt; color: #555; line-height: 1.5; }
</style>
</head>
<body>

<div class="header-inner" style="margin-bottom: 16px;">
  ${logoHtml}
  <div>
    <div class="header-company">${settings.company_name}</div>
    <div class="header-sub">
      ${settings.company_address}<br/>
      Phone: ${settings.company_phone} &nbsp;|&nbsp; Email: ${settings.company_email}<br/>
      Owner: ${settings.owner_name}
    </div>
  </div>
</div>

<h1 class="contract-title">CONSTRUCTION AGREEMENT</h1>
<hr class="title-rule"/>

<table class="info-table">
  <tr>
    <td class="info-label">Client/Owner:</td>
    <td>${fields.clientName}</td>
    <td class="info-label">Contract Amount:</td>
    <td><strong>$${fmt(fields.totalPrice)}</strong></td>
  </tr>
  <tr>
    <td class="info-label">Address:</td>
    <td>${fields.clientAddress}</td>
    <td class="info-label">Est. Completion:</td>
    <td>_______________________</td>
  </tr>
  <tr>
    <td class="info-label">Start Date:</td>
    <td>_______________________</td>
    <td></td><td></td>
  </tr>
</table>
<hr class="light-rule"/>

<hr class="section-rule"/>
<h2 class="section-head">1. PROJECT DESCRIPTION</h2>
<p>${fields.projectDescription}</p>
<p><strong>Estimated Project Duration:</strong> ${fields.estimatedDuration}, subject to weather conditions, material availability, and township inspections.</p>

<hr class="section-rule"/>
<h2 class="section-head">2. SCOPE OF WORK</h2>
${scopeHTML}

<hr class="section-rule"/>
<h2 class="section-head">3. CONTRACT PRICE</h2>
<p><strong>Total Contract Price: $${fmt(fields.totalPrice)}</strong></p>
<p>This price includes:</p>
${(fields.priceIncludes || ["All labor and materials", "Project drawings", "Permit fees", "Dumpster and debris removal"])
  .map((i) => `<p class="bullet">• ${i}</p>`)
  .join("")}
<p style="margin-top:6px;">Not included: work arising from unforeseen conditions, change orders, material upgrades beyond specifications, or landscaping restoration beyond normal grading.</p>

<hr class="section-rule"/>
<h2 class="section-head">4. PAYMENT SCHEDULE</h2>
<table class="pay-table">
  <thead>
    <tr>
      <th style="width:38%">Milestone</th>
      <th style="width:18%">Amount</th>
      <th style="width:44%">When Due</th>
    </tr>
  </thead>
  <tbody>
    ${payRows}
    <tr class="total-row">
      <td>TOTAL</td>
      <td>$${fmt(fields.totalPrice)}</td>
      <td></td>
    </tr>
  </tbody>
</table>
<p style="font-size:8.5pt;"><strong>Amount Paid to Date:</strong> $0.00 &nbsp;&nbsp; <strong>Balance Due:</strong> $${fmt(fields.totalPrice)}</p>

<hr class="section-rule"/>
<h2 class="section-head">5. CHANGE ORDERS</h2>
<p>Any modifications or additions to the scope of work must be approved in writing by both parties and priced and agreed upon prior to execution. No additional work shall commence without a signed change order.</p>

<hr class="section-rule"/>
<h2 class="section-head">6. UNFORESEEN CONDITIONS</h2>
<p>Any unforeseen structural issues, concealed conditions, or code requirements discovered during demolition or construction may require additional work and cost. The Contractor will notify the Client and provide a written estimate before proceeding. No work on unforeseen items shall proceed without written Client approval.</p>

<hr class="section-rule"/>
<h2 class="section-head">7. PROJECT TIMELINE</h2>
<p>The Contractor will make every reasonable effort to complete the project within the estimated timeframe. The Contractor shall not be held liable for delays caused by:</p>
<p class="bullet">• Weather conditions</p>
<p class="bullet">• Material availability or supply chain delays</p>
<p class="bullet">• Township inspections and permitting</p>
<p class="bullet">• Unforeseen site conditions</p>

<hr class="section-rule"/>
<h2 class="section-head">8. PERMITS &amp; COMPLIANCE</h2>
<p>The Contractor will obtain all necessary permits and perform all work in accordance with applicable local, state, and federal building codes and regulations in Pennsylvania.</p>

<hr class="section-rule"/>
<h2 class="section-head">9. INSURANCE &amp; LIABILITY</h2>
<p>${settings.company_name} is licensed and insured in the Commonwealth of Pennsylvania. The Contractor shall maintain general liability coverage and workers' compensation insurance as required by Pennsylvania law throughout the duration of the project.</p>

<hr class="section-rule"/>
<h2 class="section-head">10. WARRANTY</h2>
<p>The Contractor provides a <strong>one (1) year workmanship warranty</strong> from the date of substantial project completion. This warranty does not cover:</p>
<p class="bullet">• Normal wear and tear</p>
<p class="bullet">• Manufacturer defects (covered under applicable manufacturer warranties)</p>
<p class="bullet">• Damage resulting from misuse, neglect, or lack of maintenance by the Client</p>

<hr class="section-rule"/>
<h2 class="section-head">11. PAYMENT TERMS &amp; DEFAULT</h2>
<p>Payments are due per the schedule outlined in Section 4. Failure to remit payment within five (5) business days of the due date may result in:</p>
<p class="bullet">• Suspension of work until payment is received</p>
<p class="bullet">• Assessment of interest on overdue balances</p>
<p class="bullet">• Legal action to recover amounts owed</p>
<p class="bullet">• Filing of a Mechanics' Lien against the property in accordance with the Pennsylvania Mechanics' Lien Law</p>

<hr class="section-rule"/>
<h2 class="section-head">12. ENTIRE AGREEMENT</h2>
<p>This Agreement constitutes the entire understanding between ${settings.company_name} and ${fields.clientName} and supersedes all prior discussions, representations, or agreements, whether oral or written. Any modifications to this Agreement must be made in writing and signed by both parties.</p>

<hr class="section-rule"/>
<h2 class="section-head">13. ACCEPTANCE &amp; SIGNATURES</h2>
<p>By signing below, both parties acknowledge they have read, understood, and agree to all terms and conditions of this Agreement.</p>

<table class="sig-table">
  <tr>
    <td><strong>CONTRACTOR</strong></td>
    <td><strong>CLIENT</strong></td>
  </tr>
  <tr>
    <td>${settings.company_name}</td>
    <td>${fields.clientName}</td>
  </tr>
  <tr>
    <td style="font-size:8.5pt;color:#555;">By: ${settings.owner_name}</td>
    <td></td>
  </tr>
  <tr>
    <td>
      <div class="sig-line"></div>
      <div class="sig-hint">Signature</div>
    </td>
    <td>
      <div class="sig-line"></div>
      <div class="sig-hint">Signature</div>
    </td>
  </tr>
  <tr>
    <td>
      <div class="sig-short-line"></div>
      <div class="sig-hint">Date</div>
    </td>
    <td>
      <div class="sig-short-line"></div>
      <div class="sig-hint">Date</div>
    </td>
  </tr>
</table>

<p class="binding">This contract is legally binding when signed by both parties.</p>

</body>
</html>`;
}

// ─── CHANGE ORDER HTML Template ───────────────────────────────────────────────
function buildChangeOrderHTML(settings, job, co) {
  const logoHtml = settings.company_logo_url
    ? `<img src="${settings.company_logo_url}" style="width:56px;height:56px;object-fit:contain;" />`
    : `<div style="width:56px;height:56px;background:#f0ede4;border-radius:4px;"></div>`;

  const fmt = (n) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2 });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; }
  body { font-size: 10pt; line-height: 1.5; color: #1a1a1a; margin: 0; padding: 0; }
  h1.co-title { text-align: center; font-size: 14pt; font-weight: 700; margin: 0 0 4px; }
  .title-rule { border: none; border-top: 1.5px solid #1a1a1a; margin: 0 0 14px; }
  .section-rule { border: none; border-top: 0.75px solid #1a1a1a; margin: 14px 0 3px; }
  .light-rule { border: none; border-top: 0.5px solid #ccccaa; margin: 8px 0; }
  h2.section-head { font-size: 10.5pt; font-weight: 700; margin: 0 0 6px; }
  p { margin: 0 0 6px; }
  .bullet { margin: 2px 0 2px 20px; font-size: 9.5pt; }
  .info-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  .info-table td { font-size: 9pt; padding: 4px 6px 4px 0; }
  .info-label { font-weight: 700; white-space: nowrap; padding-right: 8px !important; }
  .cost-table { width: 60%; border-collapse: collapse; margin: 8px 0; }
  .cost-table td { padding: 6px 10px; border: 0.5px solid #ddd; font-size: 9pt; }
  .cost-table .total-row td { background: #f0ede4; font-weight: 700; border: 0.75px solid #aaa; }
  .new-total { font-size: 12pt; font-weight: 700; color: #1a6b3a; margin: 8px 0; }
  .sig-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  .sig-table td { width: 50%; padding: 3px 0; vertical-align: bottom; font-size: 9pt; }
  .sig-line { border-top: 1px solid #555; width: 220px; margin-top: 20px; padding-top: 3px; }
  .sig-short-line { border-top: 1px solid #555; width: 140px; margin-top: 16px; padding-top: 3px; }
  .sig-hint { font-size: 7.5pt; color: #999; }
  .binding { text-align: center; font-weight: 700; font-size: 10pt; margin-top: 14px; }
  .header-inner { display: flex; align-items: flex-start; gap: 10px; }
  .header-company { font-size: 13pt; font-weight: 700; margin-bottom: 2px; }
  .header-sub { font-size: 8pt; color: #555; line-height: 1.5; }
  .alert-box { background: #fff8e6; border: 1px solid #e6c84a; border-radius: 6px; padding: 10px 14px; margin: 10px 0; font-size: 9pt; }
</style>
</head>
<body>

<div class="header-inner" style="margin-bottom: 16px;">
  ${logoHtml}
  <div>
    <div class="header-company">${settings.company_name}</div>
    <div class="header-sub">
      ${settings.company_address}<br/>
      Phone: ${settings.company_phone} &nbsp;|&nbsp; Email: ${settings.company_email}<br/>
      Owner: ${settings.owner_name}
    </div>
  </div>
</div>

<h1 class="co-title">CHANGE ORDER</h1>
<hr class="title-rule"/>

<table class="info-table">
  <tr>
    <td class="info-label">Client/Owner:</td>
    <td>${job.client_name}</td>
    <td class="info-label">Change Order #:</td>
    <td><strong>${co.changeOrderNumber}</strong></td>
  </tr>
  <tr>
    <td class="info-label">Project Address:</td>
    <td>${job.address}</td>
    <td class="info-label">Date Issued:</td>
    <td>${co.dateIssued}</td>
  </tr>
  <tr>
    <td class="info-label">Original Contract:</td>
    <td>$${fmt(job.contract_amount)}</td>
    <td></td><td></td>
  </tr>
  <tr>
    <td class="info-label">This Change Order:</td>
    <td><strong>$${fmt(co.totalCost)}</strong></td>
    <td></td><td></td>
  </tr>
</table>
<hr class="light-rule"/>

<hr class="section-rule"/>
<h2 class="section-head">1. DESCRIPTION OF CHANGE</h2>
<p>${co.description}</p>
<p><strong>Reason:</strong> ${co.reason}</p>

<hr class="section-rule"/>
<h2 class="section-head">2. SCOPE OF ADDITIONAL WORK</h2>
${(co.scopeItems || []).map((item) => `<p class="bullet">• ${item}</p>`).join("")}

<hr class="section-rule"/>
<h2 class="section-head">3. COST BREAKDOWN</h2>
<table class="cost-table">
  <tr><td>Labor</td><td>$${fmt(co.laborCost)}</td></tr>
  <tr><td>Materials</td><td>$${fmt(co.materialsCost)}</td></tr>
  <tr class="total-row"><td>TOTAL THIS CHANGE ORDER</td><td>$${fmt(co.totalCost)}</td></tr>
</table>

<hr class="section-rule"/>
<h2 class="section-head">4. SCHEDULE IMPACT</h2>
${
  Number(co.estimatedDaysAdded) > 0
    ? `<p>This change order adds approximately <strong>${co.estimatedDaysAdded} calendar days</strong> to the project timeline.</p>`
    : `<p>This change order has no impact on the project timeline.</p>`
}

<hr class="section-rule"/>
<h2 class="section-head">5. PAYMENT TERMS</h2>
<div class="alert-box">
  Payment of <strong>$${fmt(co.totalCost)}</strong> is due ${co.paymentDue}.<br/>
  Work on this change order will not begin until this Change Order is signed by both parties.
</div>

<hr class="section-rule"/>
<h2 class="section-head">6. AUTHORIZATION</h2>
<p>By signing below, both parties agree to the additional scope, cost, and terms described in this Change Order.</p>

<table class="sig-table">
  <tr>
    <td><strong>CONTRACTOR</strong></td>
    <td><strong>CLIENT</strong></td>
  </tr>
  <tr>
    <td>${settings.company_name}</td>
    <td>${job.client_name}</td>
  </tr>
  <tr>
    <td style="font-size:8.5pt;color:#555;">By: ${settings.owner_name}</td>
    <td></td>
  </tr>
  <tr>
    <td><div class="sig-line"></div><div class="sig-hint">Signature</div></td>
    <td><div class="sig-line"></div><div class="sig-hint">Signature</div></td>
  </tr>
  <tr>
    <td><div class="sig-short-line"></div><div class="sig-hint">Date</div></td>
    <td><div class="sig-short-line"></div><div class="sig-hint">Date</div></td>
  </tr>
</table>

<p class="binding">This Change Order is legally binding when signed by both parties.</p>

</body>
</html>`;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ContractGenerator() {
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const { data: settingsArr = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }),
  });
  const settings = settingsArr[0] || {};

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list(),
  });

  const [mode, setMode] = useState("contract");
  const [step, setStep] = useState(1);
  const [pdfBase64, setPdfBase64] = useState(null);
  const [fileName, setFileName] = useState("");
  const [scanning, setScanning] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [fields, setFields] = useState({
    clientName: "",
    clientAddress: "",
    projectDescription: "",
    estimatedDuration: "",
    totalPrice: "",
    materialsCost: "",
    priceIncludes: ["All labor and materials", "Project drawings", "Permit fees", "Dumpster and debris removal"],
    scopes: [],
    payments: [],
    extraNotes: "",
  });

  const [selectedJobId, setSelectedJobId] = useState("");
  const [coFields, setCoFields] = useState({
    changeOrderNumber: "CO-001",
    dateIssued: new Date().toLocaleDateString("en-US"),
    reason: "Client Request",
    description: "",
    scopeItems: [""],
    laborCost: "",
    materialsCost: "",
    totalCost: "",
    estimatedDaysAdded: 0,
    paymentDue: "Due upon signing",
  });

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  function handleFile(file) {
    if (!file || file.type !== "application/pdf") {
      toast({ title: "Please upload a PDF file", variant: "destructive" });
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setPdfBase64(e.target.result.split(",")[1]);
    reader.readAsDataURL(file);
  }

  async function scanPDF() {
    if (!pdfBase64) return;
    setScanning(true);
    try {
      const data = await scanPDFWithAI(pdfBase64);
      setFields((f) => ({ ...f, ...data }));
      setStep(2);
      toast({ title: "✓ Bid scanned! Review the fields below." });
    } catch (e) {
      toast({
        title: "Error reading PDF — ensure it is a typed (not scanned) PDF",
        variant: "destructive",
      });
      console.error(e);
    }
    setScanning(false);
  }

  async function generateContract() {
    setGenerating(true);
    try {
      const html = buildContractHTML(settings, fields);
      const clientLast = (fields.clientName || "client").split(" ").pop();
      const today = new Date().toISOString().split("T")[0];
      const filename = `Contract_${clientLast}_${today}.pdf`;
      
      generatePDFFromHTML(html, filename);
      setStep(3);
      toast({ title: "✓ Contract downloaded!" });
    } catch (e) {
      toast({ title: "Error generating contract PDF", variant: "destructive" });
      console.error(e);
    }
    setGenerating(false);
  }

  async function generateChangeOrder() {
    if (!selectedJob) return;
    setGenerating(true);
    try {
      const coNum = `CO-${String((selectedJob.change_orders || []).length + 1).padStart(3, "0")}`;
      const coData = { ...coFields, changeOrderNumber: coNum };
      const html = buildChangeOrderHTML(settings, selectedJob, coData);
      const clientLast = (selectedJob.client_name || "client").split(" ").pop();
      const today = new Date().toISOString().split("T")[0];
      const filename = `ChangeOrder_${coNum}_${clientLast}_${today}.pdf`;

      generatePDFFromHTML(html, filename);

      const coTotal = Number(coData.laborCost || 0) + Number(coData.materialsCost || 0);
      const coRecord = await base44.entities.ChangeOrder.create({
        job_id: selectedJob.id,
        change_order_number: coNum,
        date_issued: coData.dateIssued,
        reason: coData.reason,
        description: coData.description,
        scope_items: coData.scopeItems,
        labor_cost: Number(coData.laborCost) || 0,
        material_cost: Number(coData.materialsCost) || 0,
        total_cost: coTotal,
        estimated_days_added: Number(coData.estimatedDaysAdded) || 0,
        payment_due: coData.paymentDue,
      });

      const existingCOIds = selectedJob.change_orders || [];
      await base44.entities.Job.update(selectedJob.id, {
        change_orders: [...existingCOIds, coRecord.id],
      });

      setStep(3);
      toast({ title: "✓ Change Order created and downloaded!" });
    } catch (e) {
      toast({ title: "Error generating Change Order PDF", variant: "destructive" });
      console.error(e);
    }
    setGenerating(false);
  }

  const updateScope = (i, val) =>
    setFields((f) => {
      const s = [...f.scopes];
      s[i] = val;
      return { ...f, scopes: s };
    });
  const removeScope = (i) => setFields((f) => ({ ...f, scopes: f.scopes.filter((_, idx) => idx !== i) }));
  const addScope = () => setFields((f) => ({ ...f, scopes: [...f.scopes, ""] }));

  const updatePayment = (i, key, val) =>
    setFields((f) => {
      const p = [...f.payments];
      p[i] = { ...p[i], [key]: val };
      return { ...f, payments: p };
    });
  const removePayment = (i) => setFields((f) => ({ ...f, payments: f.payments.filter((_, idx) => idx !== i) }));
  const addPayment = () =>
    setFields((f) => ({ ...f, payments: [...f.payments, { milestone: "", amount: "", due: "" }] }));

  const updateCOScope = (i, val) =>
    setCoFields((f) => {
      const s = [...f.scopeItems];
      s[i] = val;
      return { ...f, scopeItems: s };
    });
  const removeCOScope = (i) =>
    setCoFields((f) => ({ ...f, scopeItems: f.scopeItems.filter((_, idx) => idx !== i) }));
  const addCOScope = () => setCoFields((f) => ({ ...f, scopeItems: [...f.scopeItems, ""] }));

  const coTotal = Number(coFields.laborCost || 0) + Number(coFields.materialsCost || 0);

  return (
    <div>
      <PageHeader
        title="Contract & Change Order Generator"
        description="Upload a bid PDF to generate a professional contract, or create a change order for an existing job."
      />

      <div className="flex gap-3 mb-6">
        <Button
          variant={mode === "contract" ? "default" : "outline"}
          onClick={() => {
            setMode("contract");
            setStep(1);
          }}
          className="gap-2"
        >
          <FileText className="w-4 h-4" /> New Contract
        </Button>
        <Button
          variant={mode === "changeorder" ? "default" : "outline"}
          onClick={() => {
            setMode("changeorder");
            setStep(1);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> Change Order
        </Button>
      </div>

      {mode === "contract" && (
        <div className="space-y-5 max-w-3xl">
          {step === 1 && (
            <Card className="p-6">
              <h3 className="text-sm font-semibold mb-1">Step 1 — Upload Bid PDF</h3>
              <p className="text-xs text-muted-foreground mb-4">
                AI will read your bid and extract every detail automatically.
              </p>
              <div
                className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFile(e.dataTransfer.files[0]);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload or drag your bid PDF here</p>
                <p className="text-xs text-muted-foreground mt-1">Accepts typed/digital PDFs only</p>
                {fileName && (
                  <p className="mt-3 text-sm text-green-600 font-medium flex items-center justify-center gap-1">
                    <CheckCircle className="w-4 h-4" /> {fileName}
                  </p>
                )}
              </div>
              <Button className="w-full mt-4" disabled={!pdfBase64 || scanning} onClick={scanPDF}>
                {scanning ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    AI is reading your bid...
                  </>
                ) : (
                  "Scan Bid with AI"
                )}
              </Button>
            </Card>
          )}

          {step === 2 && (
            <Card className="p-6 space-y-5">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Bid scanned successfully — review and edit below.
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 border-b pb-1">
                  Client
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Client Name</Label>
                    <Input
                      value={fields.clientName}
                      onChange={(e) => setFields((f) => ({ ...f, clientName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Client Address</Label>
                    <Input
                      value={fields.clientAddress}
                      onChange={(e) => setFields((f) => ({ ...f, clientAddress: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 border-b pb-1">
                  Project
                </p>
                <div className="space-y-3">
                  <div>
                    <Label>Project Description</Label>
                    <Textarea
                      value={fields.projectDescription}
                      onChange={(e) => setFields((f) => ({ ...f, projectDescription: e.target.value }))}
                      className="min-h-[72px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Estimated Duration</Label>
                      <Input
                        value={fields.estimatedDuration}
                        onChange={(e) => setFields((f) => ({ ...f, estimatedDuration: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Total Contract Price ($)</Label>
                      <Input
                        type="number"
                        value={fields.totalPrice}
                        onChange={(e) => setFields((f) => ({ ...f, totalPrice: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 border-b pb-1">
                  Scope of Work
                </p>
                {fields.scopes.map((s, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <Input
                      value={s}
                      onChange={(e) => updateScope(i, e.target.value)}
                      placeholder="Section: detail one, detail two..."
                      className="flex-1"
                    />
                    <Button size="icon" variant="ghost" onClick={() => removeScope(i)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="text-primary" onClick={addScope}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Scope Section
                </Button>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 border-b pb-1">
                  Payment Schedule
                </p>
                <div className="grid grid-cols-[2fr_1fr_2fr_36px] gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">Milestone</span>
                  <span className="text-xs text-muted-foreground">Amount ($)</span>
                  <span className="text-xs text-muted-foreground">When Due</span>
                  <span></span>
                </div>
                {fields.payments.map((p, i) => (
                  <div key={i} className="grid grid-cols-[2fr_1fr_2fr_36px] gap-2 mb-2">
                    <Input
                      value={p.milestone}
                      onChange={(e) => updatePayment(i, "milestone", e.target.value)}
                      placeholder="Milestone name"
                    />
                    <Input
                      type="number"
                      value={p.amount}
                      onChange={(e) => updatePayment(i, "amount", e.target.value)}
                      placeholder="Amount"
                    />
                    <Input
                      value={p.due}
                      onChange={(e) => updatePayment(i, "due", e.target.value)}
                      placeholder="When due"
                    />
                    <Button size="icon" variant="ghost" onClick={() => removePayment(i)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="text-primary" onClick={addPayment}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Milestone
                </Button>
              </div>

              <Button className="w-full" disabled={generating} onClick={generateContract}>
                {generating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Generating contract...
                  </>
                ) : (
                  "Generate Contract PDF"
                )}
              </Button>
            </Card>
          )}

          {step === 3 && (
            <Card className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Contract Generated!</h3>
              <p className="text-sm text-muted-foreground">
                {fields.clientName} · ${Number(fields.totalPrice).toLocaleString()}
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep(1);
                  setPdfBase64(null);
                  setFileName("");
                }}
              >
                Generate Another Contract
              </Button>
            </Card>
          )}
        </div>
      )}

      {mode === "changeorder" && (
        <div className="space-y-5 max-w-3xl">
          <Card className="p-6">
            <h3 className="text-sm font-semibold mb-3">Select Existing Job</h3>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background"
            >
              <option value="">— Select a job —</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.client_name} · {j.title} · ${Number(j.contract_amount || 0).toLocaleString()}
                </option>
              ))}
            </select>

            {selectedJob && (
              <div className="mt-4 bg-muted/30 rounded-lg p-4 text-sm grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Client:</span>{" "}
                  <strong>{selectedJob.client_name}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Contract Amount:</span>{" "}
                  <strong>${Number(selectedJob.contract_amount || 0).toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Prior Change Orders:</span>{" "}
                  <strong>{(selectedJob.change_orders || []).length}</strong>
                </div>
              </div>
            )}
          </Card>

          {selectedJob && step < 3 && (
            <Card className="p-6 space-y-5">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 border-b pb-1">
                  Change Details
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <Label>Change Order #</Label>
                    <Input
                      value={`CO-${String((selectedJob.change_orders || []).length + 1).padStart(3, "0")}`}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label>Date Issued</Label>
                    <Input
                      value={coFields.dateIssued}
                      onChange={(e) => setCoFields((f) => ({ ...f, dateIssued: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <Label>Reason for Change</Label>
                  <select
                    value={coFields.reason}
                    onChange={(e) => setCoFields((f) => ({ ...f, reason: e.target.value }))}
                    className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background mt-1"
                  >
                    {[
                      "Client Request",
                      "Unforeseen Condition",
                      "Design Modification",
                      "Material Substitution",
                      "Code Requirement",
                      "Other",
                    ].map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Description of Change</Label>
                  <Textarea
                    value={coFields.description}
                    onChange={(e) => setCoFields((f) => ({ ...f, description: e.target.value }))}
                    className="min-h-[80px]"
                    placeholder="Explain what is changing and why..."
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 border-b pb-1">
                  Scope of Additional Work
                </p>
                {coFields.scopeItems.map((s, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <Input
                      value={s}
                      onChange={(e) => updateCOScope(i, e.target.value)}
                      placeholder="Work item description..."
                      className="flex-1"
                    />
                    <Button size="icon" variant="ghost" onClick={() => removeCOScope(i)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="text-primary" onClick={addCOScope}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Work Item
                </Button>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 border-b pb-1">
                  Cost Breakdown
                </p>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <Label>Labor Cost ($)</Label>
                    <Input
                      type="number"
                      value={coFields.laborCost}
                      onChange={(e) => setCoFields((f) => ({ ...f, laborCost: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Materials Cost ($)</Label>
                    <Input
                      type="number"
                      value={coFields.materialsCost}
                      onChange={(e) => setCoFields((f) => ({ ...f, materialsCost: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 text-sm">
                  <strong>Total This Change Order: ${coTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Additional Days Added</Label>
                  <Input
                    type="number"
                    value={coFields.estimatedDaysAdded}
                    onChange={(e) => setCoFields((f) => ({ ...f, estimatedDaysAdded: e.target.value }))}
                    min="0"
                  />
                </div>
                <div>
                  <Label>Payment Due</Label>
                  <Input
                    value={coFields.paymentDue}
                    onChange={(e) => setCoFields((f) => ({ ...f, paymentDue: e.target.value }))}
                    placeholder="e.g. Due upon signing"
                  />
                </div>
              </div>

              <Button className="w-full" disabled={generating || !coFields.description} onClick={generateChangeOrder}>
                {generating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Generating Change Order...
                  </>
                ) : (
                  "Generate Change Order PDF"
                )}
              </Button>
            </Card>
          )}

          {step === 3 && (
            <Card className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Change Order Generated!</h3>
              <p className="text-sm text-muted-foreground">
                {selectedJob?.client_name} · +${coTotal.toLocaleString()}
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep(1);
                  setSelectedJobId("");
                }}
              >
                Create Another Change Order
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}