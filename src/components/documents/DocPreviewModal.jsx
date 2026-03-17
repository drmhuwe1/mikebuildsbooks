import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { PRINT_CSS } from "@/lib/docStyles";
import { printDocument } from "@/lib/printDocument";

/**
 * Shows a live preview of the generated document HTML inside a modal.
 * Provides a Print / Export PDF button.
 */
export default function DocPreviewModal({ open, onClose, html, title }) {
  if (!html) return null;

  const handlePrint = () => {
    printDocument(html, title);
  };

  // Inject CSS into the iframe srcdoc
  const iframeDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    ${PRINT_CSS}
    body { background: #e5e7eb; padding: 24px; }
    .doc-page {
      margin: 0 auto 24px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.18);
      border-radius: 3px;
    }
  </style>
</head>
<body>${html}</body>
</html>`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="w-4 h-4" /> Print / Export PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <iframe
            srcDoc={iframeDoc}
            title={title}
            className="w-full h-full border-0"
            sandbox="allow-same-origin"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}