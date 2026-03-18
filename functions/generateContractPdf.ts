import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { jsPDF } from 'npm:jspdf@4.0.0';
import html2canvas from 'npm:html2canvas@1.4.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { htmlContent } = await req.json();
    if (!htmlContent) {
      return Response.json({ error: 'Missing htmlContent' }, { status: 400 });
    }

    // Use JSDOM to render HTML to canvas, then convert to PDF
    const { JSDOM } = await import('npm:jsdom@25.0.0');
    const { window } = new JSDOM(htmlContent);
    const canvas = await html2canvas(window.document.body, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'letter',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 8.5;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 11;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 11;
    }

    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});