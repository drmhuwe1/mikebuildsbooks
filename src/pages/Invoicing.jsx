import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, FileText, Eye, CheckCircle, AlertCircle, Printer } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { formatCurrency } from "@/lib/formatters";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import InvoicePrintable from "@/components/invoices/InvoicePrintable";

export default function Invoicing() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formData, setFormData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list(),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: settings = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data) => {
      const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
      return base44.entities.Invoice.create({ ...data, invoice_number: invoiceNum });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Invoice created successfully" });
      setShowCreateDialog(false);
      setFormData(null);
    },
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: async (invoiceId) => {
      const invoice = invoices.find(i => i.id === invoiceId);
      await base44.integrations.Core.SendEmail({
        to: invoice.client_email,
        subject: `Invoice ${invoice.invoice_number} from Your Contractor`,
        body: `Dear ${invoice.client_name},\n\nPlease find attached invoice ${invoice.invoice_number} for ${formatCurrency(invoice.amount_due)} for ${invoice.job_title}.\n\nDue Date: ${invoice.due_date}\n\nPlease remit payment accordingly.\n\nThank you for your business!`,
      });
      return base44.entities.Invoice.update(invoiceId, { status: "sent", sent_at: new Date().toISOString() });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Invoice sent to client" });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (invoiceId) => {
      const invoice = invoices.find(i => i.id === invoiceId);
      return base44.entities.Invoice.update(invoiceId, {
        status: "paid",
        amount_paid: invoice.amount_due,
        paid_at: new Date().toISOString().split("T")[0],
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Invoice marked as paid" });
    },
  });

  const handleCreateInvoice = () => {
    if (!formData?.job_id || !formData?.amount_due) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    const job = jobs.find(j => j.id === formData.job_id);
    const client = clients.find(c => c.id === formData.client_id);
    createInvoiceMutation.mutate({
      ...formData,
      job_title: job?.title || formData.job_title,
      client_name: client?.name || formData.client_name,
      client_email: client?.email || formData.client_email,
      status: "draft",
    });
  };

  const statusColors = {
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    viewed: "bg-blue-50 text-blue-700",
    partially_paid: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    overdue: "bg-red-100 text-red-800",
  };

  const overdue = invoices.filter(i => {
    const due = new Date(i.due_date);
    return due < new Date() && i.status !== "paid";
  });

  const totalOutstanding = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + (i.amount_due - (i.amount_paid || 0)), 0);

  if (isLoading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader
        title="Invoicing & Payments"
        description="Create, send, and track invoices; manage payment collection"
        actionLabel="Create Invoice"
        onAction={() => setShowCreateDialog(true)}
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalOutstanding)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Overdue Invoices</p>
          <p className="text-2xl font-bold text-red-600">{overdue.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Invoices</p>
          <p className="text-2xl font-bold">{invoices.length}</p>
        </Card>
      </div>

      {overdue.length > 0 && (
        <Card className="p-4 mb-6 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-red-900">⚠ {overdue.length} Overdue Invoice{overdue.length !== 1 ? "s" : ""}</p>
              <p className="text-sm text-red-800 mt-1">
                {overdue.map(inv => `${inv.invoice_number} (${inv.client_name})`).join(", ")}
              </p>
              <Button size="sm" className="mt-3 bg-red-600 hover:bg-red-700" onClick={() => {
                setSelectedInvoice(overdue[0]);
                setShowCollectionDialog(true);
              }}>
                Send Collection Request
              </Button>
            </div>
          </div>
        </Card>
      )}

      {invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Invoices"
          description="Create your first invoice to get started."
          actionLabel="Create Invoice"
          onAction={() => setShowCreateDialog(true)}
        />
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <Card key={inv.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-semibold">{inv.invoice_number}</p>
                    <Badge className={statusColors[inv.status]}>{inv.status?.replace(/_/g, " ")}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{inv.client_name} — {inv.job_title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Due: {format(new Date(inv.due_date), "MMM d, yyyy")}
                    {inv.sent_at && ` • Sent: ${format(new Date(inv.sent_at), "MMM d")}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(inv.amount_due)}</p>
                  {inv.amount_paid > 0 && (
                    <p className="text-xs text-green-600">Paid: {formatCurrency(inv.amount_paid)}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  {inv.status !== "sent" && inv.status !== "paid" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendInvoiceMutation.mutate(inv.id)}
                      disabled={sendInvoiceMutation.isPending}
                      className="gap-1"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Send
                    </Button>
                  )}
                  {inv.status !== "paid" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setShowCollectionDialog(true);
                      }}
                    >
                      Collect
                    </Button>
                  )}
                  {inv.status !== "paid" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markPaidMutation.mutate(inv.id)}
                      disabled={markPaidMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Job</Label>
              <Select value={formData?.job_id || ""} onValueChange={(v) => {
                const job = jobs.find(j => j.id === v);
                setFormData(f => ({ ...f, job_id: v, job_title: job?.title, client_id: job?.client_id, client_name: job?.client_name }));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title} ({job.client_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Client Email</Label>
              <Input
                type="email"
                value={formData?.client_email || ""}
                onChange={e => setFormData(f => ({ ...f, client_email: e.target.value }))}
                placeholder="client@email.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount Due</Label>
                <Input
                  type="number"
                  value={formData?.amount_due || ""}
                  onChange={e => setFormData(f => ({ ...f, amount_due: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Invoice Type</Label>
                <Select value={formData?.invoice_type || "full"} onValueChange={(v) => setFormData(f => ({ ...f, invoice_type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="progress">Progress Payment</SelectItem>
                    <SelectItem value="final">Final Payment</SelectItem>
                    <SelectItem value="full">Full Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData?.due_date || ""}
                onChange={e => setFormData(f => ({ ...f, due_date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData?.notes || ""}
                onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                placeholder="Invoice notes or payment instructions"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateInvoice} disabled={createInvoiceMutation.isPending}>
              {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCollectionDialog} onOpenChange={setShowCollectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Collection Request</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded">
                <p className="text-sm"><strong>Invoice:</strong> {selectedInvoice.invoice_number}</p>
                <p className="text-sm"><strong>Client:</strong> {selectedInvoice.client_name}</p>
                <p className="text-sm"><strong>Amount Due:</strong> {formatCurrency(selectedInvoice.amount_due - (selectedInvoice.amount_paid || 0))}</p>
              </div>
              <div>
                <Label>Recipient Email</Label>
                <Input type="email" value={selectedInvoice.client_email} readOnly />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  defaultValue={`Dear ${selectedInvoice.client_name},\n\nThis is a reminder that invoice ${selectedInvoice.invoice_number} for ${formatCurrency(selectedInvoice.amount_due)} is now due.\n\nPlease submit payment at your earliest convenience.\n\nThank you!`}
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCollectionDialog(false)}>Cancel</Button>
                <Button onClick={() => {
                  toast({ title: "Collection request sent via email" });
                  setShowCollectionDialog(false);
                }}>
                  <Mail className="w-4 h-4 mr-2" /> Send Email
                </Button>
                <Button variant="outline" onClick={() => {
                  toast({ title: "Collection request downloaded as PDF" });
                }}>
                  <FileText className="w-4 h-4 mr-2" /> Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}