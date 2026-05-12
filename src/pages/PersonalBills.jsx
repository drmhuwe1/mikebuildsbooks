import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/shared/PageHeader";
import { Home, MoreVertical, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

const CATEGORIES = ["housing","utilities","insurance","food","transportation","healthcare","subscriptions","debt","savings","entertainment","other"];
const BLANK = { title: "", payee: "", category: "other", amount: 0, due_date: "", status: "pending", is_recurring: false, recurrence: "monthly", notes: "", paid_date: "" };

function statusBadge(bill, today) {
  if (bill.status === "paid") return <Badge className="bg-green-100 text-green-700 text-xs">Paid</Badge>;
  if (bill.due_date < today && bill.status !== "paid") return <Badge className="bg-red-100 text-red-700 text-xs">Overdue</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-700 text-xs">Pending</Badge>;
}

export default function PersonalBills() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data: bills = [] } = useQuery({ queryKey: ["personal_bills"], queryFn: () => base44.entities.PersonalBill.list("-due_date", 200) });

  const saveMutation = useMutation({
    mutationFn: async (data) => editing ? base44.entities.PersonalBill.update(editing.id, data) : base44.entities.PersonalBill.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["personal_bills"] }); setOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PersonalBill.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personal_bills"] }),
  });

  const markPaid = (bill) => {
    base44.entities.PersonalBill.update(bill.id, { status: "paid", paid_date: new Date().toISOString().split("T")[0] })
      .then(() => qc.invalidateQueries({ queryKey: ["personal_bills"] }));
  };

  const openNew = () => { setEditing(null); setForm(BLANK); setOpen(true); };
  const openEdit = (b) => { setEditing(b); setForm({ ...BLANK, ...b }); setOpen(true); };

  const today = new Date().toISOString().split("T")[0];
  const filtered = bills.filter(b =>
    b.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.payee?.toLowerCase().includes(search.toLowerCase()) ||
    b.category?.toLowerCase().includes(search.toLowerCase())
  );

  const pending = bills.filter(b => b.status !== "paid");
  const overdue = bills.filter(b => b.status !== "paid" && b.due_date < today);
  const totalPending = pending.reduce((s, b) => s + (b.amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personal Bills"
        description="Track your personal and household expenses separately from business finances"
        actionLabel="Add Bill"
        onAction={openNew}
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Total Pending</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(totalPending)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Bills Due / Overdue</p>
          <p className={`text-xl font-bold mt-1 ${overdue.length > 0 ? "text-red-600" : "text-foreground"}`}>{overdue.length} overdue</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Upcoming Bills</p>
          <p className="text-xl font-bold mt-1">{pending.length}</p>
        </Card>
      </div>

      {/* Search */}
      <Input placeholder="Search bills..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Home className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold">No personal bills yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add your housing, utilities, subscriptions, and more.</p>
          </div>
        )}
        {filtered.map(b => (
          <Card key={b.id} className="p-4 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium truncate">{b.title}</p>
                {statusBadge(b, today)}
                {b.is_recurring && <Badge variant="outline" className="text-xs">Recurring</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{b.payee || b.category} · Due {formatDate(b.due_date)}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <p className="text-sm font-semibold">{formatCurrency(b.amount)}</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${b.title || "bill"}`}><MoreVertical className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {b.status !== "paid" && (
                    <DropdownMenuItem onClick={() => markPaid(b)}>
                      <CheckCircle className="w-3.5 h-3.5 mr-2 text-green-600" /> Mark Paid
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => openEdit(b)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={() => deleteMutation.mutate(b.id)}>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Personal Bill" : "Add Personal Bill"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Description *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Rent, Electric Bill" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Payee</Label>
                <Input value={form.payee} onChange={e => setForm(f => ({ ...f, payee: e.target.value }))} placeholder="Who you pay" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount *</Label>
                <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Due Date *</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.status === "paid" && (
                <div>
                  <Label>Paid Date</Label>
                  <Input type="date" value={form.paid_date} onChange={e => setForm(f => ({ ...f, paid_date: e.target.value }))} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_recurring} onCheckedChange={v => setForm(f => ({ ...f, is_recurring: v }))} />
              <Label>Recurring</Label>
              {form.is_recurring && (
                <Select value={form.recurrence} onValueChange={v => setForm(f => ({ ...f, recurrence: v }))}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Biweekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="button" onClick={() => saveMutation.mutate(form)} disabled={!form.title || !form.amount || !form.due_date || saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editing ? "Save Changes" : "Add Bill"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}