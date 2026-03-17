import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Upload, Loader2, AlertCircle, CheckCircle, X, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import BidImportUpload from "./BidImportUpload";
import BidImportReview from "./BidImportReview";
import { useMutation } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/formatters";

const STEPS = ["Upload", "Review", "Complete"];

export default function BidImportWizard({ open, onClose, onBidCreated }) {
  const [step, setStep] = useState(0);
  const [bids, setBids] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveBidsMutation = useMutation({
    mutationFn: async (bidsToSave) => {
      const savedBids = [];
      for (const bid of bidsToSave) {
        const createdBid = await base44.entities.Bid.create(bid.bidData);
        savedBids.push(createdBid);
        
        if (bid.fileUrl) {
          await base44.entities.Document.create({
            title: `Imported: ${bid.fileName}`,
            type: "bid",
            file_url: bid.fileUrl,
            bid_id: createdBid.id,
            notes: `Imported via AI. Client: ${bid.bidData.client_name}. Project: ${bid.bidData.title}`,
          });
        }
      }
      return savedBids;
    },
    onSuccess: (savedBids) => {
      savedBids.forEach(bid => onBidCreated?.(bid));
      setStep(2);
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
  "client_name": "Client/customer first name",
  "client_last_name": "Client/customer last name",
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
            client_last_name: { type: "string" },
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

      setBids([
        ...bids,
        {
          fileName: file.name,
          fileUrl: uploadResult.file_url,
          extractedData: extractResult,
          editedData: extractResult,
        },
      ]);
      setError(null);
      } catch (err) {
      setError(err.message || "Failed to extract data from document");
      } finally {
      setLoading(false);
      }
  };

  const handleRemoveBid = (index) => {
    setBids(bids.filter((_, i) => i !== index));
  };

  const handleEditBid = (index) => {
    setCurrentIndex(index);
    setStep(1);
  };

  const handleUpdateBidData = (editedData) => {
    const updated = [...bids];
    updated[currentIndex].editedData = editedData;
    setBids(updated);
  };

  const formatBidData = (editedData) => {
    const depositAmt = editedData.deposit_amount || (editedData.bid_amount * ((editedData.deposit_percent || 50) / 100));
    const remaining = (editedData.bid_amount || 0) - depositAmt;
    const startConstAmt = editedData.start_of_construction_amount || (remaining / 2);
    const finalPayAmt = editedData.final_payment_amount || (remaining - startConstAmt);

    return {
      title: editedData.project_name || "Imported Bid",
      client_name: editedData.client_name,
      client_last_name: editedData.client_last_name,
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
    };
  };

  const handleSaveAllBids = () => {
    const bidsToSave = bids.map(bid => ({
      fileUrl: bid.fileUrl,
      fileName: bid.fileName,
      bidData: formatBidData(bid.editedData),
    }));
    saveBidsMutation.mutate(bidsToSave);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${step === 2 ? "max-w-3xl max-h-[90vh]" : "max-w-2xl max-h-[85vh]"} overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>Import Bid Documents — Step {step + 1} of {STEPS.length}</DialogTitle>
          </DialogHeader>

          {/* Progress */}
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>

          {/* Content */}
          <div className="py-4 min-h-64">
            {/* Step 0: Upload */}
            {step === 0 && (
              <div className="space-y-4">
                {bids.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">{bids.length} document(s) loaded</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {bids.map((bid, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                          <div className="text-sm">
                            <p className="font-medium">{bid.fileName}</p>
                            <p className="text-xs text-muted-foreground">{bid.editedData.client_name || "Unknown Client"} — {bid.editedData.project_name || "Untitled"}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleEditBid(idx)}>Edit</Button>
                            <Button size="sm" variant="ghost" onClick={() => handleRemoveBid(idx)}><X className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <BidImportUpload onUpload={handleFileUpload} loading={loading} error={error} fileName={null} />
              </div>
            )}

            {/* Step 1: Edit Individual Bid */}
            {step === 1 && currentIndex !== null && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <p className="font-semibold">{bids[currentIndex].fileName}</p>
                    <p className="text-xs text-muted-foreground">Editing {currentIndex + 1} of {bids.length}</p>
                  </div>
                </div>
                <BidImportReview 
                  data={bids[currentIndex].editedData} 
                  onChange={handleUpdateBidData} 
                  original={bids[currentIndex].extractedData} 
                  fileName={bids[currentIndex].fileName} 
                />
              </div>
            )}

            {/* Step 2: Preview Individual Bid */}
            {step === 2 && currentIndex !== null && (() => {
              const bid = bids[currentIndex].editedData;
              const directCosts = (bid.material_cost || 0) + (bid.labor_hours || 0) * (bid.labor_rate || 0) + (bid.subcontractor_cost || 0) + (bid.equipment_cost || 0) + (bid.permit_cost || 0);
              const overhead = directCosts * ((bid.overhead_percent || 10) / 100);
              const contingency = directCosts * ((bid.contingency_percent || 5) / 100);
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{bid.client_name || "Unknown Client"}</h3>
                      <p className="text-sm text-muted-foreground">{bid.project_name || "Untitled Project"}</p>
                      <p className="text-xs text-muted-foreground mt-1">Preview {currentIndex + 1} of {bids.length}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditBid(currentIndex)}
                    >
                      Edit This Bid
                    </Button>
                  </div>

                  <Card className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Client Name</p>
                        <p className="font-medium">{bid.client_name || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Project Title</p>
                        <p className="font-medium">{bid.project_name || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Material Cost</p>
                        <p className="font-medium">{formatCurrency(bid.material_cost || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Labor Cost</p>
                        <p className="font-medium">{formatCurrency((bid.labor_hours || 0) * (bid.labor_rate || 0))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Subcontractor Cost</p>
                        <p className="font-medium">{formatCurrency(bid.subcontractor_cost || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Equipment & Permits</p>
                        <p className="font-medium">{formatCurrency((bid.equipment_cost || 0) + (bid.permit_cost || 0))}</p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Overhead ({bid.overhead_percent || 10}%)</span>
                          <span>{formatCurrency(overhead)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Contingency ({bid.contingency_percent || 5}%)</span>
                          <span>{formatCurrency(contingency)}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-2 text-base">
                          <span>Total Bid Amount</span>
                          <span className="text-primary">{formatCurrency(bid.bid_amount || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {bid.scope_summary && (
                       <div className="border-t pt-4">
                         <p className="text-xs text-muted-foreground mb-2">Scope of Work</p>
                         <div className="text-sm space-y-1.5">
                           {bid.scope_summary.split(/[\n•\-*]/).filter(l => l.trim()).map((item, idx) => (
                             <div key={idx} className="flex gap-2">
                               <span className="text-primary font-semibold shrink-0">•</span>
                               <span>{item.trim()}</span>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                  </Card>
                </div>
              );
            })()}

            {/* Step 3: Review & Totals */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Import Summary — {bids.length} Document(s)</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {bids.map((bid, idx) => {
                      const client = bid.editedData.client_name || "Unknown";
                      const project = bid.editedData.project_name || "Untitled";
                      const bidAmount = bid.editedData.bid_amount || 0;
                      return (
                        <Card key={idx} className="p-3 hover:bg-muted/50 cursor-pointer" onClick={() => {
                          setCurrentIndex(idx);
                          setStep(2);
                        }}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-sm">{project}</p>
                              <p className="text-xs text-muted-foreground">{client}</p>
                            </div>
                            <p className="font-semibold text-sm">{formatCurrency(bidAmount)}</p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Totals */}
                <Card className="p-4 bg-primary/5 border-primary/20">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Combined Total ({bids.length} bids):</span>
                      <span className="font-bold text-lg">{formatCurrency(bids.reduce((sum, b) => sum + (b.editedData.bid_amount || 0), 0))}</span>
                    </div>
                  </div>
                </Card>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    ✓ All documents will be saved and archived by customer and project name for easy reference. Click any bid to review details before creating.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                if (step === 1) {
                  setCurrentIndex(null);
                  setStep(0);
                } else if (step === 2) {
                  setCurrentIndex(null);
                  setStep(1);
                } else if (step === 3) {
                  setStep(2);
                } else if (step === 0) {
                  onClose();
                } else {
                  setStep(s => s - 1);
                }
              }}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> {step === 0 ? "Cancel" : "Back"}
            </Button>

            {step < 3 && (
              <Button
                onClick={() => {
                  if (step === 0 && bids.length > 0) {
                    setCurrentIndex(0);
                    setStep(1);
                  } else if (step === 1) {
                    setCurrentIndex(0);
                    setStep(2);
                  } else if (step === 2) {
                    if (currentIndex !== null && currentIndex < bids.length - 1) {
                      setCurrentIndex(currentIndex + 1);
                    } else {
                      setCurrentIndex(null);
                      setStep(3);
                    }
                  }
                }}
                disabled={step === 0 && bids.length === 0}
              >
                {step === 2 ? currentIndex !== null && currentIndex < bids.length - 1 ? `Next Bid (${currentIndex + 2}/${bids.length})` : "Review Summary" : "Continue"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}

            {step === 3 && (
              <Button
                onClick={handleSaveAllBids}
                disabled={saveBidsMutation.isPending}
              >
                {saveBidsMutation.isPending ? "Creating Bids..." : `Create ${bids.length} Bid(s)`}
                <CheckCircle className="w-4 h-4 ml-1" />
              </Button>
            )}

            {saveBidsMutation.isSuccess && (
              <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
                Done
              </Button>
            )}
          </div>
      </DialogContent>
    </Dialog>
  );
}