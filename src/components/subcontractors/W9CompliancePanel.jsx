import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, Download, RefreshCw, Upload } from "lucide-react";
import W9Wizard from "./W9Wizard";
import W9UploadModal from "./W9UploadModal";
import { formatDate } from "@/lib/formatters";

export default function W9CompliancePanel({ contractor }) {
  const [showWizard, setShowWizard] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const qc = useQueryClient();

  const updateW9Mutation = useMutation({
    mutationFn: (data) => base44.entities.Subcontractor.update(contractor.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subcontractors"] });
      setShowWizard(false);
    },
  });

  const handleDownloadBlankW9 = () => {
    window.open('https://www.irs.gov/pub/irs-pdf/fw9.pdf', '_blank');
  };

  const handleW9Complete = async (formData) => {
    await updateW9Mutation.mutate({
      w9_status: "received",
      w9_received: true,
      w9_date: new Date().toISOString().split('T')[0],
      w9_full_name: formData.w9_full_name,
      w9_business_name: formData.w9_business_name,
      w9_federal_classification: formData.w9_federal_classification,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
      ssn_or_ein: formData.ssn_or_ein,
      w9_signature: formData.signatureData,
      entity_type: formData.w9_federal_classification,
    });
  };

  const w9Status = contractor.w9_status || "not_collected";
  const isCompliant = w9Status === "received" && contractor.w9_date;
  const requires1099 = contractor.ytd_payments >= 600;

  const statusConfig = {
    not_collected: { label: "Not Collected", color: "bg-red-100 text-red-800", icon: "⚠" },
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: "⏳" },
    received: { label: "Received", color: "bg-green-100 text-green-800", icon: "✓" },
    expired: { label: "Expired", color: "bg-orange-100 text-orange-800", icon: "↻" },
  };

  const status = statusConfig[w9Status];

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card className={`p-4 border-2 ${isCompliant ? "border-green-200 bg-green-50" : w9Status === "not_collected" ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{status.icon}</span>
              <div>
                <p className="font-semibold text-sm">W-9 Status</p>
                <Badge className={`text-xs ${status.color}`}>{status.label}</Badge>
              </div>
            </div>

            {isCompliant && (
              <div className="text-xs text-green-700 mt-2">
                <p><strong>Signed:</strong> {formatDate(contractor.w9_date)}</p>
                <p><strong>Classification:</strong> {contractor.w9_federal_classification}</p>
                {contractor.w9_signature && <p className="text-green-600">✓ Digitally signed</p>}
              </div>
            )}

            {w9Status === "not_collected" && (
              <p className="text-xs text-red-700 mt-2">
                <strong>⚠ Required:</strong> A W-9 must be collected before issuing 1099 payments.
              </p>
            )}

            {requires1099 && (
              <div className="mt-3 p-2 rounded bg-orange-100 border border-orange-300">
                <p className="text-xs font-semibold text-orange-900 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> 1099-NEC Required
                </p>
                <p className="text-xs text-orange-800">YTD payments: ${contractor.ytd_payments || 0} (exceeds $600 threshold)</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        {w9Status !== "received" ? (
          <>
            <Button type="button" onClick={() => setShowWizard(true)} className="bg-blue-600 hover:bg-blue-700">
              <FileText className="w-4 h-4 mr-1" />
              {w9Status === "not_collected" ? "Collect W-9 Digitally" : "Update W-9"}
            </Button>
            <Button type="button" onClick={() => setShowUpload(true)} variant="outline">
              <Upload className="w-4 h-4 mr-1" />
              Upload W-9 (JPG/PDF)
            </Button>
            <Button type="button" onClick={handleDownloadBlankW9} variant="outline">
              <Download className="w-4 h-4 mr-1" />
              Download Blank IRS W-9
            </Button>
          </>
        ) : (
          <>
            <Button type="button" onClick={handleDownloadBlankW9} variant="outline">
              <Download className="w-4 h-4 mr-1" />
              Download Official IRS W-9
            </Button>
            <Button type="button" onClick={() => setShowWizard(true)} variant="outline">
              <RefreshCw className="w-4 h-4 mr-1" />
              Update W-9
            </Button>
            <Button type="button" onClick={() => setShowUpload(true)} variant="outline">
              <Upload className="w-4 h-4 mr-1" />
              Replace with Upload
            </Button>
          </>
        )}
      </div>

      {/* W-9 Wizard */}
      {showWizard && (
        <W9Wizard
          contractor={contractor}
          onClose={() => setShowWizard(false)}
          onComplete={handleW9Complete}
        />
      )}

      {/* W-9 Upload Modal */}
      {showUpload && (
        <W9UploadModal
          contractor={contractor}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}