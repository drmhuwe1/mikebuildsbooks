import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Trash2, Download, CheckCircle, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/shared/PageHeader";

const MBB_LOGO_URL = "https://media.base44.com/images/public/69b9774720c1d890b1162f57/e28d19baa_MikeBuildsBooksLogo.png";

const fmt = (n) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2 });

function buildPaymentRows(contract) {
  if (contract.payment_schedule && Array.isArray(contract.payment_schedule) && contract.payment_schedule.length > 0) {
    return contract.payment_schedule.map(p => ({
      milestone: p.milestone || p.label || "",
      amount: p.amount || (p.percent ? (Number(contract.contract_amount) * p.percent / 100) : 0),
      due: p.condition || p.when || "",
    }));
  }
  const rows = [];
  if (contract.deposit_amount) rows.push({ milestone: "Deposit – Materials Procurement & Project Scheduling", amount: contract.deposit_amount, due: "Due at contract signing" });
  if (contract.start_of_construction_amount) rows.push({ milestone: contract.start_of_construction_label || "Payment #2 – Start of Construction", amount: contract.start_of_construction_amount, due: "Upon completion of demolition & foundation" });
  if (contract.payment3_amount) rows.push({ milestone: contract.payment3_label || "Payment #3", amount: contract.payment3_amount, due: "Upon completion of framing & exterior shell" });
  if (contract.final_payment_amount) rows.push({ milestone: "Final Payment – Project Completion", amount: contract.final_payment_amount, due: "Upon substantial completion & final walkthrough" });
  return rows;
}

function buildScopes(contract) {
  if (!contract.scope_summary) return [];
  try { const p = JSON.parse(contract.scope_summary); if (Array.isArray(p)) return p; } catch (e) {}
  return contract.scope_summary.split(/\n|;/).map(s => s.trim()).filter(Boolean);
}

function buildIncludes(contract) {
  const defaults = ["All labor and materials", "Project drawings", "Permit fees", "Dumpster and debris removal"];
  if (!contract.included_in_bid) return defaults;
  try { const p = JSON.parse(contract.included_in_bid); if (Array.isArray(p)) return p; } catch (e) {}
  return contract.included_in_bid.split(/\n|;/).map(s => s.trim()).filter(Boolean);
}

