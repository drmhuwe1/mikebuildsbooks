import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import puppeteer from 'npm:puppeteer@23.3.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { htmlContent, companyLogoDataUrl, appLogoDataUrl } = await req.json();

    if (!htmlContent) {
      return Response.json({ error: 'Missing htmlContent' }, { status: 400 });
    }

    // Replace image URLs with data URLs if available
    let finalHtml = htmlContent;
    if (companyLogoDataUrl) {
      finalHtml = finalHtml.replace(/src="[^"]*company_logo[^"]*"/i, `src="${companyLogoDataUrl}"`);
    }
    if (appLogoDataUrl) {
      finalHtml = finalHtml.replace(new RegExp(`src="${new URL(htmlContent).origin}[^"]*MikeBuildsBooksLogo[^"]*"`, 'i'), `src="${appLogoDataUrl}"`);
    }

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'letter',
      margin: { top: '1in', bottom: '1in', left: '1in', right: '1in' },
      printBackground: true,
      displayHeaderFooter: false,
    });

    await page.close();
    await browser.close();

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