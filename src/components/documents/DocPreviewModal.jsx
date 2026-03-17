import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X, Mail, Download, Phone, Eye } from "lucide-react";
import { PRINT_CSS } from "@/lib/docStyles";
import { printDocument } from "@/lib/printDocument";
import EmailDocDialog from "./EmailDocDialog";
import FaxDocDialog from "./FaxDocDialog";

export default function DocPreviewModal({ open, onClose, html, title, docType, job }) {
  const [showEmail, setShowEmail] = useState(false);
  const [showFax, setShowFax] = useState(false);
  const qc = useQueryClient();

  if (!html) return null;

  const handlePrint = async () => {
    printDocument(html, title);
    // Log print delivery
    if (job?.id) {
      await base44.entities.DocumentDelivery.create({
        job_id: job.id,
        job_title: job.title || "",
        client_name: job.client_name || "",
        doc_type: docType || "document",
        doc_title: title,
        delivery_method: "print",
        status: "sent",
        sent_at: new Date().toISOString(),
      });
      qc.invalidateQueries({ queryKey: ["deliveries"] });
    }
  };

  const iframeDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    ${PRINT_CSS}
    body { background: #e5e7eb; padding: 24px; }
    .doc-page { margin: 0 auto 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.18); border-radius: 3px; }
  </style>
</head>
<body>${html}</body>
</html>`;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl w-full h-[92vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-5 py-3 border-b flex-row items-center justify-between space-y-0 shrink-0">
            <DialogTitle className="text-sm font-semibold truncate max-w-xs">{title}</DialogTitle>

            {/* Delivery Action Bar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground mr-1 hidden sm:block">Deliver:</span>

              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5" /> Print
              </Button>

              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => setShowEmail(true)}>
                <Mail className="w-3.5 h-3.5" /> Email
              </Button>

              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => setShowFax(true)}>
                <Phone className="w-3.5 h-3.5" /> Fax
              </Button>

              <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={handlePrint}>
                <Download className="w-3.5 h-3.5" /> Export PDF
              </Button>

              <Button variant="ghost" size="icon" className="h-8 w-8 ml-1" onClick={onClose}>
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

      <EmailDocDialog
        open={showEmail}
        onClose={() => setShowEmail(false)}
        html={html}
        docTitle={title}
        docType={docType}
        job={job}
      />

      <FaxDocDialog
        open={showFax}
        onClose={() => setShowFax(false)}
        html={html}
        docTitle={title}
        docType={docType}
        job={job}
      />
    </>
  );
}