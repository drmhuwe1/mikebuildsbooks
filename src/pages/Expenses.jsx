import React, { useState } from "react";
import SubscriptionGate from "@/components/subscription/SubscriptionGate";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Upload, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { FileText, Plus } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useToast } from "@/components/ui/use-toast";

export default function Expenses() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: expenses = [] } = useQuery({
    queryKey: ["jobReceipts"],
    queryFn: () => base44.entities.JobReceipt.list("-created_date", 500),
  });
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-created_date", 200),
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    job_id: "",
    description: "",
    amount: "",
    category: "other",
    vendor: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.JobReceipt.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobReceipts"] });
      setForm({
        job_id: "",
        description: "",
        amount: "",
        category: "other",
        vendor: "",
        date: new Date().toISOString().split("T")[0],
      });
      setPreviewUrl(null);
      setShowForm(false);
      toast({ title: "Expense recorded" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.JobReceipt.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobReceipts"] });
      toast({ title: "Expense deleted" });
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, receipt_image_url: file_url }));
      toast({ title: "Receipt uploaded" });
    } catch (err) {
      toast({ title: "Upload failed", variant: "destructive" });
    }
    setUploadingFile(false);
  };

  const handleSubmit = async () => {
    if (!form.job_id || !form.description || !form.amount) {
      toast({
        title: "Missing required fields",
        variant: "destructive",
      });
      return;
    }

    const selectedJob = jobs.find((j) => j.id === form.job_id);
    createMutation.mutate({
      job_id: form.job_id,
      job_title: selectedJob?.title,
      description: form.description,
      amount: parseFloat(form.amount),
      category: form.category,
      vendor: form.vendor,
      date: form.date,
      receipt_image_url: form.receipt_image_url || "",
    });
  };

  // Group expenses by category
  const expensesByCategory = {};
  expenses.forEach((exp) => {
    if (!expensesByCategory[exp.category]) {
      expensesByCategory[exp.category] = [];
    }
    expensesByCategory[exp.category].push(exp);
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const categories = [
    "materials",
    "labor",
    "subcontractor",
    "equipment",
    "permits",
    "overhead",
    "fuel",
    "tools",
    "other",
  ];

  return (
    <div>
      <PageHeader
        title="Expense Tracking"
        description="Record and track all business expenses with receipt uploads"
        actionLabel="Record Expense"
        onAction={() => setShowForm(!showForm)}
      />

      {/* Summary */}
      <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-blue-700">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Expense Records</p>
            <p className="text-2xl font-bold">{expenses.length}</p>
          </div>
        </div>
      </Card>

      {/* Add Expense Form */}
      {showForm && (
        <Card className="p-4 mb-6 space-y-4 border-primary/30">
          <h3 className="font-semibold">New Expense</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Job (optional)</Label>
              <Select value={form.job_id} onValueChange={(v) => setForm((f) => ({ ...f, job_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>General/No Job</SelectItem>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace(/_/g, " ").toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Description *</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="e.g., Lumber from Home Depot"
              />
            </div>

            <div>
              <Label className="text-xs">Amount *</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Vendor (optional)</Label>
              <Input
                value={form.vendor}
                onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                placeholder="e.g., Home Depot"
              />
            </div>

            <div>
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>

          {/* Receipt Upload */}
          <div>
            <Label className="text-xs">Receipt Image (optional)</Label>
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                {form.receipt_image_url || previewUrl ? (
                  <div className="relative border rounded p-2 bg-muted/30 w-32 h-32">
                    <img
                      src={previewUrl || form.receipt_image_url}
                      alt="Receipt preview"
                      className="w-full h-full object-cover rounded"
                    />
                    {!uploadingFile && (
                      <button
                        onClick={() => {
                          setForm((f) => ({ ...f, receipt_image_url: "" }));
                          setPreviewUrl(null);
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-border rounded p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/50 transition">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {uploadingFile ? "Uploading..." : "Click to upload receipt"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploadingFile}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || !form.description || !form.amount}
            >
              {createMutation.isPending ? "Saving..." : "Record Expense"}
            </Button>
          </div>
        </Card>
      )}

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No expenses recorded"
          description="Start tracking business expenses by recording receipts"
          actionLabel="Record Expense"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => {
            const catExpenses = expensesByCategory[cat] || [];
            if (catExpenses.length === 0) return null;

            const catTotal = catExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

            return (
              <div key={cat}>
                <div className="flex justify-between items-center mb-2 px-2">
                  <h3 className="font-semibold text-sm">
                    {cat.replace(/_/g, " ").toUpperCase()}
                  </h3>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {formatCurrency(catTotal)}
                  </p>
                </div>

                <div className="space-y-2">
                  {catExpenses.map((exp) => (
                    <Card key={exp.id} className="p-4 flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{exp.description}</p>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          {exp.vendor && <span>{exp.vendor}</span>}
                          <span>{formatDate(exp.date)}</span>
                          {exp.job_title && (
                            <span className="bg-muted px-2 py-0.5 rounded">
                              {exp.job_title}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <p className="font-semibold">{formatCurrency(exp.amount)}</p>
                        {exp.receipt_image_url && (
                          <button
                            onClick={() => window.open(exp.receipt_image_url, "_blank")}
                            className="text-primary hover:text-primary/80"
                            title="View receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteMutation.mutate(exp.id)}
                          className="text-destructive hover:text-destructive/80"
                          title="Delete expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}