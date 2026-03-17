import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Upload, CheckCircle2, Loader, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";

export default function W9UploadSection({ subcontractor, onW9Uploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleW9Upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type)) {
      setError("Only PDF and Word documents accepted");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Upload file
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResponse.file_url;

      // Update subcontractor with W9 URL and date
      await base44.entities.Subcontractor.update(subcontractor.id, {
        w9_received: true,
        w9_date: new Date().toISOString().split("T")[0],
        w9_document_url: fileUrl,
      });

      setUploading(false);
      onW9Uploaded?.();
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <Card className={`p-4 border-2 ${subcontractor?.w9_received ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}`}>
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4" /> W-9 Form
          </h4>
          <p className="text-xs text-muted-foreground mb-3">
            {subcontractor?.w9_received
              ? "W-9 on file for tax reporting"
              : "Upload W-9 form for tax compliance"}
          </p>
        </div>
        {subcontractor?.w9_received && (
          <Badge className="bg-green-600 text-white text-xs">✓ Received</Badge>
        )}
      </div>

      {subcontractor?.w9_received ? (
        <div className="space-y-2">
          <div className="bg-white rounded p-2 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-xs text-muted-foreground truncate">
                W-9 uploaded
              </span>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatDate(subcontractor?.w9_date)}
            </span>
          </div>
          {subcontractor?.w9_document_url && (
            <a
              href={subcontractor.w9_document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline block"
            >
              View Document →
            </a>
          )}
        </div>
      ) : (
        <div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleW9Upload}
              disabled={uploading}
              className="hidden"
            />
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border-2 border-dashed border-yellow-300 hover:bg-yellow-100/50 transition-colors">
              {uploading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin text-yellow-600" />
                  <span className="text-xs text-yellow-700">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-yellow-600" />
                  <span className="text-xs text-yellow-700 font-medium">Upload W-9 (PDF or Word)</span>
                </>
              )}
            </div>
          </label>
          {error && (
            <div className="mt-2 flex items-start gap-2 text-xs text-red-700 bg-red-50 p-2 rounded">
              <X className="w-3 h-3 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}