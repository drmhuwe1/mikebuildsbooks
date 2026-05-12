import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    let yPos = margin;
    const contentWidth = pageWidth - 2 * margin;

    // IRS Header
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('OMB No. 1545-0074', pageWidth - margin - 30, yPos);
    yPos += 4;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Form W-9', margin, yPos);
    yPos += 7;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Request for Taxpayer Identification Number and Certification', margin, yPos);
    yPos += 6;

    doc.setFontSize(7);
    doc.setFont('Helvetica', 'normal');
    doc.text('(Rev. October 2023) Department of the Treasury Internal Revenue Service', margin, yPos);
    yPos += 12;

    // Instructions note
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Give this form to the requester. Do not send to the IRS.', margin, yPos);
    yPos += 8;

    // Section 1
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('1   Name (as shown on your income tax return)', margin, yPos);
    yPos += 6;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('___________________________________', margin + 2, yPos);
    yPos += 8;

    // Section 2
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('2   Business name/sole proprietorship name, if different from above', margin, yPos);
    yPos += 6;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('___________________________________', margin + 2, yPos);
    yPos += 8;

    // Section 3 - Entity type with checkboxes
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('3   Check the appropriate box for your filing status', margin, yPos);
    yPos += 6;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);

    let boxY = yPos;
    doc.text('☐ Individual/sole proprietor or single-member LLC', margin + 2, boxY);
    doc.text('☐ C Corporation', margin + 80, boxY);
    
    boxY += 5;
    doc.text('☐ S Corporation', margin + 2, boxY);
    doc.text('☐ Partnership', margin + 80, boxY);
    
    boxY += 5;
    doc.text('☐ Trust/estate', margin + 2, boxY);
    doc.text('☐ Limited liability company. Enter tax classification: _____', margin + 80, boxY);

    yPos += 18;

    // Section 4 - Address
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('4   Address (number, street, and apt. or suite no.)', margin, yPos);
    yPos += 6;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('___________________________________', margin + 2, yPos);
    yPos += 8;

    // City/State/ZIP
    doc.text('City, state, and ZIP code', margin, yPos);
    yPos += 5;
    doc.text('___________________________________', margin + 2, yPos);
    yPos += 8;

    // Section 5 - Account numbers
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('5   List account number(s) here (optional)', margin, yPos);
    yPos += 6;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('___________________________________', margin + 2, yPos);
    yPos += 10;

    // Section 6 - Tax ID
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('6   Enter your TIN in the appropriate box for the type of entity shown in line 3. Check the appropriate box in line 5.', margin, yPos);
    yPos += 8;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Social security number', margin + 2, yPos);
    yPos += 4;
    doc.text('___  -  ___  -  ____', margin + 5, yPos);
    yPos += 8;

    doc.text('Employer identification number', margin + 80, yPos - 4);
    doc.text('___  -  ___', margin + 82, yPos);
    yPos += 8;

    // Certification section
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Certification', margin, yPos);
    yPos += 6;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    const certLines = doc.splitTextToSize(
      'I certify that the number shown on this form is my correct taxpayer identification number (or I am waiting for a number to be issued to me), and I am not subject to backup withholding because: (a) I am exempt from U.S. tax withholding and reporting because I am a nonresident alien, individual, exempt payee, exempt foreign corporations, or other exempt recipient categorized in the instructions, or (b) I have not been notified by the IRS that I am subject to backup withholding as a result of a failure to report all interest or dividends, or (c) the IRS has notified me that I am no longer subject to backup withholding, and (d) I certify that I am a U.S. person (including a U.S. resident alien).',
      contentWidth - 4
    );
    doc.text(certLines, margin + 2, yPos);
    yPos += certLines.length * 3.5 + 4;

    // Signature line
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Signature of U.S. person ►', margin, yPos);
    doc.line(margin + 35, yPos - 1, pageWidth - margin - 40, yPos - 1);
    yPos += 5;

    // Date line
    doc.text('Date ►', margin, yPos);
    doc.line(margin + 15, yPos - 1, margin + 50, yPos - 1);

    doc.text('Printed name and title', margin + 80, yPos - 5);
    doc.line(margin + 80, yPos + 2, pageWidth - margin, yPos + 2);

    const pdfData = doc.output('arraybuffer');

    return new Response(pdfData, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Form_W9.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating W-9 PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});