import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { jsPDF } from 'npm:jspdf@4.0.0';

const APP_LOGO_URL = "https://media.base44.com/images/public/69b9774720c1d890b1162f57/17e5112da_MikeBuildsBooksLogo.png";

const PAGE_HEIGHT = 270;
const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 190;
const MARGIN_TOP = 20;
const LINE_HEIGHT = 6;
const SECTION_GAP = 8;

let y = MARGIN_TOP;
let doc = null;

function checkPageBreak(neededSpace = LINE_HEIGHT) {
  if (y + neededSpace > PAGE_HEIGHT) {
    doc.addPage();
    y = MARGIN_TOP;
  }
}

function addLine(text, fontSize = 10, isBold = false, x = MARGIN_LEFT) {
  checkPageBreak(LINE_HEIGHT);
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', isBold ? 'bold' : 'normal');
  doc.text(text, x, y);
  y += LINE_HEIGHT;
}

function addWrappedText(text, maxWidth = 165, fontSize = 10, isBold = false, indentX = MARGIN_LEFT) {
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', isBold ? 'bold' : 'normal');
  const lines = doc.splitTextToSize(text, maxWidth);
  lines.forEach(line => {
    checkPageBreak(LINE_HEIGHT);
    doc.text(line, indentX, y);
    y += LINE_HEIGHT;
  });
}

function addSection(title) {
  checkPageBreak(LINE_HEIGHT + SECTION_GAP + 4);
  y += SECTION_GAP / 2;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGIN_LEFT, y);
  y += LINE_HEIGHT - 1;
  doc.setDrawColor(180, 180, 180);
  doc.line(MARGIN_LEFT, y, MARGIN_RIGHT, y);
  y += 4;
}

function addBulletText(text, maxWidth = 160) {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(`• ${text}`, maxWidth);
  lines.forEach((line, i) => {
    checkPageBreak(LINE_HEIGHT);
    doc.text(line, i === 0 ? MARGIN_LEFT : MARGIN_LEFT + 4, y);
    y += LINE_HEIGHT;
  });
}

function money(n) {
  return "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function fetchImageAsBase64(url) {
  try {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    const base64 = btoa(binary);
    const mime = res.headers.get('content-type') || 'image/png';
    return `data:${mime};base64,${base64}`;
  } catch {
    return null;
  }
}

