import React, { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { Printer, Download } from "lucide-react";

export default function InvoicePrintable({ invoice, job, company, onClose }) {
  const printRef = useRef();

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(printRef.current.innerHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    const element = printRef.current;
    const opt = {
      margin: 10,
      filename: `${invoice.invoice_number}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
    };
    // Note: requires html2pdf library, simplified for now
    handlePrint();
  };

  const amountDue = invoice.amount_due - (invoice.amount_paid || 0);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice {invoice.invoice_number}</DialogTitle>
        </DialogHeader>

        <div
          ref={printRef}
          className="bg-white p-10 text-black print:p-0"
          style={{ fontFamily: "Arial, sans-serif" }}
        >
          {/* Header */}
          <div className="flex justify-between mb-8 border-b pb-4">
            <div>
              {company.company_logo_url ? (
                <img src={company.company_logo_url} alt="Logo" className="h-12 mb-2" />
              ) : (
                <h1 className="text-2xl font-bold">{company.company_name || "Company Name"}</h1>
              )}
              <p className="text-sm text-gray-600">{company.company_address}</p>
              <p className="text-sm text-gray-600">{company.company_phone}</p>
              <p className="text-sm text-gray-600">{company.company_email}</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">INVOICE</h2>
              <p className="text-lg font-semibold">{invoice.invoice_number}</p>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-gray-800 mb-2">BILL TO:</h3>
              <p className="font-semibold">{invoice.client_name}</p>
              {job && <p className="text-sm text-gray-600">{job.address}</p>}
              <p className="text-sm text-gray-600">{invoice.client_email}</p>
            </div>
            <div className="text-right">
              <p className="mb-1">
                <span className="font-semibold">Invoice Date:</span>{" "}
                {format(new Date(invoice.created_date || new Date()), "MMM dd, yyyy")}
              </p>
              <p className="mb-1">
                <span className="font-semibold">Due Date:</span>{" "}
                {format(new Date(invoice.due_date), "MMM dd, yyyy")}
              </p>
              {invoice.invoice_type && (
                <p className="mb-1">
                  <span className="font-semibold">Type:</span> {invoice.invoice_type?.replace(/_/g, " ")}
                </p>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200 border-b-2 border-gray-400">
                  <th className="text-left p-3 font-bold">Description</th>
                  <th className="text-right p-3 font-bold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="p-3">{job?.title || invoice.job_title}</td>
                  <td className="text-right p-3 font-semibold">
                    {formatCurrency(invoice.amount_due)}
                  </td>
                </tr>
                {invoice.notes && (
                  <tr className="border-b border-gray-300">
                    <td colSpan="2" className="p-3 text-sm text-gray-600 italic">
                      Notes: {invoice.notes}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between mb-2 pb-2 border-b-2 border-gray-400">
                <span className="font-semibold">Subtotal:</span>
                <span>{formatCurrency(invoice.amount_due)}</span>
              </div>
              {invoice.amount_paid > 0 && (
                <div className="flex justify-between mb-2 pb-2 text-green-700">
                  <span className="font-semibold">Already Paid:</span>
                  <span>-{formatCurrency(invoice.amount_paid)}</span>
                </div>
              )}
              <div className={`flex justify-between text-lg font-bold p-3 rounded ${amountDue > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <span>Amount Due:</span>
                <span>{formatCurrency(amountDue)}</span>
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          {invoice.notes && (
            <div className="mb-8 pt-4 border-t">
              <h4 className="font-bold text-gray-800 mb-2">Payment Instructions:</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Company Footer */}
          <div className="mt-12 pt-4 border-t text-center text-xs text-gray-600">
            <p>
              {company.company_name || "Company Name"} • {company.company_phone || "Phone"} •{" "}
              {company.company_email || "Email"}
            </p>
            <p className="mt-2">Thank you for your business!</p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleDownload} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}