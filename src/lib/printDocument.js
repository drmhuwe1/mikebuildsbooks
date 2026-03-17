import { PRINT_CSS } from "./docStyles";

/**
 * Opens a new window with the document HTML and triggers print/save.
 * @param {string} html - Full inner HTML of the document (without <html>/<body> wrapper)
 * @param {string} title - Window title / filename hint
 */
export function printDocument(html, title = "Document") {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) { alert("Please allow popups to generate PDFs."); return; }

  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
${html}
<script>
  window.onload = function() {
    // Small delay to ensure fonts load
    setTimeout(() => { window.print(); }, 600);
  };
<\/script>
</body>
</html>`);
  win.document.close();
}