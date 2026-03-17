import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Upload, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import BidImportUpload from "./BidImportUpload";
import BidImportReview from "./BidImportReview";
import { useMutation } from "@tanstack/react-query";

const STEPS = ["Upload", "Extract", "Review", "Complete"];

export default function BidImportWizard({ open, onClose, onBidCreated }) {
  const [step, setStep] = useState(0);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editedData, setEditedData] = useState(null);

  const saveBidMutation = useMutation({
    mutationFn: (bidData) => base44.entities.Bid.create(bidData),
    onSuccess: (bid) => {
      if (fileUrl) {
        base44.entities.Document.create({
          title: `Imported: ${fileName}`,
          type: "bid",
          file_url: fileUrl,
          bid_id: bid.id,
          notes: "Imported via AI document reading",
        });
      }
      onBidCreated?.(bid);
      setStep(3);
    },
  });

  const handleFileUpload = async (file) => {
    setLoading(true);
    setError(null);
    try {
      // Check file type
      const isImage = ['image/jpeg', 'image/png', 'image/gif', 'image/tiff'].includes(file.type);
      const isPdf = file.type === 'application/pdf';
      const isWord = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'].includes(file.type);

      if (!isImage && !isPdf && !isWord) {
        throw new Error('Unsupported file type. Please upload a PDF, Word document, or image file.');
      }

      // Upload file
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(uploadResult.file_url);
      setFileName(file.name);

      // For Word docs, extract text first
      let fileUrlsForAI = [uploadResult.file_url];
      if (isWord) {
        try {
          const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
            file_url: uploadResult.file_url,
            json_schema: {
              type: "object",
              properties: {
                text_content: { type: "string" }
              }
            }
          });
          // For Word docs, we'll pass the file URL and let the AI handle it
        } catch (e) {
          // If extraction fails, just use the file URL
        }
      }

      // Extract text via AI
      const extractResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a construction bid document analyzer. Extract ALL information from this bid document. Return ONLY a JSON object with these exact keys (use empty string or null for missing values):

{
  "project_name": "Grammatically correct, properly capitalized project title",
  "client_name": "Client/customer name",
  "project_address": "Project site address",
  "project_description": "Overall project description/summary",
  "scope_summary": "CRITICAL: Complete detailed scope of work with all work items, deliverables, and specifications",
  "included_in_bid": "What is included in the bid (e.g., labor, materials, permits, disposal)",
  "material_responsibility": "Details about material responsibility (who supplies what)",
  "material_cost": 0,
  "material_description": "Detailed description of materials being used",
  "labor_hours": 0,
  "labor_rate": 0,
  "subcontractor_cost": 0,
  "subcontractor_description": "Details about subcontractor work/scope",
  "equipment_cost": 0,
  "equipment_description": "Detailed description of equipment and rentals",
  "permit_cost": 0,
  "permit_description": "Details about permits and inspections",
  "contingency_percent": 0,
  "overhead_percent": 0,
  "total_estimated_cost": 0,
  "bid_amount": 0,
  "deposit_percent": 50,
  "deposit_amount": 0,
  "start_of_construction_amount": 0,
  "final_payment_amount": 0,
  "project_timeline": "Estimated project duration",
  "estimated_duration": "Duration (e.g., 2-3 weeks)",
  "terms_and_conditions": "Full terms and conditions section",
  "unforeseen_conditions": "Policy for unforeseen conditions",
  "change_orders": "Change order policy",
  "permits_inspections": "Permit and inspection terms",
  "weather_delays": "Weather delay policy",
  "site_access": "Site access requirements",
  "exclusions": "Items specifically NOT included",
  "notes": "Additional notes or disclaimers",
  "confidence_scores": {
    "client_name": 0.95,
    "project_name": 0.95,
    "bid_amount": 0.95,
    "scope_summary": 0.95
  }
}

