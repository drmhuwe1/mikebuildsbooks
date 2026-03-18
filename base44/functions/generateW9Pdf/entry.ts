import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import jsPDF from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contractor, w9Data, signatureImageData } = await req.json();

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    let yPos = margin;

    // IRS W-9 Header
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Form W-9', margin, yPos);
    yPos += 8;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Request for Taxpayer Identification Number and Certification', margin, yPos);
    yPos += 6;

    doc.setFontSize(8);
    doc.text('(Rev. December 2023)', margin, yPos);
    yPos += 12;

    // Contractor Info
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('1. Name (as shown on your income tax return)', margin, yPos);
    yPos += 5;
    doc.setFont('Helvetica', 'normal');
    doc.text(w9Data.w9_full_name || '', margin + 2, yPos);
    yPos += 6;

    doc.setFont('Helvetica', 'bold');
    doc.text('2. Business name/sole proprietorship name, if different from above', margin, yPos);
    yPos += 5;
    doc.setFont('Helvetica', 'normal');
    doc.text(w9Data.w9_business_name || '', margin + 2, yPos);
    yPos += 6;

    doc.setFont('Helvetica', 'bold');
    doc.text('3. Check the appropriate box for your filing status', margin, yPos);
    yPos += 5;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    
    const taxClassifications = {
      individual: 'Individual/sole proprietor or single-member LLC',
      llc: 'LLC classified as corporation',
      s_corp: 'S Corporation',
      c_corp: 'C Corporation',
      partnership: 'Partnership'
    };
    
    doc.text(`☒ ${taxClassifications[w9Data.w9_federal_classification] || 'Individual/sole proprietor'}`, margin + 2, yPos);
    yPos += 8;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('4. Address (number, street, and apt. or suite no.)', margin, yPos);
    yPos += 5;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(w9Data.address || '', margin + 2, yPos);
    yPos += 4;
    doc.text(`${w9Data.city}, ${w9Data.state} ${w9Data.zip}`, margin + 2, yPos);
    yPos += 8;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('5. List account numbers here (optional)', margin, yPos);
    yPos += 8;

    // Tax ID Section
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('6. Enter your TIN in the appropriate box', margin, yPos);
    yPos += 6;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`SSN or EIN: ${w9Data.ssn_or_ein || '___-__-____'}`, margin + 2, yPos);
    yPos += 10;

    // Certification
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Certification', margin, yPos);
    yPos += 5;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    const certText = 'I certify that the number shown on this form is my correct taxpayer identification number, and I am not subject to backup withholding. I certify that I am a U.S. person (including a U.S. resident alien), and I authorize this entity to file and/or send Form(s) 1099 reporting payments made to me to the IRS.';
    const certLines = doc.splitTextToSize(certText, pageWidth - 2 * margin - 2);
    doc.text(certLines, margin + 2, yPos);
    yPos += certLines.length * 3.5 + 5;

    // Signature
    if (signatureImageData) {
      try {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Your signature:', margin, yPos);
        yPos += 8;
        
        // Add signature image
        doc.addImage(signatureImageData, 'PNG', margin + 2, yPos, 40, 15);
        yPos += 18;
      } catch (sigError) {
        console.error('Error adding signature:', sigError);
      }
    }

    // Date
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Date:', margin, yPos);
    yPos += 5;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    doc.text(today, margin + 2, yPos);

    // Generate PDF
    const pdfData = doc.output('arraybuffer');

    return new Response(pdfData, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="W9-${w9Data.w9_full_name || 'Contractor'}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating W-9 PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});