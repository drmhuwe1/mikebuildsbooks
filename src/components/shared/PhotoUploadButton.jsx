import React, { useRef, useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Reusable photo upload button that offers both camera and file upload options.
 * Props:
 *   photoUrl - current photo URL (string or null)
 *   onPhotoChange - callback(url) when photo is set or cleared
 *   label - optional label text (default: "Add Photo")
 */
export default function PhotoUploadButton({ photoUrl, onPhotoChange, label = "Add Photo" }) {
  const [uploading, setUploading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setShowOptions(false);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onPhotoChange(file_url);
    setUploading(false);
  };

  if (photoUrl) {
    return (
      <div className="relative inline-block">
        <img src={photoUrl} alt="Photo" className="w-full max-h-40 object-cover rounded border" />
        <button
          onClick={() => onPhotoChange(null)}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {!showOptions ? (
        <button
          type="button"
          onClick={() => setShowOptions(true)}
          disabled={uploading}
          className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-md p-3 hover:bg-muted/30 text-sm text-muted-foreground w-full"
        >
          <Camera className="w-4 h-4" />
          {uploading ? "Uploading..." : label}
        </button>
      ) : (
        <div className="flex gap-2">
          {/* Camera */}
          <label className="flex-1 flex flex-col items-center gap-1.5 cursor-pointer border border-dashed border-border rounded-md p-3 hover:bg-muted/30 text-xs text-muted-foreground text-center">
            <Camera className="w-5 h-5" />
            Take Photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>

          {/* Gallery / File */}
          <label className="flex-1 flex flex-col items-center gap-1.5 cursor-pointer border border-dashed border-border rounded-md p-3 hover:bg-muted/30 text-xs text-muted-foreground text-center">
            <Upload className="w-5 h-5" />
            Upload File
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>

          {/* Cancel */}
          <button
            type="button"
            onClick={() => setShowOptions(false)}
            className="flex flex-col items-center gap-1.5 border border-dashed border-border rounded-md p-3 hover:bg-muted/30 text-xs text-muted-foreground"
          >
            <X className="w-5 h-5" />
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}