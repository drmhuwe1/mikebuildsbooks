import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Official IRS W-9 form URL
const IRS_W9_URL = 'https://www.irs.gov/pub/irs-pdf/fw9.pdf';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the official IRS W-9 PDF
    const response = await fetch(IRS_W9_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PDF fetcher)'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch IRS W-9: ${response.status}`);
    }

    const pdfBuffer = await response.arrayBuffer();

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="IRS_Form_W-9.pdf"'
      }
    });
  } catch (error) {
    console.error('Error fetching W-9 PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});