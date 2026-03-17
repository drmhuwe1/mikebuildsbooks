import React, { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";

export default function BidImportUpload({ onUpload, loading, error, fileName }) {
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Upload Bid Document</h3>
        <p className="text-sm text-muted-foreground">
          Upload a bid document (PDF, Word, or image). AI will extract the information automatically.
        </p>
      </div>

      <Card className="p-8 border-2 border-dashed hover:border-primary transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        <div className="flex flex-col items-center gap-3">
          <Upload className="w-8 h-8 text-muted-foreground" />
          <p className="font-semibold text-center">Click to upload or drag & drop</p>
          <p className="text-xs text-muted-foreground">PDF, Word (.docx), or image files (JPG, PNG, etc.)</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.gif,.tiff"
          onChange={handleFileSelect}
          className="hidden"
        />
      </Card>

      {fileName && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <CheckCircle className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-700">{fileName} selected</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-700">
          <strong>Supported formats:</strong> PDF, Word documents, scanned images, or photos of bid documents. AI will read the content and extract bid details automatically.
        </p>
      </div>
    </div>
  );
}