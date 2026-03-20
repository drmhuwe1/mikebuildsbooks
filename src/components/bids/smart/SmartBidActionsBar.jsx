import React from "react";
import { Save, Eye, Mail, FileCheck, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SmartBidActionsBar({
  onSave,
  onPreview,
  onCreateContract,
  isSaving,
  hasTitle,
  bidId,
}) {
  return (
    <div className="sticky bottom-0 left-0 right-0 z-10 bg-background border-t shadow-lg px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={isSaving || !hasTitle}
          className="gap-1.5"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Draft"}
        </Button>

        {bidId && (
          <Button
            variant="outline"
            size="sm"
            onClick={onPreview}
            className="gap-1.5"
          >
            <Eye className="w-4 h-4" />
            Preview Bid
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {bidId && (
          <Button
            size="sm"
            onClick={onCreateContract}
            className="gap-1.5 bg-green-600 hover:bg-green-700"
          >
            <FileCheck className="w-4 h-4" />
            Convert to Contract
          </Button>
        )}
      </div>
    </div>
  );
}