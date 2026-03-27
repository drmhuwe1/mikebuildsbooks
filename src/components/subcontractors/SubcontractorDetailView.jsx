import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Plus } from "lucide-react";
import W9CompliancePanel from "./W9CompliancePanel";
import W9ContractorPortal from "./W9ContractorPortal";
import PaymentLogDialog from "./PaymentLogDialog";
import SubWorkLogTab from "./SubWorkLogTab";
import SubPaysheetTab from "./SubPaysheetTab";
import SubPaymentsTab from "./SubPaymentsTab";
import SubScheduleTab from "./SubScheduleTab";
import { formatCurrency } from "@/lib/formatters";

export default function SubcontractorDetailView({ sub, payments, jobs }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Subcontractor.update(sub.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subcontractors"] });
      setEditForm(null);
      toast({ title: "Profile updated" });
    },
  });

  const startEdit = () => setEditForm({
    name: sub.name || "",
    company: sub.company || "",
    email: sub.email || "",
    phone: sub.phone || "",
    specialty: sub.specialty || "",
    address: sub.address || "",
    payment_rule: sub.payment_rule || "fixed",
    fixed_amount: sub.fixed_amount || 0,
    hourly_rate: sub.hourly_rate || 0,
    percent_value: sub.percent_value || 0,
    default_pay_type: sub.default_pay_type || "Daily",
    default_pay_rate: sub.default_pay_rate || 0,
    status: sub.status || "active",
  });

  if (!expanded) {
    return (
      <Card className="p-4">
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-start justify-between hover:bg-muted/50 -mx-4 -my-4 px-4 py-4 rounded-lg transition-colors"
        >
          <div className="text-left flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{sub.name}</p>
              {sub.w9_received ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />}
              <Badge variant="outline" className="text-xs">
                {sub.payment_rule === "fixed" ? "Fixed" : sub.payment_rule === "hourly" ? "Hourly" : sub.payment_rule === "percent_labor" ? "% Labor" : "% Profit"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{[sub.company, sub.specialty].filter(Boolean).join(" · ") || "—"}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </Card>
    );
  }

  // Legacy payment stats (from original SubcontractorPayment entity)
  const subPayments = payments.filter(p => p.subcontractor_id === sub.id).sort((a, b) => (b.payment_date || "").localeCompare(a.payment_date || ""));
  const ytdPayments = subPayments.filter(p => p.status === "paid" && p.payment_date?.startsWith(String(new Date().getFullYear())));
  const totalYTD = ytdPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPaid = subPayments.filter(p => p.status === "paid").reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPending = subPayments.filter(p => p.status === "pending").reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <Card className="p-4 space-y-4">
      {/* Header */}
      <button
        onClick={() => setExpanded(false)}
        className="w-full flex items-start justify-between hover:bg-muted/50 -mx-4 -my-4 px-4 py-4 rounded-lg transition-colors"
      >
        <div className="text-left flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{sub.name}</p>
            {sub.w9_received ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />}
            <Badge variant="outline" className="text-xs">
              {sub.payment_rule === "fixed" ? "Fixed" : sub.payment_rule === "hourly" ? "Hourly" : sub.payment_rule === "percent_labor" ? "% Labor" : "% Profit"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{[sub.company, sub.specialty].filter(Boolean).join(" · ") || "—"}</p>
        </div>
        <ChevronUp className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 bg-muted/30 -mx-4 -my-4 p-4 rounded-lg">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">YTD Paid</p>
          <p className="text-sm font-semibold">{formatCurrency(totalYTD)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">All-Time Paid</p>
          <p className="text-sm font-semibold">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-sm font-semibold text-yellow-600">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {/* Expanded tabs — new labor tracking tabs */}
      <Tabs defaultValue="worklog" className="w-full">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="flex w-max gap-0">
            <TabsTrigger value="profile" className="text-xs px-3">Profile</TabsTrigger>
            <TabsTrigger value="worklog" className="text-xs px-3">Work Log</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs px-3">Payments</TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs px-3">Schedule</TabsTrigger>
            <TabsTrigger value="legacy" className="text-xs px-3">Legacy Pay</TabsTrigger>
            <TabsTrigger value="paysheets" className="text-xs px-3">Pay Sheets</TabsTrigger>
            <TabsTrigger value="w9" className="text-xs px-3">W-9 / Compliance</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="mt-4">
          {editForm ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label className="text-xs">Name *</Label><Input value={editForm.name} onChange={e => setEditForm(f => ({...f, name: e.target.value}))} /></div>
                <div><Label className="text-xs">Company</Label><Input value={editForm.company} onChange={e => setEditForm(f => ({...f, company: e.target.value}))} /></div>
                <div><Label className="text-xs">Email</Label><Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({...f, email: e.target.value}))} /></div>
                <div><Label className="text-xs">Phone</Label><Input value={editForm.phone} onChange={e => setEditForm(f => ({...f, phone: e.target.value}))} /></div>
                <div><Label className="text-xs">Specialty</Label><Input value={editForm.specialty} onChange={e => setEditForm(f => ({...f, specialty: e.target.value}))} /></div>
                <div><Label className="text-xs">Address</Label><Input value={editForm.address} onChange={e => setEditForm(f => ({...f, address: e.target.value}))} /></div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={editForm.status} onValueChange={v => setEditForm(f => ({...f, status: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Payment Rule</Label>
                  <Select value={editForm.payment_rule} onValueChange={v => setEditForm(f => ({...f, payment_rule: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="percent_labor">% of Labor</SelectItem>
                      <SelectItem value="percent_profit">% of Profit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editForm.payment_rule === "fixed" && <div><Label className="text-xs">Fixed Amount ($)</Label><Input type="number" value={editForm.fixed_amount} onChange={e => setEditForm(f => ({...f, fixed_amount: parseFloat(e.target.value) || 0}))} /></div>}
                {editForm.payment_rule === "hourly" && <div><Label className="text-xs">Hourly Rate ($)</Label><Input type="number" value={editForm.hourly_rate} onChange={e => setEditForm(f => ({...f, hourly_rate: parseFloat(e.target.value) || 0}))} /></div>}
                {(editForm.payment_rule === "percent_labor" || editForm.payment_rule === "percent_profit") && <div><Label className="text-xs">Percent (%)</Label><Input type="number" value={editForm.percent_value} onChange={e => setEditForm(f => ({...f, percent_value: parseFloat(e.target.value) || 0}))} /></div>}
                <div>
                  <Label className="text-xs">Default Pay Type</Label>
                  <Select value={editForm.default_pay_type} onValueChange={v => setEditForm(f => ({...f, default_pay_type: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hourly">Hourly</SelectItem>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Default Pay Rate ($)</Label><Input type="number" value={editForm.default_pay_rate} onChange={e => setEditForm(f => ({...f, default_pay_rate: parseFloat(e.target.value) || 0}))} /></div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setEditForm(null)}>Cancel</Button>
                <Button onClick={() => updateMutation.mutate(editForm)} disabled={updateMutation.isPending || !editForm.name}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium">{sub.name}</p></div>
                <div><p className="text-xs text-muted-foreground">Company</p><p className="font-medium">{sub.company || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{sub.email || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{sub.phone || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Specialty</p><p className="font-medium">{sub.specialty || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Address</p><p className="font-medium">{sub.address || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Payment Rule</p><p className="font-medium capitalize">{sub.payment_rule?.replace(/_/g, " ") || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><p className="font-medium capitalize">{sub.status || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Default Pay Type</p><p className="font-medium">{sub.default_pay_type || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Default Pay Rate</p><p className="font-medium">${sub.default_pay_rate || 0}/day</p></div>
              </div>
              <Button size="sm" variant="outline" onClick={startEdit}>Edit Profile</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="worklog" className="mt-4">
          <SubWorkLogTab sub={sub} jobs={jobs} />
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <SubPaymentsTab sub={sub} />
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <SubScheduleTab sub={sub} jobs={jobs} />
        </TabsContent>

        {/* Legacy payment log — unchanged */}
        <TabsContent value="legacy" className="mt-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Legacy Payment Log (by Job)</p>
              <Button size="sm" onClick={() => setPaymentDialogOpen(true)} className="gap-1 h-6">
                <Plus className="w-3 h-3" /> Log Payment
              </Button>
            </div>
            {subPayments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No payments recorded</p>
            ) : (
              <div className="space-y-2">
                {subPayments.map(payment => {
                  const job = jobs.find(j => j.id === payment.job_id);
                  return (
                    <div key={payment.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs font-semibold">{payment.job_title || job?.title || "—"}</p>
                          {payment.calculation_notes && <p className="text-xs text-muted-foreground mt-0.5">{payment.calculation_notes}</p>}
                          {payment.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{payment.notes}</p>}
                        </div>
                        <Badge variant={payment.status === "paid" ? "default" : "secondary"} className="text-xs">
                          {payment.status === "paid" ? "Paid" : "Pending"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 bg-muted/40 -mx-3 -mb-2 p-3 rounded text-xs">
                        <div>
                          <span className="text-muted-foreground">Amount</span>
                          <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date</span>
                          <p className="font-semibold">{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Method</span>
                          <p className="font-semibold capitalize">{payment.payment_method || "—"}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="paysheets" className="mt-4">
          <SubPaysheetTab sub={sub} />
        </TabsContent>

        {/* W-9 / Compliance — unchanged */}
        <TabsContent value="w9" className="mt-4 space-y-3">
          {(sub.email || sub.phone) && (
            <div className="border-t pt-3 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
              {sub.email && <p className="text-xs">{sub.email}</p>}
              {sub.phone && <p className="text-xs">{sub.phone}</p>}
            </div>
          )}
          <W9CompliancePanel contractor={sub} />
          <W9ContractorPortal contractor={sub} />
        </TabsContent>
      </Tabs>

      <PaymentLogDialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} subcontractor={sub} jobs={jobs} />
    </Card>
  );
}