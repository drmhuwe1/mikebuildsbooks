import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Trash2, CheckCircle, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PageHeader from "@/components/shared/PageHeader";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/formatters";
import DocPreviewModal from "@/components/documents/DocPreviewModal";
import { generateBillSummary } from "@/lib/docTemplates";

const CATEGORIES = ["vendor","insurance","software","utilities","tax","subcontractor","invoice","rent","equipment","other"];
const emptyBill = { title: "", vendor: "", category: "vendor", amount: 0, due_date: "", status: "pending", is_recurring: false, recurrence: "monthly", job_id: "", job_title: "", notes: "" };

export default function BillsCalendar() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyBill);
  const [editId, setEditId] = useState(null);
  const [view, setView] = useState("list");
  const [calMonth, setCalMonth] = useState(new Date());
  const qc = useQueryClient();

  const [docPreview, setDocPreview] = useState(null);
  const { data: bills = [] } = useQuery({ queryKey: ["bills"], queryFn: () => base44.entities.Bill.list("-due_date", 500) });
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 200) });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });

  const saveMutation = useMutation({
    mutationFn: (data) => editId ? base44.entities.Bill.update(editId, data) : base44.entities.Bill.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bills"] }); setDialogOpen(false); setEditId(null); setForm(emptyBill); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Bill.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bills"] }),
  });

  const markPaid = useMutation({
    mutationFn: (bill) => base44.entities.Bill.update(bill.id, { status: "paid", paid_date: new Date().toISOString().split("T")[0] }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bills"] }),
  });

  const openEdit = (b) => {
    setForm({ title: b.title, vendor: b.vendor || "", category: b.category || "vendor", amount: b.amount || 0, due_date: b.due_date || "", status: b.status || "pending", is_recurring: b.is_recurring || false, recurrence: b.recurrence || "monthly", job_id: b.job_id || "", job_title: b.job_title || "", notes: b.notes || "" });
    setEditId(b.id);
    setDialogOpen(true);
  };
  const openCreate = () => { setForm(emptyBill); setEditId(null); setDialogOpen(true); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const today = new Date().toISOString().split("T")[0];
  const overdue = bills.filter(b => b.status !== "paid" && b.due_date < today);
  const upcoming = bills.filter(b => b.status !== "paid" && b.due_date >= today).sort((a, b) => a.due_date.localeCompare(b.due_date));

  // Calendar grid
  const calDays = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [calMonth]);

  const billsByDate = useMemo(() => {
    const map = {};
    bills.forEach(b => { if (b.due_date) { if (!map[b.due_date]) map[b.due_date] = []; map[b.due_date].push(b); } });
    return map;
  }, [bills]);

  return (
    <div>
      <PageHeader title="Bills & Calendar" description="Track all bills, due dates, and payments" actionLabel="New Bill" onAction={openCreate}>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => { const html = generateBillSummary(bills, settings[0] || {}); setDocPreview({ html, title: "Bill Calendar Summary" }); }}>
          <FileText className="w-3.5 h-3.5" /> Export Summary
        </Button>
        <Tabs value={view} onValueChange={setView}>
          <TabsList><TabsTrigger value="list">List</TabsTrigger><TabsTrigger value="calendar">Calendar</TabsTrigger></TabsList>
        </Tabs>
      </PageHeader>
      <DocPreviewModal open={!!docPreview} onClose={() => setDocPreview(null)} html={docPreview?.html} title={docPreview?.title} docType="bill_summary" />

      {overdue.length > 0 && <div className="mb-4"><GuidedPrompt message={`${overdue.length} overdue bill(s) totaling ${formatCurrency(overdue.reduce((s, b) => s + (b.amount || 0), 0))}.`} variant="error" /></div>}

      {view === "list" ? (
        <div className="space-y-4">
          {overdue.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Overdue</p>
              <div className="space-y-2">{overdue.map(b => <BillRow key={b.id} bill={b} today={today} onEdit={openEdit} onDelete={deleteMutation.mutate} onMarkPaid={markPaid.mutate} />)}</div>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Upcoming</p>
            <div className="space-y-2">{upcoming.map(b => <BillRow key={b.id} bill={b} today={today} onEdit={openEdit} onDelete={deleteMutation.mutate} onMarkPaid={markPaid.mutate} />)}</div>
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground py-4">No upcoming bills.</p>}
          </div>
        </div>
      ) : (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button type="button" variant="ghost" size="icon" aria-label="Previous month" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))}><ChevronLeft className="w-4 h-4" /></Button>
            <h3 className="text-sm font-semibold">{calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
            <Button type="button" variant="ghost" size="icon" aria-label="Next month" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))}><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-7 gap-px text-center text-xs font-medium text-muted-foreground mb-1">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-px">
            {calDays.map((day, i) => {
              const ymPrefix = `${calMonth.getFullYear()}-${calMonth.getMonth()}`;
              if (!day) return <div key={`${ymPrefix}-pad-${i}`} className="min-h-[60px]" />;
              const dateStr = `${calMonth.getFullYear()}-${String(calMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayBills = billsByDate[dateStr] || [];
              const isToday = dateStr === today;
              return (
                <div key={dateStr} className={`min-h-[60px] p-1 border border-border rounded text-xs ${isToday ? "bg-primary/5 border-primary/30" : ""}`}>
                  <span className={`font-medium ${isToday ? "text-primary" : ""}`}>{day}</span>
                  {dayBills.slice(0, 2).map(b => (
                    <div key={b.id} className={`mt-0.5 px-1 py-0.5 rounded text-[10px] truncate ${b.status === "paid" ? "bg-green-100 text-green-700" : b.due_date < today ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                      {b.title}
                    </div>
                  ))}
                  {dayBills.length > 2 && <div className="text-[10px] text-muted-foreground">+{dayBills.length - 2} more</div>}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Bill" : "New Bill"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => set("title", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Vendor</Label><Input value={form.vendor} onChange={e => set("vendor", e.target.value)} /></div>
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={v => set("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Amount ($)</Label><Input type="number" value={form.amount} onChange={e => set("amount", parseFloat(e.target.value) || 0)} /></div>
              <div><Label>Due Date *</Label><Input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_recurring} onCheckedChange={v => set("is_recurring", v)} />
              <Label>Recurring Bill</Label>
              {form.is_recurring && (
                <Select value={form.recurrence} onValueChange={v => set("recurrence", v)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>{["weekly","biweekly","monthly","quarterly","annually"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
            <div><Label>Linked Job</Label>
              <Select value={form.job_id} onValueChange={v => { set("job_id", v); set("job_title", jobs.find(j => j.id === v)?.title || ""); }}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent><SelectItem value=" ">None</SelectItem>{jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} /></div>
            <Button type="button" className="w-full" onClick={() => saveMutation.mutate(form)} disabled={!form.title || !form.due_date || saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editId ? "Update" : "Create Bill"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BillRow({ bill, today, onEdit, onDelete, onMarkPaid }) {
  return (
    <Card className="p-3 flex items-center justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{bill.title}</p>
          <Badge className={`text-xs ${getStatusColor(bill.status)}`}>{bill.status}</Badge>
          {bill.is_recurring && <Badge variant="outline" className="text-xs">Recurring</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">{bill.vendor || bill.category} · Due: {formatDate(bill.due_date)}</p>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold">{formatCurrency(bill.amount)}</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label={`Actions for ${bill.title || "bill"}`}><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {bill.status !== "paid" && <DropdownMenuItem onClick={() => onMarkPaid(bill)}><CheckCircle className="w-3.5 h-3.5 mr-2" />Mark Paid</DropdownMenuItem>}
            <DropdownMenuItem onClick={() => onEdit(bill)}><Pencil className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(bill.id)}><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}