import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, X, CheckCircle, Printer, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function SignedContractManager({ entityId, entityType, signedImages = [], onUpdate, isSignedAndAccepted = false }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [localImages, setLocalImages] = useState(signedImages);

  const images = localImages;

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      const newImages = [...(localImages || []), response.file_url];
      
      await base44.entities[entityType].update(entityId, {
        signed_contract_images: newImages
      });
      
      setLocalImages(newImages);
      onUpdate?.(newImages);
    } catch (error) {
      alert("Upload failed: " + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = async (index) => {
    const newImages = localImages.filter((_, i) => i !== index);
    await base44.entities[entityType].update(entityId, {
      signed_contract_images: newImages
    });
    setLocalImages(newImages);
    onUpdate?.(newImages);
  };

  const handlePrint = (url) => {
    const win = window.open("", "_blank");
    win.document.write(`<html><body style="margin:0"><img src="${url}" style="width:100%;max-width:100%" onload="window.print();window.close()" /></body></html>`);
    win.document.close();
  };

  const markAsSignedAccepted = async () => {
    await base44.entities[entityType].update(entityId, {
      signed_and_accepted: true
    });
    onUpdate?.();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">Signed Contract Documentation</p>
          <p className="text-xs text-muted-foreground">Upload photos of physically signed contracts</p>
        </div>
        {isSignedAndAccepted && (
          <Badge className="bg-green-600 text-white flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Signed & Accepted
          </Badge>
        )}
      </div>

      {/* Upload Button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        variant="outline"
        size="sm"
        className="w-full gap-2"
      >
        <Upload className="w-4 h-4" />
        {uploading ? "Uploading..." : "Upload Contract Photo"}
      </Button>

      {/* Uploaded Images */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Uploaded Photos ({images.length}) — tap to view full size</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {images.map((url, idx) => (
              <div key={idx} className="relative group">
                <div
                  className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary transition-all"
                  onClick={() => setPreviewImage(url)}
                >
                  <img src={url} alt={`Contract ${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handlePrint(url)}
                  className="absolute bottom-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Print"
                >
                  <Printer className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mark as Signed */}
      {!isSignedAndAccepted && (
        <Button
          onClick={markAsSignedAccepted}
          className="w-full bg-green-600 hover:bg-green-700 gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Mark as Accepted & Signed
        </Button>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Contract Photo</DialogTitle></DialogHeader>
            <img src={previewImage} alt="Contract preview" className="w-full h-auto rounded-lg" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}