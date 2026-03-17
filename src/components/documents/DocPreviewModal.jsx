import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, Download, X, Send, Loader2 } from "lucide-react";
import { downloadDocAsPdf } from "@/lib/downloadPdf";
import { useToast } from "@/components/ui/use-toast";
import { wrapDocWithBranding } from "./docBranding";

export default function DocPreviewModal({ open, onClose, html, title, docType, job }) {
  const { toast } = useToast();
  const [mode, setMode] = useState(null); // null | "email" | "fax"
  const [sending, setSending] = useState(false);

  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const [faxNumber, setFaxNumber] = useState("");
  const [faxNote, setFaxNote] = useState("");

  const handleOpen = (m) => {
    setMode(m);
    if (m === "email") {
      setEmailTo(job?.client_email || "");
      setEmailSubject(title || "Document");
      setEmailBody(`Hi ${job?.client_name || ""},\n\nPlease find the attached document: ${title || ""}.\n\nThank you.`);
    }
    if (m === "fax") {
      setFaxNote(`To: ${job?.client_name || "Recipient"}\nRe: ${title || "Document"}\n\nPlease see the attached document.`);
    }
  };

  const handleClose = () => {
    setMode(null);
    onClose();
  };

  const sendEmail = async () => {
    if (!emailTo) return;
    setSending(true);
    try {
      await base44.functions.invoke("sendDocumentEmail", {
        to: emailTo,
        subject: emailSubject,
        htmlContent: html,
        message: emailBody,
        docTitle: title,
        jobId: job?.id || "",
        jobTitle: job?.title || "",
        clientName: job?.client_name || "",
        docType: docType || "document",
      });
      toast({ title: "Email sent successfully" });
      handleClose();
    } catch (e) {
      toast({ title: "Failed to send email", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const sendFax = async () => {
    if (!faxNumber) return;
    setSending(true);
    try {
      await base44.functions.invoke("sendDocumentFax", {
        faxNumber,
        htmlContent: html,
        docTitle: title,
        senderNote: faxNote,
        jobId: job?.id || "",
        jobTitle: job?.title || "",
        clientName: job?.client_name || "",
        docType: docType || "document",
      });
      toast({ title: "Fax sent successfully" });
      handleClose();
    } catch (e) {
      toast({ title: "Failed to send fax", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleDownload = async () => {
    downloadDocAsPdf(html, docType, job, title);
    // Log the download
    try {
      await base44.asServiceRole?.entities?.DocumentDelivery?.create({
        job_id: job?.id || "",
        job_title: job?.title || "",
        client_name: job?.client_name || "",
        doc_type: docType || "document",
        doc_title: title || "",
        delivery_method: "download",
        recipient: "",
        status: "sent",
        sent_at: new Date().toISOString(),
        notes: "Downloaded as PDF",
      });
    } catch (_) {}
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base">{title || "Document Preview"}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleOpen("email")}>
                <Mail className="w-3.5 h-3.5" /> Email
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleOpen("fax")}>
                <Phone className="w-3.5 h-3.5" /> Fax
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={handleDownload}>
                <Download className="w-3.5 h-3.5" /> Download PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Email panel */}
        {mode === "email" && (
          <div className="px-6 py-4 border-b bg-blue-50 flex-shrink-0 space-y-3">
            <p className="text-sm font-medium text-blue-800">Send via Email</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">To</Label>
                <Input value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="recipient@email.com" className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Subject</Label>
                <Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="h-8 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Message</Label>
              <Textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={3} className="text-sm" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={sendEmail} disabled={sending || !emailTo} className="gap-1.5">
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {sending ? "Sending..." : "Send Email"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMode(null)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Fax panel */}
        {mode === "fax" && (
          <div className="px-6 py-4 border-b bg-purple-50 flex-shrink-0 space-y-3">
            <p className="text-sm font-medium text-purple-800">Send via Fax</p>
            <div>
              <Label className="text-xs">Fax Number</Label>
              <Input value={faxNumber} onChange={e => setFaxNumber(e.target.value)} placeholder="e.g. 5551234567" className="h-8 text-sm max-w-xs" />
            </div>
            <div>
              <Label className="text-xs">Cover Note</Label>
              <Textarea value={faxNote} onChange={e => setFaxNote(e.target.value)} rows={3} className="text-sm" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={sendFax} disabled={sending || !faxNumber} className="gap-1.5">
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {sending ? "Sending..." : "Send Fax"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMode(null)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Document iframe */}
        <div className="flex-1 overflow-hidden">
          <iframe
            srcDoc={`<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0">${html || ""}</body></html>`}
            className="w-full h-full min-h-[500px]"
            title="Document Preview"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}