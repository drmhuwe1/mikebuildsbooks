import React, { useState, useEffect } from "react";
import SubscriptionGate from "@/components/subscription/SubscriptionGate";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Plus, Home } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useToast } from "@/components/ui/use-toast";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CATEGORIES = ["housing", "utilities", "insurance", "food", "transportation", "healthcare", "subscriptions", "debt", "savings", "entertainment", "other"];

function playBillSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

export default function PersonalBillsCalendar() {
  const [viewMode, setViewMode] = useState("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", category: "housing", amount: 0, due_date: "", status: "pending", is_recurring: false, recurrence: "monthly", notes: "" });
  const [editingId, setEditingId] = useState(null);
  const [notifiedIds, setNotifiedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem("personal_bill_notified") || "[]"); } catch { return []; }
  });
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: bills = [] } = useQuery({
    queryKey: ["personalBills"],
    queryFn: () => base44.entities.PersonalBill.list("-due_date", 200),
  });

  const today = new Date().toISOString().split("T")[0];
  const soon = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];

  // Bill reminders — fire once per session per bill
  useEffect(() => {
    if (!bills.length) return;
    const overdue = bills.filter(b => b.status !== "paid" && b.due_date < today);
    const dueSoon = bills.filter(b => b.status !== "paid" && b.due_date >= today && b.due_date <= soon);

    const newlyNotified = [...notifiedIds];
    let soundPlayed = false;

    overdue.forEach(b => {
      if (!notifiedIds.includes(`overdue_${b.id}`)) {
        if (!soundPlayed) { playBillSound(); soundPlayed = true; }
        toast({ title: "⚠️ Overdue Bill!", description: `${b.title} — ${formatCurrency(b.amount)} was due ${formatDate(b.due_date)}`, variant: "destructive" });
        newlyNotified.push(`overdue_${b.id}`);
      }
    });

    dueSoon.forEach(b => {
      if (!notifiedIds.includes(`soon_${b.id}`)) {
        if (!soundPlayed) { playBillSound(); soundPlayed = true; }
        toast({ title: "🔔 Bill Due Soon", description: `${b.title} — ${formatCurrency(b.amount)} due ${formatDate(b.due_date)}` });
        newlyNotified.push(`soon_${b.id}`);
      }
    });

    if (newlyNotified.length !== notifiedIds.length) {
      setNotifiedIds(newlyNotified);
      localStorage.setItem("personal_bill_notified", JSON.stringify(newlyNotified));
    }
  }, [bills]);

  const saveMutation = useMutation({
    mutationFn: (data) => editingId ? base44.entities.PersonalBill.update(editingId, data) : base44.entities.PersonalBill.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["personalBills"] }); setDialogOpen(false); resetForm(); setSelectedDay(d => d); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PersonalBill.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personalBills"] }),
  });

  const resetForm = () => { setForm({ title: "", category: "housing", amount: 0, due_date: "", status: "pending", is_recurring: false, recurrence: "monthly", notes: "" }); setEditingId(null); };
  const openCreate = () => { resetForm(); setDialogOpen(true); };
  const openEdit = (bill) => { setForm(bill); setEditingId(bill.id); setDialogOpen(true); };

  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0);
  const billsThisMonth = bills.filter(b => { const d = new Date(b.due_date); return d >= monthStart && d <= monthEnd; });
  const overdueBills = bills.filter(b => b.status !== "paid" && b.due_date < today);
  const totalMonthly = billsThisMonth.reduce((s, b) => s + (b.amount || 0), 0);
  const paidMonthly = billsThisMonth.filter(b => b.status === "paid").reduce((s, b) => s + (b.amount || 0), 0);

  const statusBadge = (b) => {
    const isOverdue = b.status !== "paid" && b.due_date < today;
    return b.status === "paid" ? "bg-green-100 text-green-700" : isOverdue ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700";
  };

  return (
    <SubscriptionGate feature="personalbillscalendar">
    <div>
      <PageHeader
        title="Personal Bills Calendar"
        description="Track and manage your personal expenses and bills"
        actionLabel="Add Personal Bill"
        onAction={openCreate}
      />

      {/* Overdue Warning */}
      {overdueBills.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">
            <p className="font-semibold">{overdueBills.length} overdue personal bill{overdueBills.length !== 1 ? "s" : ""}</p>
            <p className="text-xs mt-1">{overdueBills.map(b => b.title).join(", ")}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">This Month Total</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalMonthly)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Paid</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(paidMonthly)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Overdue</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(overdueBills.reduce((s, b) => s + (b.amount || 0), 0))}</p>
        </Card>
      </div>

      {/* Daily View for Selected Day */}
      {selectedDay && (
        <Card className="p-4 mb-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{new Date(selectedDay).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</h3>
            <Button size="sm" variant="ghost" onClick={() => setSelectedDay(null)}>✕</Button>
          </div>
          {bills.filter(b => b.due_date === selectedDay).length > 0 ? (
            <div className="space-y-2 mb-4">
              {bills.filter(b => b.due_date === selectedDay).map(b => (
                <div key={b.id} className="p-2 bg-orange-50 rounded border-l-2 border-orange-400 flex items-center justify-between text-xs cursor-pointer hover:bg-orange-100" onClick={() => openEdit(b)}>
                  <div>
                    <p className="font-semibold">{b.title}</p>
                    <p className="text-muted-foreground capitalize">{b.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(b.amount)}</p>
                    <Badge className={`text-xs ${statusBadge(b)}`}>{b.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mb-4">No bills on this day</p>
          )}
          {/* Quick Add */}
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Quick Add Bill</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Input placeholder="Bill name" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="text-sm" />
              <Input type="number" placeholder="Amount" value={form.amount || ""} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} className="text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" onClick={() => saveMutation.mutate({ ...form, due_date: selectedDay })} disabled={!form.title || form.amount === 0 || saveMutation.isPending}>
                {saveMutation.isPending ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* View Toggle */}
      <div className="flex gap-2 mb-4">
        {["calendar", "list", "upcoming"].map(mode => (
          <Button key={mode} size="sm" variant={viewMode === mode ? "default" : "outline"} onClick={() => setViewMode(mode)} className="capitalize">
            {mode === "upcoming" ? "Upcoming" : mode.charAt(0).toUpperCase() + mode.slice(1) + " View"}
          </Button>
        ))}
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{MONTHS[currentMonth]} {currentYear}</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); }}>←</Button>
              <Button size="sm" variant="outline" onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); }}>→</Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center font-semibold text-xs py-2">{d}</div>
            ))}
            {Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }).map((_, i) => (
              <div key={`e-${i}`} className="p-2 bg-muted/20" />
            ))}
            {Array.from({ length: new Date(currentYear, currentMonth + 1, 0).getDate() }).map((_, i) => {
              const day = i + 1;
              const dateStr = new Date(currentYear, currentMonth, day).toISOString().split("T")[0];
              const dayBills = bills.filter(b => b.due_date === dateStr);
              const hasOverdue = dayBills.some(b => b.status !== "paid" && dateStr < today);
              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(dateStr)}
                  className={`p-2 border rounded-lg min-h-16 text-xs cursor-pointer transition-colors overflow-visible ${dateStr === today ? "bg-blue-50 border-blue-200" : hasOverdue ? "bg-red-50 border-red-200" : "hover:bg-gray-50"}`}
                >
                  <p className="font-bold">{day}</p>
                  {dayBills.slice(0, 2).map((b, idx) => (
                    <div
                      key={idx}
                      onClick={e => { e.stopPropagation(); openEdit(b); }}
                      className={`text-xs px-1 py-0.5 rounded mt-1 ${b.status === "paid" ? "bg-green-100 text-green-800" : b.due_date < today ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
                      title={b.title}
                    >
                      <div className="font-medium truncate">{b.title}</div>
                      {b.amount > 0 && <div className="font-bold">{formatCurrency(b.amount)}</div>}
                    </div>
                  ))}
                  {dayBills.length > 2 && <div className="text-xs text-muted-foreground mt-1">+{dayBills.length - 2}</div>}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="space-y-3">
          {billsThisMonth.length === 0 ? (
            <p className="text-sm text-muted-foreground">No personal bills for {MONTHS[currentMonth]}</p>
          ) : (
            billsThisMonth.sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).map(b => (
              <Card key={b.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(b)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{b.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{b.category} · {formatDate(b.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(b.amount)}</p>
                    <Badge className={`text-xs mt-1 ${statusBadge(b)}`}>{b.status}</Badge>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Upcoming */}
      {viewMode === "upcoming" && (
        <div className="space-y-3">
          {bills.filter(b => b.status !== "paid").sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 15).map(b => (
            <Card key={b.id} className="p-3 cursor-pointer hover:shadow-md" onClick={() => openEdit(b)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(b.due_date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(b.amount)}</p>
                  <Badge className={`text-xs mt-1 ${statusBadge(b)}`}>{b.status}</Badge>
                </div>
              </div>
            </Card>
          ))}
          {bills.filter(b => b.status !== "paid").length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No upcoming personal bills.</p>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} Personal Bill</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Bill Description *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Amount ($)</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} step="0.01" /></div>
            </div>
            <div><Label>Due Date *</Label><Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["pending", "paid", "overdue", "cancelled"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Recurring</Label>
                <Select value={form.is_recurring ? "yes" : "no"} onValueChange={v => setForm(f => ({ ...f, is_recurring: v === "yes" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="no">No</SelectItem><SelectItem value="yes">Yes</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            {form.is_recurring && (
              <div><Label>Frequency</Label>
                <Select value={form.recurrence} onValueChange={v => setForm(f => ({ ...f, recurrence: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["weekly", "biweekly", "monthly", "quarterly", "annually"].map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => saveMutation.mutate(form)} disabled={!form.title || !form.due_date || saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editingId ? "Update" : "Create"}
              </Button>
              {editingId && <Button variant="destructive" onClick={() => { deleteMutation.mutate(editingId); setDialogOpen(false); resetForm(); }}>Delete</Button>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </SubscriptionGate>
  );
}