function buildContractHTML(settings, contract, paymentRows, scopes, includes) {
  const logoHtml = settings.company_logo_url
    ? `<img src="${settings.company_logo_url}" style="width:60px;height:60px;object-fit:contain;" />`
    : `<div style="width:60px;height:60px;background:#f0ede4;border-radius:4px;"></div>`;
  const mbbLogoHtml = `<img src="${MBB_LOGO_URL}" style="width:28px;height:28px;object-fit:contain;vertical-align:middle;background:transparent;" />`;
  const clientName = `${contract.client_name || ""} ${contract.client_last_name || ""}`.trim();
  const clientAddress = contract.client_address || contract.project_address || "";

  const scopeHTML = scopes.map((s, i) => {
    const letter = String.fromCharCode(65 + i);
    const colonIdx = s.indexOf(":");
    const label = colonIdx > -1 ? s.substring(0, colonIdx).trim() : s;
    const items = colonIdx > -1 ? s.substring(colonIdx + 1).split(",").map(x => x.trim()).filter(Boolean) : [];
    return `<p style="font-weight:700;font-size:9.5pt;margin:10px 0 4px 0;">${letter}. ${label}</p>${items.map(item => `<p style="margin:2px 0 2px 20px;font-size:9pt;">• ${item}</p>`).join("")}`;
  }).join("");

  const payRowsHTML = paymentRows.map(p => `
    <tr>
      <td style="padding:7px 10px;border:0.5px solid #ddd;font-size:9pt;">${p.milestone}</td>
      <td style="padding:7px 10px;border:0.5px solid #ddd;font-size:9pt;">$${fmt(p.amount)}</td>
      <td style="padding:7px 10px;border:0.5px solid #ddd;font-size:9pt;">${p.due}</td>
    </tr>`).join("");

  const exclusionsHTML = contract.exclusions
    ? `<p style="margin-top:6px;">Not included: ${contract.exclusions}</p>`
    : `<p style="margin-top:6px;">Not included: work arising from unforeseen conditions, change orders, material upgrades beyond specifications, or landscaping restoration beyond normal grading.</p>`;

  const disclaimerHTML = contract.disclaimer
    ? `<p style="font-size:8.5pt;color:#555;margin-top:8px;font-style:italic;">${contract.disclaimer}</p>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  @page { size:letter; margin-top:1.45in; margin-bottom:0.9in; margin-left:0.75in; margin-right:0.75in; @top-left{content:element(header);} @bottom-center{content:element(footer);} }
  * { box-sizing:border-box; font-family:Arial,Helvetica,sans-serif; }
  body { font-size:10pt; line-height:1.5; color:#1a1a1a; }
  #page-header { position:running(header); width:100%; padding-bottom:8px; border-bottom:0.75px solid #ccccaa; }
  .header-inner { display:flex; align-items:flex-start; gap:12px; }
  .header-company { font-size:13pt; font-weight:700; margin-bottom:2px; }
  .header-sub { font-size:8pt; color:#555; line-height:1.6; }
  #page-footer { position:running(footer); width:100%; border-top:0.5px solid #ccccaa; padding-top:6px; display:flex; align-items:center; justify-content:space-between; }
  .footer-left { font-size:7.5pt; color:#999; font-style:italic; flex:1; text-align:left; }
  .footer-center { flex:0 0 auto; padding:0 20px; line-height:1; }
  .footer-right { font-size:7.5pt; color:#999; font-style:italic; flex:1; text-align:right; }
  h1.contract-title { text-align:center; font-size:14pt; font-weight:700; margin:0 0 4px; }
  .title-rule { border:none; border-top:1.5px solid #1a1a1a; margin:0 0 14px; }
  .section-rule { border:none; border-top:0.75px solid #1a1a1a; margin:14px 0 3px; }
  .light-rule { border:none; border-top:0.5px solid #ccccaa; margin:8px 0; }
  h2.section-head { font-size:10.5pt; font-weight:700; margin:0 0 6px; page-break-after:avoid; }
  p { margin:0 0 6px; orphans:3; widows:3; }
  .bullet { margin:2px 0 2px 20px; font-size:9.5pt; }
  .info-table { width:100%; border-collapse:collapse; margin-bottom:10px; }
  .info-table td { font-size:9pt; padding:4px 6px 4px 0; vertical-align:middle; }
  .info-label { font-weight:700; white-space:nowrap; padding-right:8px !important; }
  .pay-table { width:100%; border-collapse:collapse; margin:8px 0; page-break-inside:avoid; }
  .pay-table th { background:#f0ede4; font-size:9pt; font-weight:700; padding:6px 10px; border:0.5px solid #ddd; text-align:left; }
  .pay-table .total-row td { background:#f5f3ee; font-weight:700; font-size:9pt; padding:6px 10px; border:0.75px solid #aaa; }
  .sig-wrap { page-break-inside:avoid; margin-top:16px; }
  .sig-table { width:100%; border-collapse:collapse; }
  .sig-table td { width:50%; padding:3px 0; vertical-align:bottom; font-size:9pt; }
  .sig-line { border-top:1px solid #555; width:220px; margin-top:22px; padding-top:3px; }
  .sig-short-line { border-top:1px solid #555; width:140px; margin-top:18px; padding-top:3px; }
  .sig-hint { font-size:7.5pt; color:#999; }
  .binding { text-align:center; font-weight:700; font-size:10pt; margin-top:14px; }
</style>
</head>
<body>
<div id="page-header">
  <div class="header-inner">
    ${logoHtml}
    <div style="flex:1;">
      <div class="header-company">${settings.company_name || ""}</div>
      <div class="header-sub">${settings.company_address || ""}<br/>Phone: ${settings.company_phone || ""} &nbsp;|&nbsp; Email: ${settings.company_email || ""}<br/>Owner: ${settings.owner_name || ""}</div>
    </div>
  </div>
</div>
<div id="page-footer">
  <div class="footer-left">Strong Builds. Stronger Books.</div>
  <div class="footer-center">${mbbLogoHtml}</div>
  <div class="footer-right">Powered by MikeBuildsBooks</div>
</div>

<h1 class="contract-title">CONSTRUCTION AGREEMENT</h1>
<hr class="title-rule"/>
<table class="info-table">
  <tr><td class="info-label">Client/Owner:</td><td>${clientName}</td><td class="info-label">Contract Amount:</td><td><strong>$${fmt(contract.contract_amount)}</strong></td></tr>
  <tr><td class="info-label">Address:</td><td>${clientAddress}</td><td class="info-label">Est. Completion:</td><td>_______________________</td></tr>
  <tr><td class="info-label">Start Date:</td><td>_______________________</td><td></td><td></td></tr>
</table>
<hr class="light-rule"/>

<hr class="section-rule"/>
<h2 class="section-head">1. PROJECT DESCRIPTION</h2>
<p>${contract.project_description || contract.scope_summary || "Project details as agreed upon between both parties."}</p>

<hr class="section-rule"/>
<h2 class="section-head">2. SCOPE OF WORK</h2>
${scopeHTML || `<p>${contract.scope_summary || ""}</p>`}

<hr class="section-rule"/>
<h2 class="section-head">3. CONTRACT PRICE</h2>
<p><strong>Total Contract Price: $${fmt(contract.contract_amount)}</strong></p>
<p>This price includes:</p>
${includes.map(i => `<p class="bullet">• ${i}</p>`).join("")}
${exclusionsHTML}
${disclaimerHTML}

<hr class="section-rule"/>
<h2 class="section-head">4. PAYMENT SCHEDULE</h2>
<table class="pay-table">
  <thead><tr><th style="width:38%">Milestone</th><th style="width:18%">Amount</th><th style="width:44%">When Due</th></tr></thead>
  <tbody>
    ${payRowsHTML}
    <tr class="total-row"><td>TOTAL</td><td>$${fmt(contract.contract_amount)}</td><td></td></tr>
  </tbody>
</table>
<p style="font-size:8.5pt;"><strong>Amount Paid to Date:</strong> $0.00 &nbsp;&nbsp; <strong>Balance Due:</strong> $${fmt(contract.contract_amount)}</p>

<hr class="section-rule"/>
<h2 class="section-head">5. CHANGE ORDERS</h2>
<p>${contract.change_order_terms || "Any modifications or additions to the scope of work must be approved in writing by both parties and priced and agreed upon prior to execution. No additional work shall commence without a signed change order."}</p>

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
<p>${settings.company_name || "The Contractor"} is licensed and insured in the Commonwealth of Pennsylvania. The Contractor shall maintain general liability coverage and workers' compensation insurance as required by Pennsylvania law throughout the duration of the project.</p>

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
<p class="bullet">• Assessment of interest on overdue balances at 1.5% per month</p>
<p class="bullet">• Legal action to recover amounts owed</p>
<p class="bullet">• Filing of a Mechanics' Lien against the property in accordance with the Pennsylvania Mechanics' Lien Law, 49 P.S. § 1101 et seq.</p>

<hr class="section-rule"/>
<h2 class="section-head">12. ENTIRE AGREEMENT</h2>
<p>This Agreement constitutes the entire understanding between ${settings.company_name || "the Contractor"} and ${clientName} and supersedes all prior discussions, representations, or agreements, whether oral or written. Any modifications to this Agreement must be made in writing and signed by both parties.</p>

<hr class="section-rule"/>
<h2 class="section-head">13. ACCEPTANCE &amp; SIGNATURES</h2>
<p>By signing below, both parties acknowledge they have read, understood, and agree to all terms and conditions of this Agreement.</p>
<div class="sig-wrap">
<table class="sig-table">
  <tr><td><strong>CONTRACTOR</strong></td><td><strong>CLIENT</strong></td></tr>
  <tr><td>${settings.company_name || ""}</td><td>${clientName}</td></tr>
  <tr><td style="font-size:8.5pt;color:#555;">By: ${settings.owner_name || ""}</td><td></td></tr>
  <tr>
    <td><div class="sig-line"></div><div class="sig-hint">Signature</div></td>
    <td><div class="sig-line"></div><div class="sig-hint">Signature</div></td>
  </tr>
  <tr>
    <td><div class="sig-short-line"></div><div class="sig-hint">Date</div></td>
    <td><div class="sig-short-line"></div><div class="sig-hint">Date</div></td>
  </tr>
</table>
<p class="binding">This contract is legally binding when signed by both parties.</p>
</div>
</body>
</html>`;
}

