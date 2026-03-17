import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Printer, Loader2, CheckCircle } from "lucide-react";

export default function FaxDocDialog({ open, onClose, html, docTitle, docType, job }) {
  const [faxNumber, setFaxNumber] = useState("");
  const [senderNote, setSenderNote] = useState("");
  const [sent, setSent] = useState(false);
  const qc = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke("sendDocumentFax", {
        faxNumber, senderNote, htmlContent: html, docTitle,
        jobId: job?.id || "",
        jobTitle: job?.title || "",
        clientName: job?.client_name || "",
        docType: docType || "document",
      });
    },
    onSuccess: () => {
      setSent(true);
      qc.invalidateQueries({ queryKey: ["deliveries"] });
      setTimeout(() => { setSent(false); onClose(); }, 2500);
    },
  });

  const handleClose = () => { setSent(false); onClose(); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-primary" /> Send via Fax
          </DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle className="w-10 h-10 text-green-500" />
            <p className="text-sm font-medium text-green-700">Fax submitted successfully!</p>
            <p className="text-xs text-muted-foreground text-center">Delivery confirmation will appear in the job's delivery history.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg px-4 py-2.5 text-xs text-muted-foreground">
              Faxing: <span className="font-medium text-foreground">{docTitle}</span>
            </div>
            <div>
              <Label>Recipient Fax Number *</Label>
              <Input
                value={faxNumber}
                onChange={e => setFaxNumber(e.target.value)}
                placeholder="e.g. 18005551234 or (800) 555-1234"
              />
              <p className="text-xs text-muted-foreground mt-1">10-digit US number. Country code optional.</p>
            </div>
            <div>
              <Label>Cover Note (optional)</Label>
              <Textarea
                value={senderNote}
                onChange={e => setSenderNote(e.target.value)}
                rows={3}
                placeholder="Please review the attached document..."
              />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={() => sendMutation.mutate()}
                disabled={!faxNumber || sendMutation.isPending}
                className="gap-2"
              >
                {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                {sendMutation.isPending ? "Sending Fax..." : "Send Fax"}
              </Button>
            </div>
            {sendMutation.isError && (
              <p className="text-xs text-red-600">{sendMutation.error?.message || "Failed to send fax. Check FAXAGE credentials."}</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}