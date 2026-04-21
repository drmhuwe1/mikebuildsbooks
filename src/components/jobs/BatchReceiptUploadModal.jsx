import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Upload, Check } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

const RECEIPT_CATEGORIES = [
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

export default function BatchReceiptUploadModal({ job, open, onOpenChange }) {
  const [uploads, setUploads] = useState([]); // { file, preview, amount, category, uploading, url }
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const preview = URL.createObjectURL(file);
      setUploads(prev => [...prev, { file, preview, amount: 0, category: "materials", uploading: false, url: null }]);
    }
  };

  const updateUpload = (idx, key, value) => {
    setUploads(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [key]: value };
      return updated;
    });
  };

  const removeUpload = (idx) => {
    setUploads(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadAndSave = async () => {
    setSaving(true);
    try {
      for (let i = 0; i < uploads.length; i++) {
        const upload = uploads[i];
        if (!upload.file) continue;

        updateUpload(i, "uploading", true);

        // Upload file
        const { file_url } = await base44.integrations.Core.UploadFile({ file: upload.file });

        // Create receipt record
        await base44.entities.JobReceipt.create({
          job_id: job.id,
          job_title: job.title,
          description: `Receipt - ${upload.category}`,
          amount: parseFloat(upload.amount) || 0,
          category: upload.category,
          receipt_image_url: file_url,
          date: new Date().toISOString().split("T")[0],
          is_estimated: false,
        });

        updateUpload(i, "uploading", false);
        updateUpload(i, "url", file_url);
      }

      // Invalidate cache and close
      qc.invalidateQueries({ queryKey: ["all-receipts"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      onOpenChange(false);
      setUploads([]);
    } catch (err) {
      console.error("Batch upload failed:", err);
      alert(`Error uploading receipts: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const totalAmount = uploads.reduce((sum, u) => sum + (parseFloat(u.amount) || 0), 0);
  const allHaveAmounts = uploads.every(u => parseFloat(u.amount) > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batch Receipt Upload</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">{job?.title}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <label className="cursor-pointer block">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium mb-1">Select receipt photos</p>
              <p className="text-xs text-muted-foreground">Click to browse or drag files here</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {/* Uploads List */}
          {uploads.length > 0 && (
            <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
              <p className="text-sm font-semibold">
                {uploads.length} photo{uploads.length !== 1 ? "s" : ""} selected
              </p>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {uploads.map((upload, idx) => (
                  <div key={idx} className="flex gap-3 items-start bg-card p-3 rounded-lg border">
                    <img
                      src={upload.preview}
                      alt={`Receipt ${idx + 1}`}
                      className="w-16 h-16 object-cover rounded border"
                    />

                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Amount</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={upload.amount}
                            onChange={e => updateUpload(idx, "amount", e.target.value)}
                            placeholder="0.00"
                            className="h-8 text-sm"
                            disabled={upload.uploading}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Category</Label>
                          <Select
                            value={upload.category}
                            onValueChange={v => updateUpload(idx, "category", v)}
                            disabled={upload.uploading}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RECEIPT_CATEGORIES.map(cat => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {upload.uploading && (
                        <p className="text-xs text-blue-600">Uploading...</p>
                      )}
                      {upload.url && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Uploaded
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => removeUpload(idx)}
                      disabled={upload.uploading}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <p className="text-sm font-medium">Total Amount:</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={uploadAndSave}
              disabled={uploads.length === 0 || !allHaveAmounts || saving}
              className="gap-2"
            >
              {saving ? "Uploading..." : `Save ${uploads.length} Receipt${uploads.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}