function buildChangeOrderHTML(settings, job, co) {
  const logoHtml = settings.company_logo_url
    ? `<img src="${settings.company_logo_url}" style="width:60px;height:60px;object-fit:contain;" />`
    : `<div style="width:60px;height:60px;background:#f0ede4;border-radius:4px;"></div>`;
  const mbbLogoHtml = `<img src="${MBB_LOGO_URL}" style="width:28px;height:28px;object-fit:contain;vertical-align:middle;background:transparent;" />`;
  const prevCOTotal = (job.change_orders || []).filter(c => c.id !== co.id).reduce((sum, c) => sum + Number(c.total_estimated_cost || 0), 0);
  const newContractTotal = Number(job.contract_amount || 0) + prevCOTotal + Number(co.totalCost || 0);
  const amountPaid = Number(job.total_paid_by_customer || 0);
  const originalRemaining = Number(job.contract_amount || 0) - amountPaid;
  const amountNowDue = originalRemaining + Number(co.totalCost || 0);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  @page { size:letter; margin-top:1.45in; margin-bottom:0.9in; margin-left:0.75in; margin-right:0.75in; @top-left{content:element(header);} @bottom-center{content:element(footer);} }
  * { box-sizing:border-box; font-family:Arial,Helvetica,sans-serif; }
  body { font-size:10pt; line-height:1.5; color:#1a1a1a; }
  #page-header { position:running(header); width:100%; padding-bottom:8px; border-bottom:0.75px solid #ccccaa; }
  .header-inner { display:flex; align-items:flex-start; gap:12px; }
  .header-company { font-size:13pt; font-weight:700; margin-bottom:2px; }
  .header-sub { font-size:8pt; color:#555; line-height:1.6; }
  #page-footer { position:running(footer); width:100%; border-top:0.5px solid #ccccaa; padding-top:6px; display:flex; align-items:center; justify-content:space-between; }
  .footer-left { font-size:7.5pt; color:#999; font-style:italic; flex:1; text-align:left; }
  .footer-center { flex:0 0 auto; padding:0 20px; line-height:1; }
  .footer-right { font-size:7.5pt; color:#999; font-style:italic; flex:1; text-align:right; }
  h1.co-title { text-align:center; font-size:14pt; font-weight:700; margin:0 0 4px; }
  .title-rule { border:none; border-top:1.5px solid #1a1a1a; margin:0 0 14px; }
  .section-rule { border:none; border-top:0.75px solid #1a1a1a; margin:14px 0 3px; }
  .light-rule { border:none; border-top:0.5px solid #ccccaa; margin:8px 0; }
  h2.section-head { font-size:10.5pt; font-weight:700; margin:0 0 6px; page-break-after:avoid; }
  p { margin:0 0 6px; orphans:3; widows:3; }
  .bullet { margin:2px 0 2px 20px; font-size:9.5pt; }
  .info-table { width:100%; border-collapse:collapse; margin-bottom:8px; }
  .info-table td { font-size:9pt; padding:4px 6px 4px 0; }
  .info-label { font-weight:700; white-space:nowrap; padding-right:8px !important; }
  .new-total { font-size:12pt; font-weight:700; color:#1a6b3a; margin:6px 0; }
  .cost-table { width:60%; border-collapse:collapse; margin:8px 0; }
  .cost-table td { padding:6px 10px; border:0.5px solid #ddd; font-size:9pt; }
  .cost-table .total-row td { background:#f0ede4; font-weight:700; border:0.75px solid #aaa; }
  .alert-box { background:#fff8e6; border:1px solid #e6c84a; border-radius:6px; padding:10px 14px; margin:10px 0; font-size:9pt; }
  .payment-banner { background:#f0f7ff; border:1px solid #b8d4f0; border-radius:6px; padding:10px 14px; margin:10px 0; display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:8px; }
  .banner-cell { text-align:center; }
  .banner-label { font-size:7.5pt; color:#666; margin-bottom:3px; }
  .banner-value { font-size:10pt; font-weight:700; }
  .sig-wrap { page-break-inside:avoid; margin-top:16px; }
  .sig-table { width:100%; border-collapse:collapse; }
  .sig-table td { width:50%; padding:3px 0; vertical-align:bottom; font-size:9pt; }
  .sig-line { border-top:1px solid #555; width:220px; margin-top:22px; padding-top:3px; }
  .sig-short-line { border-top:1px solid #555; width:140px; margin-top:18px; padding-top:3px; }
  .sig-hint { font-size:7.5pt; color:#999; }
  .binding { text-align:center; font-weight:700; font-size:10pt; margin-top:14px; }
</style>
</head>
<body>
<div id="page-header">
  <div class="header-inner">
    ${logoHtml}
    <div style="flex:1;">
      <div class="header-company">${settings.company_name || ""}</div>
      <div class="header-sub">${settings.company_address || ""}<br/>Phone: ${settings.company_phone || ""} &nbsp;|&nbsp; Email: ${settings.company_email || ""}<br/>Owner: ${settings.owner_name || ""}</div>
    </div>
  </div>
</div>
<div id="page-footer">
  <div class="footer-left">Strong Builds. Stronger Books.</div>
  <div class="footer-center">${mbbLogoHtml}</div>
  <div class="footer-right">Powered by MikeBuildsBooks</div>
</div>

<h1 class="co-title">CHANGE ORDER</h1>
<hr class="title-rule"/>
<table class="info-table">
  <tr><td class="info-label">Client/Owner:</td><td>${job.client_name || ""}</td><td class="info-label">Change Order #:</td><td><strong>${co.changeOrderNumber}</strong></td></tr>
  <tr><td class="info-label">Project Address:</td><td>${job.address || ""}</td><td class="info-label">Date Issued:</td><td>${co.dateIssued}</td></tr>
  <tr><td class="info-label">Original Contract:</td><td>$${fmt(job.contract_amount)}</td><td class="info-label">Prior Change Orders:</td><td>$${fmt(prevCOTotal)}</td></tr>
  <tr><td class="info-label">This Change Order:</td><td><strong>$${fmt(co.totalCost)}</strong></td><td class="info-label">NEW CONTRACT TOTAL:</td><td class="new-total">$${fmt(newContractTotal)}</td></tr>
</table>
<hr class="light-rule"/>
<div class="payment-banner">
  <div class="banner-cell"><div class="banner-label">Original Contract</div><div class="banner-value">$${fmt(job.contract_amount)}</div></div>
  <div class="banner-cell" style="border-left:1px solid #b8d4f0;"><div class="banner-label">Paid to Date</div><div class="banner-value" style="color:#1a6b3a;">$${fmt(amountPaid)}</div></div>
  <div class="banner-cell" style="border-left:1px solid #b8d4f0;"><div class="banner-label">Original Remaining</div><div class="banner-value" style="color:#b8860b;">$${fmt(originalRemaining)}</div></div>
  <div class="banner-cell" style="border-left:1px solid #b8d4f0;background:#1a1a1a;border-radius:4px;padding:6px;"><div class="banner-label" style="color:#aaa;">AMOUNT NOW DUE</div><div class="banner-value" style="color:#fff;">$${fmt(amountNowDue)}</div></div>
</div>

<hr class="section-rule"/>
<h2 class="section-head">1. DESCRIPTION OF CHANGE</h2>
<p>${co.description}</p>
<p><strong>Reason:</strong> ${co.reason}</p>

<hr class="section-rule"/>
<h2 class="section-head">2. SCOPE OF ADDITIONAL WORK</h2>
${(co.scopeItems || []).map(item => `<p class="bullet">• ${item}</p>`).join("")}

<hr class="section-rule"/>
<h2 class="section-head">3. COST BREAKDOWN</h2>
<table class="cost-table">
  <tr><td>Labor</td><td>$${fmt(co.laborCost)}</td></tr>
  <tr><td>Materials</td><td>$${fmt(co.materialsCost)}</td></tr>
  <tr class="total-row"><td>TOTAL THIS CHANGE ORDER</td><td>$${fmt(co.totalCost)}</td></tr>
</table>

<hr class="section-rule"/>
<h2 class="section-head">4. CONTRACT PRICE ADJUSTMENT</h2>
<table class="cost-table">
  <tr><td>Original Contract Amount</td><td style="text-align:right;">$${fmt(job.contract_amount)}</td></tr>
  <tr><td>Prior Change Orders</td><td style="text-align:right;">$${fmt(prevCOTotal)}</td></tr>
  <tr><td>This Change Order</td><td style="text-align:right;">+ $${fmt(co.totalCost)}</td></tr>
  <tr class="total-row"><td>NEW CONTRACT TOTAL</td><td style="text-align:right;">$${fmt(newContractTotal)}</td></tr>
</table>
<table class="cost-table" style="margin-top:10px;">
  <tr><td>Amount Paid to Date</td><td style="text-align:right;color:#1a6b3a;">- $${fmt(amountPaid)}</td></tr>
  <tr><td>Original Remaining Balance</td><td style="text-align:right;">$${fmt(originalRemaining)}</td></tr>
  <tr style="background:#1a1a1a;"><td style="padding:7px 10px;color:#fff;font-weight:700;border:0.75px solid #333;">AMOUNT NOW DUE</td><td style="padding:7px 10px;color:#fff;font-weight:700;border:0.75px solid #333;text-align:right;">$${fmt(amountNowDue)}</td></tr>
</table>
<p style="font-size:8pt;color:#666;margin-top:4px;">* Amount Now Due = Original Remaining ($${fmt(originalRemaining)}) + This Change Order ($${fmt(co.totalCost)})</p>

<hr class="section-rule"/>
<h2 class="section-head">5. SCHEDULE IMPACT</h2>
${Number(co.estimatedDaysAdded) > 0
  ? `<p>This change order adds approximately <strong>${co.estimatedDaysAdded} calendar days</strong> to the project timeline.</p>`
  : `<p>This change order has no impact on the project timeline.</p>`}

<hr class="section-rule"/>
<h2 class="section-head">6. PAYMENT TERMS</h2>
<div class="alert-box">
  <strong>Amount Now Due: $${fmt(amountNowDue)}</strong> (Original Remaining of $${fmt(originalRemaining)} + This Change Order of $${fmt(co.totalCost)})<br/><br/>
  ${co.paymentScheduleNote ? co.paymentScheduleNote : `Full payment of $${fmt(co.totalCost)} for this change order is due ${co.paymentDue}.`}<br/><br/>
  Work on this change order will not begin until signed by both parties and payment terms are confirmed.
</div>

<hr class="section-rule"/>
<h2 class="section-head">7. AUTHORIZATION</h2>
<p>By signing below, both parties agree to the additional scope, cost, and terms described in this Change Order. This Change Order becomes part of the original Construction Agreement dated ${job.contract_date || "_____________"}.</p>
<div class="sig-wrap">
<table class="sig-table">
  <tr><td><strong>CONTRACTOR</strong></td><td><strong>CLIENT</strong></td></tr>
  <tr><td>${settings.company_name || ""}</td><td>${job.client_name || ""}</td></tr>
  <tr><td style="font-size:8.5pt;color:#555;">By: ${settings.owner_name || ""}</td><td></td></tr>
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
</div>
</body>
</html>`;
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ContractGenerator() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: settingsArr = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });
  const settings = settingsArr[0] || {};

  const { data: contracts = [], isLoading: contractsLoading } = useQuery({ queryKey: ["contracts"], queryFn: () => base44.entities.Contract.list() });
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list() });

  const [mode, setMode] = useState("contracts");
  const [generating, setGenerating] = useState(null);
  const [pdfUrls, setPdfUrls] = useState({});

  const [selectedJobId, setSelectedJobId] = useState("");
  const [coStep, setCoStep] = useState(1);
  const [coFields, setCoFields] = useState({
    dateIssued: new Date().toLocaleDateString("en-US"),
    reason: "Client Request",
    description: "",
    scopeItems: [""],
    laborCost: "",
    materialsCost: "",
    estimatedDaysAdded: 0,
    paymentDue: "Due upon signing",
    paymentScheduleNote: "",
  });
  const [coPdfUrl, setCoPdfUrl] = useState(null);
  const [coPdfFileName, setCoPdfFileName] = useState("");

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  async function generateContractPDF(contract) {
    setGenerating(contract.id);
    try {
      const paymentRows = buildPaymentRows(contract);
      const scopes = buildScopes(contract);
      const includes = buildIncludes(contract);
      const html = buildContractHTML(settings, contract, paymentRows, scopes, includes);
      const result = await base44.integrations.Core.HTMLToPDF({ html });
      const url = result?.file_url || result?.url;
      await base44.entities.Contract.update(contract.id, { pdf_url: url });
      qc.invalidateQueries({ queryKey: ["contracts"] });
      setPdfUrls(prev => ({ ...prev, [contract.id]: url }));
      toast({ title: "✓ Contract PDF ready!" });
    } catch (e) {
      toast({ title: "Error generating PDF", variant: "destructive" });
      console.error(e);
    }
    setGenerating(null);
  }

  async function generateChangeOrder() {
    if (!selectedJob) return;
    setGenerating("co");
    try {
      const coNum = `CO-${String((selectedJob.change_orders || []).length + 1).padStart(3, "0")}`;
      const coTotal = (Number(coFields.laborCost) || 0) + (Number(coFields.materialsCost) || 0);
      const coData = { ...coFields, changeOrderNumber: coNum, totalCost: coTotal };
      const html = buildChangeOrderHTML(settings, selectedJob, coData);
      const result = await base44.integrations.Core.HTMLToPDF({ html });
      const url = result?.file_url || result?.url;
      const clientLast = (selectedJob.client_name || "client").split(" ").pop();
      const today = new Date().toISOString().split("T")[0];
      setCoPdfUrl(url);
      setCoPdfFileName(`ChangeOrder_${coNum}_${clientLast}_${today}.pdf`);

      const coRecord = await base44.entities.ChangeOrder.create({
        job_id: selectedJob.id,
        change_order_number: coNum,
        date_issued: coData.dateIssued,
        reason: coData.reason,
        description: coData.description,
        scope_items: coData.scopeItems,
        labor_cost: Number(coData.laborCost) || 0,
        material_cost: Number(coData.materialsCost) || 0,
        total_estimated_cost: coTotal,
        estimated_days_added: Number(coData.estimatedDaysAdded) || 0,
        payment_due: coData.paymentDue,
        pdf_url: url,
      });
      await base44.entities.Job.update(selectedJob.id, {
        change_orders: [...(selectedJob.change_orders || []), coRecord.id],
      });

      setCoStep(3);
      toast({ title: "✓ Change Order ready!" });
    } catch (e) {
      toast({ title: "Error generating Change Order", variant: "destructive" });
      console.error(e);
    }
    setGenerating(null);
  }

  const coTotal = (Number(coFields.laborCost) || 0) + (Number(coFields.materialsCost) || 0);
  const updateCOScope = (i, val) => setCoFields(f => { const s = [...f.scopeItems]; s[i] = val; return { ...f, scopeItems: s }; });
  const removeCOScope = (i) => setCoFields(f => ({ ...f, scopeItems: f.scopeItems.filter((_, idx) => idx !== i) }));
  const addCOScope = () => setCoFields(f => ({ ...f, scopeItems: [...f.scopeItems, ""] }));

  return (
    <div>
      <PageHeader title="Contracts & Change Orders" description="Generate professional PDFs from your existing contracts, or create change orders for active jobs." />

      <div className="flex gap-3 mb-6">
        <Button type="button" variant={mode === "contracts" ? "default" : "outline"} onClick={() => setMode("contracts")} className="gap-2">
          <FileText className="w-4 h-4" /> Contracts
        </Button>
        <Button type="button" variant={mode === "changeorder" ? "default" : "outline"} onClick={() => { setMode("changeorder"); setCoStep(1); setCoPdfUrl(null); }} className="gap-2">
          <Plus className="w-4 h-4" /> Change Order
        </Button>
      </div>

      {/* ── CONTRACTS ── */}
      {mode === "contracts" && (
        <div className="space-y-4 max-w-3xl">
          {contractsLoading && <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
          {!contractsLoading && contracts.length === 0 && (
            <Card className="p-8 text-center">
              <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">No contracts yet</p>
              <p className="text-xs text-muted-foreground">Go to Bid Builder, complete a bid, then click "Create Contract" to get started.</p>
            </Card>
          )}
          {contracts.map(contract => {
            const clientName = `${contract.client_name || ""} ${contract.client_last_name || ""}`.trim();
            const isGenerating = generating === contract.id;
            const pdfUrl = pdfUrls[contract.id] || contract.pdf_url;
            return (
              <Card key={contract.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-sm">{clientName || "Unnamed Client"}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        contract.status === "signed" ? "bg-green-50 text-green-700 border-green-200" :
                        contract.status === "sent" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-muted text-muted-foreground border-border"
                      }`}>{contract.status || "draft"}</span>
                    </div>
                    {contract.project_description && (
                      <p className="text-xs text-muted-foreground mb-1 truncate">{contract.project_description.substring(0, 80)}...</p>
                    )}
                    <p className="text-sm font-semibold text-primary">${Number(contract.contract_amount || 0).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {pdfUrl && (
                      <a href={pdfUrl} target="_blank" rel="noreferrer">
                        <Button type="button" size="sm" className="gap-1.5 bg-green-700 hover:bg-green-800 w-full">
                          <Download className="w-3.5 h-3.5" /> Download PDF
                        </Button>
                      </a>
                    )}
                    <Button type="button" size="sm" variant={pdfUrl ? "outline" : "default"} disabled={isGenerating} onClick={() => generateContractPDF(contract)} className="gap-1.5">
                      {isGenerating
                        ? <><span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Generating...</>
                        : pdfUrl ? <><Eye className="w-3.5 h-3.5" /> Regenerate</> : <><FileText className="w-3.5 h-3.5" /> Generate PDF</>
                      }
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── CHANGE ORDER ── */}
      {mode === "changeorder" && (
        <div className="space-y-5 max-w-3xl">
          <Card className="p-6">
            <h3 className="text-sm font-semibold mb-3">Select Active Job</h3>
            <select value={selectedJobId} onChange={e => { setSelectedJobId(e.target.value); setCoStep(1); setCoPdfUrl(null); }}
              className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background">
              <option value="">— Select a job —</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.client_name} · {j.title} · ${Number(j.contract_amount || 0).toLocaleString()}</option>)}
            </select>
            {selectedJob && (
              <div className="mt-4 bg-muted/30 rounded-lg p-4 text-sm grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Client:</span> <strong>{selectedJob.client_name}</strong></div>
                <div><span className="text-muted-foreground">Contract:</span> <strong>${Number(selectedJob.contract_amount || 0).toLocaleString()}</strong></div>
                <div><span className="text-muted-foreground">Paid to Date:</span> <strong className="text-green-600">${Number(selectedJob.total_paid_by_customer || 0).toLocaleString()}</strong></div>
                <div><span className="text-muted-foreground">Remaining:</span> <strong className="text-amber-600">${(Number(selectedJob.contract_amount || 0) - Number(selectedJob.total_paid_by_customer || 0)).toLocaleString()}</strong></div>
                <div><span className="text-muted-foreground">Prior COs:</span> <strong>{(selectedJob.change_orders || []).length}</strong></div>
              </div>
            )}
          </Card>

          {selectedJob && coStep < 3 && (
            <Card className="p-6 space-y-5">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 border-b pb-1">Change Details</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><Label>Change Order #</Label><Input value={`CO-${String((selectedJob.change_orders || []).length + 1).padStart(3, "0")}`} readOnly className="bg-muted" /></div>
                  <div><Label>Date Issued</Label><Input value={coFields.dateIssued} onChange={e => setCoFields(f => ({ ...f, dateIssued: e.target.value }))} /></div>
                </div>
                <div className="mb-3">
                  <Label>Reason for Change</Label>
                  <select value={coFields.reason} onChange={e => setCoFields(f => ({ ...f, reason: e.target.value }))} className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background mt-1">
                    {["Client Request","Unforeseen Condition","Design Modification","Material Substitution","Code Requirement","Other"].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div><Label>Description of Change</Label>
                  <Textarea value={coFields.description} onChange={e => setCoFields(f => ({ ...f, description: e.target.value }))} className="min-h-[80px]" placeholder="Explain what is changing and why..." />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 border-b pb-1">Scope of Additional Work</p>
                {coFields.scopeItems.map((s, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <Input value={s} onChange={e => updateCOScope(i, e.target.value)} placeholder="Work item description..." className="flex-1" />
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeCOScope(i)} aria-label={s ? `Remove scope item: ${s}` : `Remove scope item ${i + 1}`}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                ))}
                <Button type="button" variant="ghost" size="sm" className="text-primary" onClick={addCOScope}><Plus className="w-4 h-4 mr-1" />Add Work Item</Button>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 border-b pb-1">Cost Breakdown</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><Label>Labor Cost ($)</Label><Input type="number" value={coFields.laborCost} onChange={e => setCoFields(f => ({ ...f, laborCost: e.target.value }))} /></div>
                  <div><Label>Materials Cost ($)</Label><Input type="number" value={coFields.materialsCost} onChange={e => setCoFields(f => ({ ...f, materialsCost: e.target.value }))} /></div>
                </div>
                <div className="bg-muted/40 rounded-lg p-4 text-sm space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Original Remaining Balance:</span><span className="text-amber-600">${(Number(selectedJob.contract_amount || 0) - Number(selectedJob.total_paid_by_customer || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">+ This Change Order:</span><span>${coTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between font-bold text-base border-t pt-2"><span>Amount Now Due:</span><span className="text-primary">${(Number(selectedJob.contract_amount || 0) - Number(selectedJob.total_paid_by_customer || 0) + coTotal).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><Label>Additional Days Added</Label><Input type="number" min="0" value={coFields.estimatedDaysAdded} onChange={e => setCoFields(f => ({ ...f, estimatedDaysAdded: e.target.value }))} /></div>
                <div><Label>Payment Due</Label><Input value={coFields.paymentDue} onChange={e => setCoFields(f => ({ ...f, paymentDue: e.target.value }))} placeholder="e.g. Due upon signing" /></div>
              </div>

              <div>
                <Label>Payment Schedule Note (optional)</Label>
                <Textarea value={coFields.paymentScheduleNote} onChange={e => setCoFields(f => ({ ...f, paymentScheduleNote: e.target.value }))} className="min-h-[52px]" placeholder="e.g. 50% due at signing, 50% upon completion — leave blank to use default" />
              </div>

              <Button type="button" className="w-full" disabled={generating === "co" || !coFields.description} onClick={generateChangeOrder}>
                {generating === "co"
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Generating Change Order...</>
                  : "Generate Change Order PDF"}
              </Button>
            </Card>
          )}

          {coStep === 3 && coPdfUrl && (
            <Card className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Change Order Ready!</h3>
              <p className="text-sm text-muted-foreground">{selectedJob?.client_name} · +${coTotal.toLocaleString()}</p>
              <a href={coPdfUrl} target="_blank" rel="noreferrer" className="block">
                <Button type="button" className="w-full gap-2 bg-green-700 hover:bg-green-800">
                  <Download className="w-4 h-4" /> Download {coPdfFileName}
                </Button>
              </a>
              <Button type="button" variant="outline" className="w-full" onClick={() => { setCoStep(1); setCoPdfUrl(null); setSelectedJobId(""); }}>Create Another Change Order</Button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}