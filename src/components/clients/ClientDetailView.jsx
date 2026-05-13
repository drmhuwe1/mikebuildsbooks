import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Mail, Phone, MapPin, DollarSign, FileText, Send, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/formatters";

export default function ClientDetailView({ client, onClose }) {
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(client);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ 
    description: "", amount_due: 0, invoice_type: "full", due_date: "" 
  });
  const [newPayment, setNewPayment] = useState({ job_id: "", amount: 0, date: "" });

  // Fetch related data
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices", client.id],
    queryFn: () => base44.entities.Invoice.filter({ client_id: client.id }),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs", client.id],
    queryFn: () => base44.entities.Job.filter({ client_id: client.id }),
  });

  const { data: bids = [] } = useQuery({
    queryKey: ["bids", client.id],
    queryFn: () => base44.entities.Bid.filter({ client_id: client.id }),
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts", client.id],
    queryFn: () => base44.entities.Contract.filter({ client_id: client.id }),
  });

  const updateClientMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(client.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); setEditOpen(false); },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create({
      ...data,
      client_id: client.id,
      client_name: client.name,
      client_email: client.email || "",
      invoice_number: `INV-${Date.now()}`,
      invoice_date: new Date().toISOString().split('T')[0],
    }),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["invoices", client.id] });
      setInvoiceDialogOpen(false);
      setNewInvoice({ description: "", amount_due: 0, invoice_type: "full", due_date: "" });
    },
  });



  // Calculate payment metrics from invoices + contracts + jobs
  const metrics = useMemo(() => {
    // From invoices
    const invoicedAmount = invoices.reduce((sum, inv) => sum + (inv.amount_due || 0), 0);
    const invoicePaid = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);

    // Use contracts as source of truth; fall back to jobs only if no contract exists for that job
    const jobIdsWithContracts = new Set(contracts.map(c => c.job_id).filter(Boolean));
    const contractAmount = contracts.reduce((sum, c) => sum + (c.contract_amount || 0), 0);
    const contractPaid = contracts.reduce((sum, c) => sum + (c.client_paid_amount || 0), 0);

    // Only count jobs that have no associated contract record
    const unlinkedJobs = jobs.filter(j => !jobIdsWithContracts.has(j.id) && !j.contract_id);
    const jobAmount = unlinkedJobs.reduce((sum, j) => sum + (j.contract_amount || 0), 0);
    const jobPaid = unlinkedJobs.reduce((sum, j) => sum + ((j.total_paid_by_customer || j.deposits_received) || 0), 0);

    const totalInvoiced = invoicedAmount + contractAmount + jobAmount;
    const totalPaid = invoicePaid + contractPaid + jobPaid;
    const balanceDue = totalInvoiced - totalPaid;
    const overdue = invoices.filter(inv => inv.status === "overdue").length;
    const unpaidInvoices = invoices.filter(inv => !['paid', 'cancelled'].includes(inv.status)).length;
    const unpaidContracts = contracts.filter(c => (c.contract_amount || 0) > (c.client_paid_amount || 0) && c.status !== 'cancelled').length;
    const unpaidUnlinkedJobs = unlinkedJobs.filter(j => (j.contract_amount || 0) > ((j.total_paid_by_customer || j.deposits_received) || 0)).length;
    const unpaid = unpaidInvoices + unpaidContracts + unpaidUnlinkedJobs;

    return { totalInvoiced, totalPaid, balanceDue, overdue, unpaid };
  }, [invoices, contracts, jobs]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end overflow-auto">
      <div className="w-full max-w-2xl bg-white h-full shadow-lg flex flex-col">
        {/* Header */}
        <div className="border-b p-6 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-bold">{client.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={`text-xs ${getStatusColor(client.status)}`}>{client.status}</Badge>
              {metrics.overdue > 0 && <Badge variant="destructive" className="text-xs">⚠ {metrics.overdue} Overdue</Badge>}
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close client details">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto">
          {/* Contact Info Card */}
          <div className="p-6 border-b">
            <div className="grid grid-cols-2 gap-4">
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${client.email}`} className="text-sm text-blue-600 hover:underline">{client.email}</a>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${client.phone}`} className="text-sm text-blue-600 hover:underline">{client.phone}</a>
                </div>
              )}
              {client.address && (
                <div className="col-span-2 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-sm">{client.address}</span>
                </div>
              )}
            </div>
            {client.notes && (
              <p className="text-sm text-muted-foreground mt-4 p-3 bg-muted rounded">{client.notes}</p>
            )}
            <div className="flex gap-2 mt-4">
              <Button type="button" size="sm" variant="outline" onClick={() => { setEditForm(client); setEditOpen(true); }}>
                Edit Contact
              </Button>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Payment Summary</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Card className="p-3 bg-blue-50 border-blue-200">
                <p className="text-xs text-muted-foreground">Total Due</p>
                <p className="text-lg font-bold text-blue-900">{formatCurrency(metrics.totalInvoiced)}</p>
              </Card>
              <Card className="p-3 bg-green-50 border-green-200">
                <p className="text-xs text-muted-foreground">Total Paid</p>
                <p className="text-lg font-bold text-green-900">{formatCurrency(metrics.totalPaid)}</p>
              </Card>
              <Card className="p-3 bg-orange-50 border-orange-200">
                <p className="text-xs text-muted-foreground">Balance Due</p>
                <p className="text-lg font-bold text-orange-900">{formatCurrency(metrics.balanceDue)}</p>
              </Card>
              <Card className="p-3 bg-red-50 border-red-200">
                <p className="text-xs text-muted-foreground">Unpaid Items</p>
                <p className="text-lg font-bold text-red-900">{metrics.unpaid}</p>
              </Card>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="invoices" className="flex-1">
            <div className="border-b px-6 pt-4">
              <TabsList>
                <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
                <TabsTrigger value="jobs">Jobs ({jobs.length})</TabsTrigger>
                <TabsTrigger value="contracts">Contracts ({contracts.length})</TabsTrigger>
                <TabsTrigger value="bids">Bids ({bids.length})</TabsTrigger>
              </TabsList>
            </div>

            {/* Invoices Tab */}
            <TabsContent value="invoices" className="p-6 space-y-3">
              <Button type="button" onClick={() => setInvoiceDialogOpen(true)} size="sm">
                <FileText className="w-4 h-4 mr-1" /> Create Invoice
              </Button>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices yet.</p>
              ) : (
                <div className="space-y-2">
                  {invoices.map((inv) => (
                    <Card key={inv.id} className="p-3 flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{inv.invoice_number}</p>
                          <Badge variant="outline" className="text-xs">{inv.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{inv.description || "Invoice"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {formatDate(inv.due_date)} · {formatCurrency(inv.amount_due)} due, {formatCurrency(inv.amount_paid || 0)} paid
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{formatCurrency(inv.amount_due - (inv.amount_paid || 0))}</p>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Jobs Tab */}
            <TabsContent value="jobs" className="p-6">
              {jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No jobs for this client.</p>
              ) : (
                <div className="space-y-2">
                  {jobs.map((job) => (
                    <Card key={job.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{job.title}</p>
                          <p className="text-xs text-muted-foreground">{job.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatCurrency(job.contract_amount || 0)}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Contracts Tab */}
            <TabsContent value="contracts" className="p-6">
              {contracts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No contracts for this client.</p>
              ) : (
                <div className="space-y-2">
                  {contracts.map((contract) => (
                    <Card key={contract.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{contract.title}</p>
                          <p className="text-xs text-muted-foreground">{contract.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatCurrency(contract.contract_amount || 0)}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Bids Tab */}
            <TabsContent value="bids" className="p-6">
              {bids.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bids for this client.</p>
              ) : (
                <div className="space-y-2">
                  {bids.map((bid) => (
                    <Card key={bid.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{bid.title}</p>
                          <p className="text-xs text-muted-foreground">{bid.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatCurrency(bid.bid_amount || 0)}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Client Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Client</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Name</label><Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Email</label><Input value={editForm.email || ""} onChange={e => setEditForm({...editForm, email: e.target.value})} /></div>
              <div><label className="text-sm font-medium">Phone</label><Input value={editForm.phone || ""} onChange={e => setEditForm({...editForm, phone: e.target.value})} /></div>
            </div>
            <div><label className="text-sm font-medium">Address</label><Input value={editForm.address || ""} onChange={e => setEditForm({...editForm, address: e.target.value})} /></div>
            <div><label className="text-sm font-medium">Status</label>
              <Select value={editForm.status} onValueChange={v => setEditForm({...editForm, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">Notes</label><Textarea value={editForm.notes || ""} onChange={e => setEditForm({...editForm, notes: e.target.value})} rows={2} /></div>
            <Button type="button" className="w-full" onClick={() => updateClientMutation.mutate(editForm)} disabled={updateClientMutation.isPending}>
              {updateClientMutation.isPending ? "Saving..." : "Update Client"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><label className="text-sm font-medium">Description</label><Textarea value={newInvoice.description} onChange={e => setNewInvoice({...newInvoice, description: e.target.value})} rows={2} placeholder="e.g., Progress Payment, Final Payment" /></div>
            <div><label className="text-sm font-medium">Amount Due ($)</label><Input type="number" value={newInvoice.amount_due} onChange={e => setNewInvoice({...newInvoice, amount_due: parseFloat(e.target.value) || 0})} /></div>
            <div><label className="text-sm font-medium">Invoice Type</label>
              <Select value={newInvoice.invoice_type} onValueChange={v => setNewInvoice({...newInvoice, invoice_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="progress">Progress Payment</SelectItem>
                  <SelectItem value="final">Final Payment</SelectItem>
                  <SelectItem value="full">Full Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">Due Date</label><Input type="date" value={newInvoice.due_date} onChange={e => setNewInvoice({...newInvoice, due_date: e.target.value})} /></div>
            <Button type="button" className="w-full" onClick={() => createInvoiceMutation.mutate(newInvoice)} disabled={!newInvoice.amount_due || !newInvoice.due_date || createInvoiceMutation.isPending}>
              {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}