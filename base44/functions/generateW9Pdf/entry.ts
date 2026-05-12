import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subcontractors = [] } = await req.json();
    
    if (!subcontractors.length) {
      return Response.json({ error: 'No subcontractors provided' }, { status: 400 });
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    let isFirstPage = true;

    subcontractors.forEach((sub, idx) => {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;

      let yPos = margin;

      // Header
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Form W-9', margin, yPos);
      yPos += 8;

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Request for Taxpayer Identification Number and Certification', margin, yPos);
      yPos += 8;

      // Section 1: Name
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('1. Name (as shown on your income tax return)', margin, yPos);
      yPos += 5;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(sub.w9_full_name || sub.name || '', margin + 2, yPos);
      yPos += 8;

      // Section 2: Business name
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('2. Business name/sole proprietorship name, if different from above', margin, yPos);
      yPos += 5;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(sub.w9_business_name || sub.company || '', margin + 2, yPos);
      yPos += 8;

      // Section 3: Tax classification
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('3. Check the appropriate box for your filing status', margin, yPos);
      yPos += 5;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      const entityType = sub.entity_type || 'individual';
      const classifications = {
        'individual': '☒ Individual/sole proprietor or single-member LLC',
        'sole_proprietor': '☒ Individual/sole proprietor or single-member LLC',
        'llc': '☒ LLC classified as corporation',
        's_corp': '☒ S Corporation',
        'c_corp': '☒ C Corporation',
        'partnership': '☒ Partnership'
      };
      doc.text(classifications[entityType] || classifications.individual, margin + 2, yPos);
      yPos += 8;

      // Section 4: Address
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('4. Address (number, street, and apt. or suite no.)', margin, yPos);
      yPos += 5;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(sub.address || '', margin + 2, yPos);
      yPos += 8;

      // Section 5: Account numbers
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('5. List account numbers here (optional)', margin, yPos);
      yPos += 8;

      // Section 6: Tax ID
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('6. Enter your TIN in the appropriate box', margin, yPos);
      yPos += 6;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`SSN or EIN: ${sub.ssn_or_ein || '___-__-____'}`, margin + 2, yPos);
      yPos += 10;

      // Certification
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Certification', margin, yPos);
      yPos += 5;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      const certText = 'I certify that the number shown on this form is my correct taxpayer identification number, and I am not subject to backup withholding. I certify that I am a U.S. person and authorize this entity to file Form(s) 1099.';
      const certLines = doc.splitTextToSize(certText, pageWidth - 2 * margin - 2);
      doc.text(certLines, margin + 2, yPos);
      yPos += certLines.length * 3 + 5;

      // Signature & Date
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Contractor Signature: _________________     Date: _________________', margin, yPos);
    });

    const pdfData = doc.output('arraybuffer');

    return new Response(pdfData, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="W9_Forms_${new Date().toISOString().split('T')[0]}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating W-9 PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});