import React, { useState } from "react";
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
import { AlertCircle, CheckCircle, Plus } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { formatCurrency, formatDate } from "@/lib/formatters";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CATEGORIES_BUSINESS = ["vendor", "insurance", "software", "utilities", "tax", "subcontractor", "invoice", "rent", "equipment", "other"];
const CATEGORIES_PERSONAL = ["housing", "utilities", "insurance", "food", "transportation", "healthcare", "subscriptions", "debt", "savings", "entertainment", "other"];

export default function BillsCalendarUnified() {
  const [viewMode, setViewMode] = useState("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [billType, setBillType] = useState("business");
  const [form, setForm] = useState({
    title: "", category: "vendor", amount: 0, due_date: "", status: "pending",
    is_recurring: false, recurrence: "monthly", notes: "",
  });
  const [editingId, setEditingId] = useState(null);
  const qc = useQueryClient();

  const { data: bills = [] } = useQuery({ queryKey: ["bills"], queryFn: () => base44.entities.Bill.list("-due_date", 200) });
  const { data: personalBills = [] } = useQuery({ queryKey: ["personalBills"], queryFn: () => base44.entities.PersonalBill.list("-due_date", 200) });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const entity = billType === "business" ? base44.entities.Bill : base44.entities.PersonalBill;
      return editingId ? entity.update(editingId, data) : entity.create(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bills"] });
      qc.invalidateQueries({ queryKey: ["personalBills"] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => {
      const entity = billType === "business" ? base44.entities.Bill : base44.entities.PersonalBill;
      return entity.delete(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bills"] });
      qc.invalidateQueries({ queryKey: ["personalBills"] });
    },
  });

  const resetForm = () => {
    setForm({ title: "", category: "vendor", amount: 0, due_date: "", status: "pending", is_recurring: false, recurrence: "monthly", notes: "" });
    setEditingId(null);
  };

  const openCreate = (type) => {
    resetForm();
    setBillType(type);
    setDialogOpen(true);
  };

  const openEdit = (bill, type) => {
    setBillType(type);
    setForm(bill);
    setEditingId(bill.id);
    setDialogOpen(true);
  };

  // Get bills for current month
  const allBills = [...bills, ...personalBills];
  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0);

  const billsThisMonth = allBills.filter(b => {
    const dueDate = new Date(b.due_date);
    return dueDate >= monthStart && dueDate <= monthEnd;
  });

  const today = new Date().toISOString().split("T")[0];
  const overdueBills = allBills.filter(b => b.status !== "paid" && b.due_date < today);
  const totalMonthly = billsThisMonth.reduce((s, b) => s + (b.amount || 0), 0);
  const paidMonthly = billsThisMonth.filter(b => b.status === "paid").reduce((s, b) => s + (b.amount || 0), 0);

  return (
    <div>
      <PageHeader title="Bills Calendar" description="Track business and personal bills in one unified view" actionLabel="Add Bill" onAction={() => openCreate("business")} />

      {/* Overdue Warning */}
      {overdueBills.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">
            <p className="font-semibold">{overdueBills.length} overdue bill{overdueBills.length !== 1 ? "s" : ""}</p>
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
            <h3 className="font-semibold">{new Date(selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
            <Button size="sm" variant="ghost" onClick={() => setSelectedDay(null)}>✕</Button>
          </div>
          <div className="space-y-2">
            {allBills.filter(b => b.due_date === selectedDay).length === 0 ? (
              <p className="text-sm text-muted-foreground">No bills on this day</p>
            ) : (
              allBills.filter(b => b.due_date === selectedDay).map(b => (
                <div key={b.id} className="p-3 bg-white border rounded-lg flex items-center justify-between hover:shadow-sm transition-shadow cursor-pointer" onClick={() => openEdit(b, b.category && CATEGORIES_BUSINESS.includes(b.category) ? "business" : "personal")}>
                  <div>
                    <p className="font-semibold text-sm">{b.title}</p>
                    <p className="text-xs text-muted-foreground">{b.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(b.amount)}</p>
                    <Badge className={`text-xs ${b.status === "paid" ? "bg-green-100 text-green-700" : b.status === "overdue" || new Date(b.due_date) < new Date() ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {b.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* View Toggle */}
      <div className="flex gap-2 mb-4">
        <Button size="sm" variant={viewMode === "calendar" ? "default" : "outline"} onClick={() => setViewMode("calendar")}>
          Calendar View
        </Button>
        <Button size="sm" variant={viewMode === "list" ? "default" : "outline"} onClick={() => setViewMode("list")}>
          List View
        </Button>
        <Button size="sm" variant={viewMode === "upcoming" ? "default" : "outline"} onClick={() => setViewMode("upcoming")}>
          Upcoming Bills
        </Button>
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              {MONTHS[currentMonth]} {currentYear}
            </h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setCurrentMonth(m => m === 0 ? 11 : m - 1)}>←</Button>
              <Button size="sm" variant="outline" onClick={() => setCurrentMonth(m => m === 11 ? 0 : m + 1)}>→</Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center font-semibold text-xs py-2">{d}</div>
            ))}
            {Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2 text-center text-xs text-muted-foreground bg-muted/20" />
            ))}
            {Array.from({ length: new Date(currentYear, currentMonth + 1, 0).getDate() }).map((_, i) => {
              const day = i + 1;
              const dateStr = new Date(currentYear, currentMonth, day).toISOString().split("T")[0];
              const dayBills = allBills.filter(b => b.due_date === dateStr);
              return (
                <div 
                  key={day} 
                  onClick={() => dayBills.length > 0 && setSelectedDay(dateStr)}
                  className={`p-2 border rounded-lg min-h-12 text-xs cursor-pointer transition-colors ${dateStr === today ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"} ${dayBills.length > 0 ? "hover:border-primary" : ""}`}
                >
                  <p className="font-bold">{day}</p>
                  {dayBills.slice(0, 2).map((b, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded mt-1"
                      title={b.title}
                    >
                      {formatCurrency(b.amount)}
                    </div>
                  ))}
                  {dayBills.length > 2 && <div className="text-xs text-muted-foreground mt-1">+{dayBills.length - 2} more</div>}
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
            <p className="text-sm text-muted-foreground">No bills scheduled for {MONTHS[currentMonth]}</p>
          ) : (
            billsThisMonth.sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).map(b => (
              <Card key={b.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(b, b.category && CATEGORIES_BUSINESS.includes(b.category) ? "business" : "personal")}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{b.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(b.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(b.amount)}</p>
                    <Badge className={`text-xs mt-1 ${b.status === "paid" ? "bg-green-100 text-green-700" : b.status === "overdue" || new Date(b.due_date) < new Date() ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {b.status}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Upcoming Bills */}
      {viewMode === "upcoming" && (
        <div className="space-y-3">
          {allBills
            .filter(b => b.status !== "paid")
            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
            .slice(0, 10)
            .map(b => (
              <Card key={b.id} className="p-3" onClick={() => openEdit(b, b.category && CATEGORIES_BUSINESS.includes(b.category) ? "business" : "personal")}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{b.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(b.due_date)}</p>
                  </div>
                  <p className="font-bold">{formatCurrency(b.amount)}</p>
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} {billType === "business" ? "Business" : "Personal"} Bill</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Bill Description *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(billType === "business" ? CATEGORIES_BUSINESS : CATEGORIES_PERSONAL).map(c => (
                      <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Amount ($)</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} step="0.01" /></div>
            </div>
            <div><Label>Due Date *</Label><Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["pending", "paid", "overdue", "cancelled"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Recurring</Label>
                <Select value={form.is_recurring ? "yes" : "no"} onValueChange={v => setForm(f => ({ ...f, is_recurring: v === "yes" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.is_recurring && (
              <div><Label>Frequency</Label>
                <Select value={form.recurrence} onValueChange={v => setForm(f => ({ ...f, recurrence: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["weekly", "biweekly", "monthly", "quarterly", "annually"].map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => saveMutation.mutate(form)} disabled={!form.title || !form.due_date || saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editingId ? "Update" : "Create"}
              </Button>
              {editingId && <Button variant="destructive" onClick={() => deleteMutation.mutate(editingId)}>Delete</Button>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}