import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, CheckCircle, FileImage } from "lucide-react";

export default function W9UploadModal({ contractor, onClose }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);
  const qc = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (url) => base44.entities.Subcontractor.update(contractor.id, {
      w9_status: "received",
      w9_received: true,
      w9_date: new Date().toISOString().split("T")[0],
      w9_pdf_url: url,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subcontractors"] });
      setDone(true);
    },
  });

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await saveMutation.mutateAsync(file_url);
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Upload W-9</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground hover:text-foreground" /></button>
        </div>

        {done ? (
          <div className="text-center py-8 space-y-3">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="font-semibold text-green-700">W-9 uploaded successfully!</p>
            <p className="text-xs text-muted-foreground">The W-9 status has been updated to "Received".</p>
            <Button onClick={onClose} className="w-full">Close</Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Upload a photo or scanned copy of the subcontractor's W-9. Accepted formats: JPG, PNG, PDF.
            </p>

            {/* Upload Area */}
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="W-9 Preview" className="max-h-40 mx-auto rounded object-contain" />
              ) : file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileImage className="w-10 h-10 text-muted-foreground" />
                  <p className="text-sm font-medium">{file.name}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="w-8 h-8" />
                  <p className="text-sm">Click to select a JPG, PNG, or PDF</p>
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFile}
            />

            {file && (
              <p className="text-xs text-muted-foreground text-center">
                {file.name} — {(file.size / 1024).toFixed(0)} KB
              </p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button
                className="flex-1"
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading ? "Uploading..." : "Upload & Save"}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}