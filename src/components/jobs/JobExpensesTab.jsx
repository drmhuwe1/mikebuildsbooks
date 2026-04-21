import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/formatters";
import { Plus, Upload, Receipt, Trash2, Eye, X, Edit2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const CATEGORIES = [
  { value: "materials", label: "Materials" },
  { value: "labor", label: "Labor" },
  { value: "subcontractor", label: "Subcontractor" },
  { value: "equipment", label: "Equipment" },
  { value: "permits", label: "Permits & Fees" },
  { value: "overhead", label: "Overhead" },
  { value: "fuel", label: "Fuel" },
  { value: "tools", label: "Tools" },
  { value: "other", label: "Other" },
];

export default function JobExpensesTab({ job }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewImage, setViewImage] = useState(null);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [form, setForm] = useState({
    description: "", amount: "", category: "materials",
    vendor: "", date: new Date().toISOString().split("T")[0],
    receipt_image_url: "", notes: ""
  });

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ["job-receipts", job.id],
    queryFn: () => base44.entities.JobReceipt.filter({ job_id: job.id }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.JobReceipt.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-receipts", job.id] });
      queryClient.invalidateQueries({ queryKey: ["all-receipts"] });
      setShowForm(false);
      setForm({ description: "", amount: "", category: "materials", vendor: "", date: new Date().toISOString().split("T")[0], receipt_image_url: "", notes: "" });
      toast({ title: "Receipt saved!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.JobReceipt.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-receipts", job.id] });
      queryClient.invalidateQueries({ queryKey: ["all-receipts"] });
      toast({ title: "Receipt deleted" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.JobReceipt.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-receipts", job.id] });
      queryClient.invalidateQueries({ queryKey: ["all-receipts"] });
      setEditingReceipt(null);
      toast({ title: "Receipt updated" });
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, receipt_image_url: file_url }));
    setUploading(false);
    toast({ title: "Image uploaded!" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    createMutation.mutate({
      ...form,
      amount: parseFloat(form.amount) || 0,
      job_id: job.id,
      job_title: job.title,
    });
  };

  const totalReceipts = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total Receipt Expenses</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(totalReceipts)}</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Receipt
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="p-4 border-primary/30 bg-primary/5 space-y-3">
          <p className="text-sm font-semibold">New Receipt Entry</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Description *</Label>
                <Input placeholder="What was purchased?" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required />
              </div>
              <div>
                <Label className="text-xs">Amount ($) *</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Vendor</Label>
                <Input placeholder="Store / Vendor name" value={form.vendor} onChange={e => setForm(p => ({ ...p, vendor: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Receipt Photo</Label>
                <div className="flex gap-2 items-center">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 border rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                      <Upload className="w-4 h-4" />
                      {uploading ? "Uploading…" : form.receipt_image_url ? "✓ Uploaded" : "Upload photo"}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                  {form.receipt_image_url && (
                    <img src={form.receipt_image_url} alt="receipt" className="w-10 h-10 object-cover rounded border cursor-pointer" onClick={() => setViewImage(form.receipt_image_url)} />
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={createMutation.isPending}>
                <Receipt className="w-4 h-4 mr-1.5" /> Save Receipt
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Receipt List */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-6">Loading receipts…</p>
      ) : receipts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No receipts yet. Click "Add Receipt" to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {receipts.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setEditingReceipt(r)}>
              {r.receipt_image_url ? (
                <img src={r.receipt_image_url} alt="receipt" className="w-12 h-12 object-cover rounded border flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.description}</p>
                <p className="text-xs text-muted-foreground">
                  {r.vendor && `${r.vendor} · `}
                  {CATEGORIES.find(c => c.value === r.category)?.label || r.category}
                  {r.date && ` · ${format(new Date(r.date), "M/d/yyyy")}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-bold text-red-600">{formatCurrency(r.amount)}</span>
                <Edit2 className="w-4 h-4 text-muted-foreground" />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-red-500 hover:text-red-600" 
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(r.id); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image lightbox */}
      {viewImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
          <button className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2" onClick={() => setViewImage(null)}>
            <X className="w-5 h-5" />
          </button>
          <img src={viewImage} alt="receipt" className="max-w-full max-h-full rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Edit Receipt Modal */}
      <Dialog open={!!editingReceipt} onOpenChange={(open) => { if (!open) setEditingReceipt(null); }}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Receipt — {editingReceipt?.description}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 overflow-y-auto flex-1 pr-4">
            <div>
              <Label className="text-xs">Description</Label>
              <Input 
                value={editingReceipt?.description || ""} 
                onChange={(e) => setEditingReceipt({ ...editingReceipt, description: e.target.value })} 
              />
            </div>
            <div>
              <Label className="text-xs">Amount</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={editingReceipt?.amount || ""} 
                onChange={(e) => setEditingReceipt({ ...editingReceipt, amount: parseFloat(e.target.value) })} 
              />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={editingReceipt?.category || "materials"} onValueChange={(v) => setEditingReceipt({ ...editingReceipt, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Receipt Photos</Label>
              <label className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="w-4 h-4" />
                <span className="text-sm text-muted-foreground">{uploading ? "Uploading…" : "Upload photos"}</span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  disabled={uploading}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;
                    setUploading(true);
                    try {
                      const urls = [];
                      for (const file of files) {
                        const { file_url } = await base44.integrations.Core.UploadFile({ file });
                        urls.push(file_url);
                      }
                      const newUrl = [...(editingReceipt?.receipt_image_url?.split(",").filter(u => u.trim()) || []), ...urls].join(",");
                      setEditingReceipt({ ...editingReceipt, receipt_image_url: newUrl });
                      toast({ title: `${files.length} photo(s) uploaded` });
                    } catch (err) {
                      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
              </label>
              {uploading && <p className="text-xs text-muted-foreground mt-1">Uploading images, please wait...</p>}
            </div>
            {editingReceipt?.receipt_image_url && (
              <div className="grid grid-cols-3 gap-2">
                {editingReceipt.receipt_image_url.split(",").filter(url => url.trim()).map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url.trim()} alt={`Receipt ${i + 1}`} className="w-full h-24 object-cover rounded border cursor-pointer" onClick={() => setViewImage(url.trim())} />
                    <button
                      onClick={() => {
                        const urls = editingReceipt.receipt_image_url.split(",").filter((_, idx) => idx !== i);
                        setEditingReceipt({ ...editingReceipt, receipt_image_url: urls.join(",") });
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border-t pt-3 mt-3">
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingReceipt(null)} disabled={uploading || updateMutation.isPending}>Cancel</Button>
              <Button 
                onClick={() => updateMutation.mutate({ id: editingReceipt.id, data: { description: editingReceipt.description, amount: editingReceipt.amount, category: editingReceipt.category, receipt_image_url: editingReceipt.receipt_image_url } })} 
                disabled={uploading || updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </div>
          </DialogContent>
          </Dialog>
      </div>
      );
      }