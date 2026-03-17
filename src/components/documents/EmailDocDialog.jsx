import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Loader2, CheckCircle } from "lucide-react";

export default function EmailDocDialog({ open, onClose, html, docTitle, docType, job }) {
  const [to, setTo] = useState(job?.client_email || "");
  const [subject, setSubject] = useState(docTitle || "");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const qc = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke("sendDocumentEmail", {
        to, subject, message, htmlContent: html, docTitle,
        jobId: job?.id || "",
        jobTitle: job?.title || "",
        clientName: job?.client_name || "",
        docType: docType || "document",
      });
    },
    onSuccess: () => {
      setSent(true);
      qc.invalidateQueries({ queryKey: ["deliveries"] });
      setTimeout(() => { setSent(false); onClose(); }, 2000);
    },
  });

  const handleClose = () => { setSent(false); onClose(); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> Email Document
          </DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle className="w-10 h-10 text-green-500" />
            <p className="text-sm font-medium text-green-700">Email sent successfully!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg px-4 py-2.5 text-xs text-muted-foreground">
              Sending: <span className="font-medium text-foreground">{docTitle}</span>
            </div>
            <div>
              <Label>Recipient Email *</Label>
              <Input value={to} onChange={e => setTo(e.target.value)} placeholder="client@example.com" type="email" />
            </div>
            <div>
              <Label>Subject *</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div>
              <Label>Message (optional)</Label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                placeholder="Please find the attached document for your review..."
              />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={() => sendMutation.mutate()}
                disabled={!to || !subject || sendMutation.isPending}
                className="gap-2"
              >
                {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {sendMutation.isPending ? "Sending..." : "Send Email"}
              </Button>
            </div>
            {sendMutation.isError && (
              <p className="text-xs text-red-600">{sendMutation.error?.message || "Failed to send. Check SMTP settings."}</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}