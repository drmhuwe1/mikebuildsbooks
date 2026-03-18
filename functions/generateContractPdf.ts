import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { jsPDF } from 'npm:jspdf@4.0.0';

const APP_LOGO_URL = "https://media.base44.com/images/public/69b9774720c1d890b1162f57/17e5112da_MikeBuildsBooksLogo.png";

const PAGE_HEIGHT = 272;
const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 190;
const MARGIN_TOP = 15;
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
  doc.text(sanitize(text), x, y);
  y += LINE_HEIGHT;
}

function addWrappedText(text, maxWidth = 165, fontSize = 10, isBold = false, indentX = MARGIN_LEFT) {
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', isBold ? 'bold' : 'normal');
  doc.setTextColor(0, 0, 0);
  const lines = doc.splitTextToSize(sanitize(text), maxWidth);
  lines.forEach(line => {
    checkPageBreak(LINE_HEIGHT);
    doc.text(line, indentX, y);
    y += LINE_HEIGHT;
  });
  doc.setFont('helvetica', 'normal');
}

function addSection(title) {
  checkPageBreak(LINE_HEIGHT + SECTION_GAP + 4);
  y += SECTION_GAP;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(title, MARGIN_LEFT, y);
  // Underline the title text to match HTML preview
  const titleWidth = doc.getTextWidth(title);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_LEFT, y + 1, MARGIN_LEFT + titleWidth, y + 1);
  doc.setLineWidth(0.2);
  y += LINE_HEIGHT + 2;
}

function addBulletText(text, maxWidth = 155) {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(sanitize(text), maxWidth);
  lines.forEach((line, i) => {
    checkPageBreak(LINE_HEIGHT);
    if (i === 0) {
      doc.text('-', MARGIN_LEFT, y);
      doc.text(line, MARGIN_LEFT + 5, y);
    } else {
      doc.text(line, MARGIN_LEFT + 5, y);
    }
    y += LINE_HEIGHT;
  });
}

function money(n) {
  return "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Strip non-ASCII / Unicode characters that jsPDF cannot render with helvetica
function sanitize(text) {
  if (!text) return '';
  return text
    .replace(/\u00d7/g, 'x')   // × multiplication sign
    .replace(/\u2019/g, "'")   // right single quote
    .replace(/\u2018/g, "'")   // left single quote
    .replace(/\u201c/g, '"')   // left double quote
    .replace(/\u201d/g, '"')   // right double quote
    .replace(/\u2013/g, '-')   // en dash
    .replace(/\u2014/g, '--')  // em dash
    .replace(/\u2022/g, '-')   // bullet
    .replace(/[^\x00-\x7F]/g, ''); // strip any remaining non-ASCII
}

async function fetchImageAsBase64(url) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.error(`Image fetch failed: ${url} status=${res.status}`);
      return null;
    }
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    // Use chunks to avoid call stack overflow on large images
    const chunkSize = 8192;
    let binary = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);
    const mime = res.headers.get('content-type') || 'image/png';
    const format = mime.includes('jpeg') || mime.includes('jpg') ? 'JPEG' : 'PNG';
    console.log(`Image fetched OK: ${url} mime=${mime} format=${format} bytes=${bytes.length}`);
    return { dataUrl: `data:${mime};base64,${base64}`, format };
  } catch (err) {
    console.error(`fetchImageAsBase64 error for ${url}:`, err.message);
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
    doc.line(MARGIN_LEFT, 279, MARGIN_RIGHT, 279);
    // App logo centered above slogan
    if (appLogoBase64) {
      try {
        // Center a 40x11 image; page width 210, so x = (210-40)/2 = 85
        doc.addImage(appLogoBase64.dataUrl, appLogoBase64.format, 85, 281, 40, 11);
      } catch (e) {
        // fallback: just show slogan
      }
    }
    // Slogan below logo
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120);
    doc.text('Strong Builds. Stronger Books.', 105, 295, { align: 'center' });
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

    // Company logo: use pre-fetched data URL from frontend (avoids auth issues with private URLs)
    // App logo: fetch from public CDN
    const companyLogoBase64 = co.company_logo_data_url
      ? { dataUrl: co.company_logo_data_url, format: co.company_logo_data_url.includes('jpeg') || co.company_logo_data_url.includes('jpg') ? 'JPEG' : 'PNG' }
      : null;
    const appLogoBase64 = await fetchImageAsBase64(APP_LOGO_URL);

    // ── HEADER ──
    let headerEndY = y;

    // Company logo (left) - always attempt, shift text right if logo present
    let logoRendered = false;
    if (companyLogoBase64) {
      try {
        doc.addImage(companyLogoBase64.dataUrl, companyLogoBase64.format, MARGIN_LEFT, y, 28, 18);
        logoRendered = true;
        console.log('Company logo rendered successfully');
      } catch (err) {
        console.error('Company logo addImage failed:', err.message);
        // Try as JPEG fallback
        try {
          doc.addImage(companyLogoBase64.dataUrl, 'JPEG', MARGIN_LEFT, y, 28, 18);
          logoRendered = true;
          console.log('Company logo rendered as JPEG fallback');
        } catch (err2) {
          console.error('Company logo JPEG fallback also failed:', err2.message);
        }
      }
    }

    // Company name & details (center-left)
    const nameX = logoRendered ? 52 : MARGIN_LEFT;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(sanitize(co.company_name || 'Thornburg Construction'), nameX, y + 7);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    let detailY = y + 13;
    if (co.company_address) { doc.text(sanitize(co.company_address), nameX, detailY); detailY += 5; }
    if (co.company_phone) { doc.text(sanitize(`Phone: ${co.company_phone}`), nameX, detailY); detailY += 5; }
    if (co.company_email) { doc.text(sanitize(`Email: ${co.company_email}`), nameX, detailY); }

    // Owner name (right)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Company Owner:', MARGIN_RIGHT, y + 7, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(sanitize(co.owner_name || 'Joshua Thornburg'), MARGIN_RIGHT, y + 13, { align: 'right' });

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
        // Everything is a bullet point in scope
        addBulletText(t.replace(/^[-•*]\s*/, ''));
      });
    } else {
      addWrappedText('As detailed in the attached bid document.');
    }

    // ── PAYMENT SCHEDULE ──
    addSection('2. PAYMENT SCHEDULE');
    addBulletText(`Deposit (Upon Acceptance): ${money(data.deposit_amount)}`);
    addBulletText(`${data.start_of_construction_label || 'Upon completion and passing of framing and footer inspection:'} ${money(data.start_of_construction_amount)}`);
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
    doc.text(sanitize(co.company_name || 'Thornburg Construction'), MARGIN_LEFT, y);
    doc.text(sanitize(`By: ${client || '________________________________'}`), 115, y);
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
        'Content-Disposition': 'inline; filename=construction-contract.pdf',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});