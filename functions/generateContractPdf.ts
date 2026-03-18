import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { jsPDF } from 'npm:jspdf@4.0.0';
import 'npm:html2pdf.js@0.10.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { htmlContent } = await req.json();
    if (!htmlContent) {
      return Response.json({ error: 'Missing htmlContent' }, { status: 400 });
    }

    // Create a simple PDF from HTML using jsPDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'letter',
      margin: [1, 1, 1, 1],
    });

    // Simple approach: convert HTML to text content and render
    // For better results, the frontend should handle PDF generation
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 1;
    const maxWidth = pageWidth - 2 * margin;

    pdf.fromHTML(htmlContent, margin, margin, {
      width: maxWidth,
      elementHandlers: {
        div: function(element, renderer) {
          return true;
        },
      },
    });

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