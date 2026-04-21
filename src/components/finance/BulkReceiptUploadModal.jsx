import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function BulkReceiptUploadModal({ open, onOpenChange, jobs = [] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [category, setCategory] = useState("materials");

  const uploadMutation = useMutation({
    mutationFn: async (files) => {
      const results = [];
      for (const file of files) {
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          const receipt = await base44.entities.JobReceipt.create({
            job_id: selectedJobId || null,
            job_title: jobs.find(j => j.id === selectedJobId)?.title || null,
            description: file.name.replace(/\.[^/.]+$/, ""),
            amount: 0,
            category,
            receipt_image_url: file_url,
            date: new Date().toISOString().split("T")[0],
            is_estimated: false,
          });
          results.push({ file: file.name, receipt, success: true });
        } catch (err) {
          results.push({ file: file.name, error: err.message, success: false });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      qc.invalidateQueries({ queryKey: ["all-receipts"] });
      const successes = results.filter(r => r.success).length;
      toast({ title: `${successes} receipt(s) uploaded` });
      setSelectedFiles([]);
      setSelectedJobId("");
      setCategory("materials");
      onOpenChange(false);
    },
    onError: (err) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast({ title: "Select at least one file", variant: "destructive" });
      return;
    }
    uploadMutation.mutate(selectedFiles);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Upload Receipts</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          <div>
            <Label className="mb-2 block">Select Receipt Photos</Label>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploadMutation.isPending}
            />
            <p className="text-xs text-muted-foreground mt-1">Upload multiple receipt images at once</p>
          </div>

          {/* Job Filter */}
          <div>
            <Label className="mb-2 block">Assign to Job (Optional)</Label>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger>
                <SelectValue placeholder="No specific job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No specific job</SelectItem>
                {jobs.map(j => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.title} ({j.client_name || "—"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div>
            <Label className="mb-2 block">Expense Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="materials">Materials</SelectItem>
                <SelectItem value="labor">Labor</SelectItem>
                <SelectItem value="subcontractor">Subcontractor</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="permits">Permits</SelectItem>
                <SelectItem value="overhead">Overhead</SelectItem>
                <SelectItem value="fuel">Fuel</SelectItem>
                <SelectItem value="tools">Tools</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Selected Files ({selectedFiles.length})</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                    <span className="truncate">{file.name}</span>
                    <button
                      onClick={() => handleRemoveFile(i)}
                      className="text-destructive hover:bg-destructive/10 rounded p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploadMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploadMutation.isPending}
            className="gap-1.5"
          >
            {uploadMutation.isPending ? (
              <>Uploading...</>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Upload {selectedFiles.length} Receipt{selectedFiles.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}