IMPORTANT NOTES:
- Properly capitalize and format the project_name with correct grammar, punctuation, and capitalization.
- In the scope_summary, clearly organize scope items by category with bullet points.
- Extract FULL payment schedule details and populate deposit_amount, start_of_construction_amount, and final_payment_amount.
- Ensure "exclusions" contains what is NOT included and "notes" contains additional disclaimers/information.
- Extract all Terms & Conditions section items including Unforeseen Conditions, Change Orders, Permits & Inspections, Weather Delays, and Site Access.`,
        file_urls: fileUrlsForAI,
        response_json_schema: {
          type: "object",
          properties: {
            project_name: { type: "string" },
            client_name: { type: "string" },
            project_address: { type: "string" },
            project_description: { type: "string" },
            scope_summary: { type: "string" },
            included_in_bid: { type: "string" },
            material_responsibility: { type: "string" },
            material_cost: { type: "number" },
            material_description: { type: "string" },
            labor_hours: { type: "number" },
            labor_rate: { type: "number" },
            subcontractor_cost: { type: "number" },
            subcontractor_description: { type: "string" },
            equipment_cost: { type: "number" },
            equipment_description: { type: "string" },
            permit_cost: { type: "number" },
            permit_description: { type: "string" },
            contingency_percent: { type: "number" },
            overhead_percent: { type: "number" },
            total_estimated_cost: { type: "number" },
            bid_amount: { type: "number" },
            deposit_percent: { type: "number" },
            deposit_amount: { type: "number" },
            start_of_construction_amount: { type: "number" },
            final_payment_amount: { type: "number" },
            project_timeline: { type: "string" },
            estimated_duration: { type: "string" },
            terms_and_conditions: { type: "string" },
            unforeseen_conditions: { type: "string" },
            change_orders: { type: "string" },
            permits_inspections: { type: "string" },
            weather_delays: { type: "string" },
            site_access: { type: "string" },
            exclusions: { type: "string" },
            notes: { type: "string" },
            confidence_scores: { type: "object" },
          },
        },
      });

      setExtractedData(extractResult);
      setEditedData(extractResult);
      setStep(2);
      } catch (err) {
      setError(err.message || "Failed to extract data from document");
      } finally {
      setLoading(false);
      }
  };

  const handleSaveBid = () => {
    const depositAmt = editedData.deposit_amount || (editedData.bid_amount * ((editedData.deposit_percent || 50) / 100));
    const remaining = (editedData.bid_amount || 0) - depositAmt;
    const startConstAmt = editedData.start_of_construction_amount || (remaining / 2);
    const finalPayAmt = editedData.final_payment_amount || (remaining - startConstAmt);

    saveBidMutation.mutate({
      title: editedData.project_name || "Imported Bid",
      client_name: editedData.client_name,
      project_address: editedData.project_address,
      project_description: editedData.project_description,
      scope_summary: editedData.scope_summary,
      included_in_bid: editedData.included_in_bid,
      material_responsibility: editedData.material_responsibility,
      material_cost: editedData.material_cost || 0,
      material_description: editedData.material_description,
      labor_hours: editedData.labor_hours || 0,
      labor_rate: editedData.labor_rate || 0,
      subcontractor_cost: editedData.subcontractor_cost || 0,
      subcontractor_description: editedData.subcontractor_description,
      equipment_cost: editedData.equipment_cost || 0,
      equipment_description: editedData.equipment_description,
      permit_cost: editedData.permit_cost || 0,
      permit_description: editedData.permit_description,
      contingency_percent: editedData.contingency_percent || 5,
      overhead_percent: editedData.overhead_percent || 10,
      total_estimated_cost: editedData.total_estimated_cost || 0,
      bid_amount: editedData.bid_amount || 0,
      deposit_percent: editedData.deposit_percent || 50,
      deposit_amount: depositAmt,
      start_of_construction_amount: startConstAmt,
      final_payment_amount: finalPayAmt,
      project_timeline: editedData.project_timeline,
      estimated_duration: editedData.estimated_duration,
      terms_and_conditions: editedData.terms_and_conditions,
      unforeseen_conditions: editedData.unforeseen_conditions,
      change_orders: editedData.change_orders,
      permits_inspections: editedData.permits_inspections,
      weather_delays: editedData.weather_delays,
      site_access: editedData.site_access,
      exclusions: editedData.exclusions,
      notes: editedData.notes,
      status: "draft",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Bid Document — Step {step + 1} of {STEPS.length}</DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {/* Content */}
        <div className="py-4 min-h-64">
          {step === 0 && (
            <BidImportUpload onUpload={handleFileUpload} loading={loading} error={error} fileName={fileName} />
          )}

          {step === 1 && loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Analyzing document with AI...</p>
            </div>
          )}

          {(step === 1 || step === 2) && !loading && extractedData && (
            <BidImportReview data={editedData} onChange={setEditedData} original={extractedData} fileName={fileName} />
          )}

          {step === 3 && (
            <div className="text-center space-y-4 py-12">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="font-semibold text-lg">Bid Imported Successfully!</p>
              <p className="text-sm text-muted-foreground">Your bid "{editedData.project_name}" has been created and is ready to edit.</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => (step === 0 ? onClose() : setStep(s => s - 1))}>
            <ChevronLeft className="w-4 h-4 mr-1" /> {step === 0 ? "Cancel" : "Back"}
          </Button>

          {step < 3 && (
            <Button
              onClick={() => {
                if (step === 2) {
                  handleSaveBid();
                } else if (step === 0) {
                  setStep(1);
                }
              }}
              disabled={loading || saveBidMutation.isPending}
            >
              {saveBidMutation.isPending ? "Saving..." : step === 2 ? "Create Bid" : "Next"}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}

          {step === 3 && (
            <Button onClick={onClose}>Done</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}