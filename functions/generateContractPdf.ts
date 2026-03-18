import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { htmlContent } = await req.json();
    if (!htmlContent) {
      return Response.json({ error: 'Missing htmlContent' }, { status: 400 });
    }

    // Call external PDF generation API
    const pdfResponse = await fetch('https://api.htmltopdf.cloud/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: htmlContent,
        options: {
          pageSize: 'letter',
          margin: { top: 1, bottom: 1, left: 1, right: 1 },
        },
      }),
    });

    if (!pdfResponse.ok) {
      return Response.json({ error: 'PDF conversion failed' }, { status: 500 });
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

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