function addPageNumbers() {
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${totalPages}`, 105, 288, { align: 'center' });
    doc.setTextColor(0);
  }
}

async function addFooterLogo(appLogoBase64, totalPages) {
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.line(MARGIN_LEFT, 278, MARGIN_RIGHT, 278);
    // App logo
    if (appLogoBase64) {
      try {
        doc.addImage(appLogoBase64, 'PNG', 88, 280, 34, 10);
      } catch {}
    }
    // Slogan
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120);
    doc.text('Strong Builds. Stronger Books.', 105, 293, { align: 'center' });
    doc.setTextColor(0);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { contract, company } = await req.json();
    const co = company || {};
    const data = contract || {};

    doc = new jsPDF();
    y = MARGIN_TOP;

    const client = [data.client_name, data.client_last_name].filter(Boolean).join(" ");

    // Fetch logos
    const [companyLogoBase64, appLogoBase64] = await Promise.all([
      co.company_logo_url ? fetchImageAsBase64(co.company_logo_url) : Promise.resolve(null),
      fetchImageAsBase64(APP_LOGO_URL),
    ]);

    // ── HEADER ──
    let headerEndY = y;

    // Company logo (left)
    if (companyLogoBase64) {
      try {
        doc.addImage(companyLogoBase64, 'PNG', MARGIN_LEFT, y, 30, 20);
      } catch {}
    }

    // Company name & details (center-left)
    const nameX = companyLogoBase64 ? 55 : MARGIN_LEFT;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(co.company_name || 'Thornburg Construction', nameX, y + 7);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    let detailY = y + 13;
    if (co.company_address) { doc.text(co.company_address, nameX, detailY); detailY += 5; }
    if (co.company_phone) { doc.text(`Phone: ${co.company_phone}`, nameX, detailY); detailY += 5; }
    if (co.company_email) { doc.text(`Email: ${co.company_email}`, nameX, detailY); }

    // Owner name (right)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Company Owner:', MARGIN_RIGHT, y + 7, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(co.owner_name || 'Joshua Thornburg', MARGIN_RIGHT, y + 13, { align: 'right' });

    y += 26;
    // Header divider
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(MARGIN_LEFT, y, MARGIN_RIGHT, y);
    doc.setLineWidth(0.2);
    y += 8;

    // ── TITLE ──
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CONSTRUCTION CONTRACT AGREEMENT', 105, y, { align: 'center' });
    y += 10;

    // ── KEY INFO ──
    doc.setFontSize(10);
    // Row 1
    doc.setFont('helvetica', 'bold');
    doc.text('Client/Owner:', MARGIN_LEFT, y);
    doc.setFont('helvetica', 'normal');
    doc.text(client || '________________________________', MARGIN_LEFT + 30, y);
    doc.setFont('helvetica', 'bold');
    doc.text('Contract Amount:', 120, y);
    doc.setFont('helvetica', 'normal');
    doc.text(money(data.contract_amount), 150, y);
    // underline
    doc.setDrawColor(0);
    doc.line(MARGIN_LEFT + 30, y + 1, 115, y + 1);
    doc.line(150, y + 1, MARGIN_RIGHT, y + 1);
    y += 8;

    // Row 2
    doc.setFont('helvetica', 'bold');
    doc.text('Start Date:', MARGIN_LEFT, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.start_date || '________________________________', MARGIN_LEFT + 30, y);
    doc.setFont('helvetica', 'bold');
    doc.text('Est. Completion:', 120, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.estimated_completion || '________________________________', 150, y);
    doc.line(MARGIN_LEFT + 30, y + 1, 115, y + 1);
    doc.line(150, y + 1, MARGIN_RIGHT, y + 1);
    y += 12;

    // ── SCOPE OF WORK ──
    addSection('1. SCOPE OF WORK');
    if (data.scope_summary) {
      const lines = data.scope_summary.split('\n').filter(l => l.trim());
      lines.forEach(line => {
        const t = line.trim();
        if (t.match(/^[-•*]/)) {
          addBulletText(t.replace(/^[-•*]\s*/, ''));
        } else {
          addWrappedText(t);
        }
      });
    } else {
      addWrappedText('As detailed in the attached bid document.');
    }

    // ── PAYMENT SCHEDULE ──
    addSection('2. PAYMENT SCHEDULE');
    addBulletText(`Deposit (Upon Acceptance): ${money(data.deposit_amount)}`);
    addBulletText(`Start of Construction: ${money(data.start_of_construction_amount)}`);
    addBulletText(`Final Payment (Upon Completion): ${money(data.final_payment_amount)}`);

    // ── UNFORESEEN CIRCUMSTANCES ──
    addSection('3. UNFORESEEN CIRCUMSTANCES');
    addWrappedText('Any unforeseen conditions or changes discovered during the work that were not originally apparent or specified in this Contract may require additional time and/or cost. The Contractor will notify the Owner/Client of such conditions and provide a written estimate for any additional work required. Work shall not proceed on unforeseen items until written approval and authorization is received from the Owner/Client.');

    // ── CHANGE ORDERS ──
    addSection('4. CHANGE ORDERS');
    if (data.change_order_terms) {
      addWrappedText(data.change_order_terms);
    } else {
      addWrappedText('Any changes to the scope of work must be approved in writing and may affect project cost and timeline.');
    }

    // ── NOTES / TERMS ──
    if (data.notes) {
      addSection('5. TERMS & CONDITIONS');
      addWrappedText(data.notes);
    }

    // ── LEGAL TERMS ──
    const legalNum = data.notes ? '6' : '5';
    addSection(`${legalNum}. LEGAL TERMS`);
    addWrappedText('This Contract constitutes the entire agreement between the parties. All work shall be performed in a professional manner in compliance with all applicable federal, state, and local laws and building codes. The Contractor warrants that all materials will be of good quality and all work will be completed in a workmanlike manner.');
    y += 3;
    addWrappedText('Any modifications to this Contract must be made in writing and signed by both parties. The Contractor is responsible for obtaining all necessary permits unless otherwise specified.');

    // ── SIGNATURES ──
    checkPageBreak(60);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRACTOR:', MARGIN_LEFT, y);
    doc.text('OWNER/CLIENT:', 115, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.text(co.company_name || 'Thornburg Construction', MARGIN_LEFT, y);
    doc.text(`By: ${client || '________________________________'}`, 115, y);
    y += 5;
    doc.text(`By: ${co.owner_name || 'Joshua Thornburg'}`, MARGIN_LEFT, y);
    y += 14;

    // Sig lines
    doc.line(MARGIN_LEFT, y, 105, y);
    doc.line(115, y, MARGIN_RIGHT, y);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Signature', 62, y + 4, { align: 'center' });
    doc.text('Signature', 152, y + 4, { align: 'center' });
    y += 16;

    doc.line(MARGIN_LEFT, y, 105, y);
    doc.line(115, y, MARGIN_RIGHT, y);
    doc.text('Date', 62, y + 4, { align: 'center' });
    doc.text('Date', 152, y + 4, { align: 'center' });
    y += 12;

    // Binding statement
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('This contract is legally binding when signed by both parties.', 105, y, { align: 'center' });

    // ── PAGE NUMBERS & FOOTER LOGO ──
    const totalPages = doc.internal.getNumberOfPages();
    addPageNumbers();
    await addFooterLogo(appLogoBase64, totalPages);

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=construction-contract.pdf',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});