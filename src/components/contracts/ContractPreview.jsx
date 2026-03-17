import React from "react";
import { Button } from "@/components/ui/button";
import { Printer, Mail, Phone } from "lucide-react";
import { PRINT_CSS } from "@/lib/docStyles";

export default function ContractPreview({ html, contractTitle }) {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${contractTitle}</title>
          <style>${PRINT_CSS}</style>
        </head>
        <body>${html}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4">
      {/* Styled Document Preview */}
      <div className="bg-white border-l-4 border-primary p-8 rounded-lg shadow-lg overflow-auto max-h-96"
           style={{
             fontFamily: "'Times New Roman', Times, serif",
             fontSize: "12pt",
             lineHeight: "1.6",
             color: "#111"
           }}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
        <Button>
          <Mail className="w-4 h-4 mr-2" />
          Email
        </Button>
      </div>
    </div>
  );
}