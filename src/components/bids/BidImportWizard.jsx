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
        // Auto-create client if doesn't exist
        let clientId = bid.bidData.client_id;
        if (!clientId && bid.bidData.client_name) {
          const newClient = await base44.entities.Client.create({
            name: [bid.bidData.client_name, bid.bidData.client_last_name].filter(Boolean).join(" "),
            address: bid.bidData.project_address || "",
          });
          clientId = newClient.id;
        }

        // Create bid with client
        const createdBid = await base44.entities.Bid.create({
          ...bid.bidData,
          client_id: clientId,
        });
        savedBids.push(createdBid);

        // Auto-create job in "bidding" status
        if (createdBid) {
          await base44.entities.Job.create({
            title: bid.bidData.title || "New Project",
            client_id: clientId,
            client_name: bid.bidData.client_name,
            address: bid.bidData.project_address,
            scope: bid.bidData.scope_summary,
            status: "bidding",
            bid_id: createdBid.id,
          });

  

          // Auto-create draft proposal document
          await base44.entities.Document.create({
            title: `Proposal - ${bid.bidData.title}`,
            type: "proposal",
            bid_id: createdBid.id,
            client_id: clientId,
            notes: `Draft proposal from bid. Client: ${bid.bidData.client_name}. Amount: $${bid.bidData.bid_amount}`,
          });
        }
        
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
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
      
      // Support PDF, Word, and images
      const supportedExtensions = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.gif', '.tiff'];
      const isSupported = supportedExtensions.includes(fileExtension);

      if (!isSupported) {
        throw new Error('Unsupported file type. Please upload a PDF, Word document (.doc, .docx), or image file (JPG, PNG, GIF, TIFF).');
      }

      // Upload file
      const uploadResult = await base44.integrations.Core.UploadFile({ file });

      // For Word docs, extract text first
      const isWord = fileName.endsWith('.docx') || fileName.endsWith('.doc');
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
  "project_description": "CRITICAL: Any introductory description, project overview, or background information about the project (separate from scope of work)",
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
  "disclaimer": "Additional fees and charges disclaimer",
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
            disclaimer: { type: "string" },
            notes: { type: "string" },
            confidence_scores: { type: "object" },
          },
        },
      });

      const newBids = [
        ...bids,
        {
          fileName: file.name,
          fileUrl: uploadResult.file_url,
          extractedData: extractResult,
          editedData: extractResult,
        },
      ];
      
      setBids(newBids);
      
      // Auto-combine if 2+ bids are uploaded
      if (newBids.length >= 2) {
        setTimeout(() => handleCombineBidsAuto(newBids), 500);
      }
      
      setError(null);
      } catch (err) {
      setError(err.message || "Failed to extract data from document");
      } finally {
      setLoading(false);
      }
  };

  const handleCombineBidsAuto = async (bidsToMerge) => {
    setLoading(true);
    setError(null);
    try {
      const jobTotals = bidsToMerge.map((b, i) => ({
        jobNum: i + 1,
        project: b.editedData.project_name,
        total: b.editedData.bid_amount || 0,
      }));
      const combinedTotal = jobTotals.reduce((sum, j) => sum + j.total, 0);
      
      const bidSummaries = bidsToMerge.map((b, i) => 
        `JOB ${i + 1}: ${b.editedData.project_name}
Description: ${b.editedData.project_description}
Scope: ${b.editedData.scope_summary}
Materials: $${b.editedData.material_cost} - ${b.editedData.material_description}
Labor: ${b.editedData.labor_hours}h @ $${b.editedData.labor_rate}/hr = $${(b.editedData.labor_hours || 0) * (b.editedData.labor_rate || 0)}
Subcontractors: $${b.editedData.subcontractor_cost} - ${b.editedData.subcontractor_description}
Equipment: $${b.editedData.equipment_cost} - ${b.editedData.equipment_description}
Permits: $${b.editedData.permit_cost} - ${b.editedData.permit_description}
JOB ${i + 1} TOTAL: $${b.editedData.bid_amount}`
      ).join("\n\n");

      const jobTotalsSummary = jobTotals.map(j => `Job ${j.jobNum} (${j.project}): $${j.total}`).join(" | ");

      const combined = await base44.integrations.Core.InvokeLLM({
        prompt: `You are combining ${bidsToMerge.length} bid documents into ONE comprehensive bid proposal. CRITICAL: Include ALL details from BOTH documents. Separate costs/scope by job, show individual job totals, then show the combined total price.

${bidSummaries}

BREAKDOWN SUMMARY:
${jobTotalsSummary}
COMBINED TOTAL: $${combinedTotal}

Return ONLY valid JSON:
{
  "project_name": "Combined: [Job 1 name] + [Job 2 name]",
  "project_description": "JOB 1: [job 1 project description]. JOB 2: [job 2 project description].",
  "scope_summary": "JOB 1: [all job 1 scope items listed]. JOB 2: [all job 2 scope items listed].",
  "material_cost": sum of all material costs,
  "material_description": "Job 1: $[amount]. Job 2: $[amount].",
  "labor_hours": sum of all labor hours,
  "labor_rate": 45,
  "subcontractor_cost": sum of subcontractor costs,
  "subcontractor_description": "Job 1: $[amount]. Job 2: $[amount].",
  "equipment_cost": sum of equipment costs,
  "equipment_description": "Job 1: $[amount]. Job 2: $[amount].",
  "permit_cost": sum of permit costs,
  "permit_description": "Job 1: $[amount]. Job 2: $[amount].",
  "bid_amount": ${combinedTotal},
  "total_estimated_cost": ${combinedTotal},
  "included_in_bid": "Job 1 scope + Job 2 scope combined",
  "notes": "BREAKDOWN: ${jobTotalsSummary} | COMBINED TOTAL: $${combinedTotal}"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            project_name: { type: "string" },
            project_description: { type: "string" },
            scope_summary: { type: "string" },
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
            bid_amount: { type: "number" },
            total_estimated_cost: { type: "number" },
            included_in_bid: { type: "string" },
            exclusions: { type: "string" },
            notes: { type: "string" },
          },
        },
      });

      setBids([{
        fileName: `Combined-${bidsToMerge.length}Bids.json`,
        fileUrl: "",
        extractedData: combined,
        editedData: combined,
      }]);
      setCurrentIndex(0);
      setStep(1);
    } catch (err) {
      setError(err.message || "Failed to combine bids");
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
    const bidAmt = editedData.bid_amount || 0;
    const depositAmt = editedData.deposit_amount && editedData.deposit_amount > 0 
      ? editedData.deposit_amount 
      : (bidAmt * ((editedData.deposit_percent || 50) / 100));
    const remaining = bidAmt - depositAmt;
    const startConstAmt = editedData.start_of_construction_amount || (remaining > 0 ? remaining / 2 : 0);
    const finalPayAmt = editedData.final_payment_amount || (remaining > 0 ? remaining - startConstAmt : 0);

    return {
      title: editedData.project_name || "Imported Bid",
      client_name: editedData.client_name,
      client_last_name: editedData.client_last_name,
      project_address: editedData.project_address,
      project_description: editedData.project_description,
      scope_summary: editedData.scope_summary,
      included_in_bid: editedData.included_in_bid,
      material_responsibility: editedData.material_responsibility,
      material_cost: Math.max(0, editedData.material_cost || 0),
      material_description: editedData.material_description,
      labor_hours: Math.max(0, editedData.labor_hours || 0),
      labor_rate: Math.max(0, editedData.labor_rate || 0),
      subcontractor_cost: Math.max(0, editedData.subcontractor_cost || 0),
      subcontractor_description: editedData.subcontractor_description,
      equipment_cost: Math.max(0, editedData.equipment_cost || 0),
      equipment_description: editedData.equipment_description,
      permit_cost: Math.max(0, editedData.permit_cost || 0),
      permit_description: editedData.permit_description,
      contingency_percent: editedData.contingency_percent || 5,
      overhead_percent: editedData.overhead_percent || 10,
      total_estimated_cost: Math.max(0, editedData.total_estimated_cost || 0),
      bid_amount: Math.max(0, bidAmt),
      deposit_percent: editedData.deposit_percent || 50,
      deposit_amount: Math.max(0, depositAmt),
      start_of_construction_amount: Math.max(0, startConstAmt),
      final_payment_amount: Math.max(0, finalPayAmt),
      project_timeline: editedData.project_timeline,
      estimated_duration: editedData.estimated_duration,
      terms_and_conditions: editedData.terms_and_conditions,
      unforeseen_conditions: editedData.unforeseen_conditions,
      change_orders: editedData.change_orders,
      permits_inspections: editedData.permits_inspections,
      weather_delays: editedData.weather_delays,
      site_access: editedData.site_access,
      exclusions: editedData.exclusions,
      disclaimer: editedData.disclaimer,
      notes: editedData.notes,
      status: "draft",
    };
  };

  const handleCombineBids = async () => {
    if (bids.length < 2) return;
    
    setLoading(true);
    setError(null);
    try {
      const jobTotals = bids.map((b, i) => ({
        jobNum: i + 1,
        project: b.editedData.project_name,
        total: b.editedData.bid_amount || 0,
      }));
      const combinedTotal = jobTotals.reduce((sum, j) => sum + j.total, 0);
      
      const bidSummaries = bids.map((b, i) => 
        `JOB ${i + 1}: ${b.editedData.project_name}
Scope: ${b.editedData.scope_summary}
Materials: $${b.editedData.material_cost} - ${b.editedData.material_description}
Labor: ${b.editedData.labor_hours}h @ $${b.editedData.labor_rate}/hr = $${(b.editedData.labor_hours || 0) * (b.editedData.labor_rate || 0)}
Subcontractors: $${b.editedData.subcontractor_cost} - ${b.editedData.subcontractor_description}
Equipment: $${b.editedData.equipment_cost} - ${b.editedData.equipment_description}
Permits: $${b.editedData.permit_cost} - ${b.editedData.permit_description}
JOB ${i + 1} TOTAL: $${b.editedData.bid_amount}`
      ).join("\n\n");

      const jobTotalsSummary = jobTotals.map(j => `Job ${j.jobNum} (${j.project}): $${j.total}`).join(" | ");

      const combined = await base44.integrations.Core.InvokeLLM({
        prompt: `You are combining ${bids.length} bid documents into ONE comprehensive bid proposal. CRITICAL: Include ALL details from BOTH documents. Separate costs/scope by job, show individual job totals, then show the combined total price.

${bidSummaries}

BREAKDOWN SUMMARY:
${jobTotalsSummary}
COMBINED TOTAL: $${combinedTotal}

Return ONLY valid JSON:
{
  "project_name": "Combined: [Job 1 name] + [Job 2 name]",
  "scope_summary": "JOB 1: [all job 1 scope items listed]. JOB 2: [all job 2 scope items listed].",
  "material_cost": sum of all material costs,
  "material_description": "Job 1: $[amount]. Job 2: $[amount].",
  "labor_hours": sum of all labor hours,
  "labor_rate": 45,
  "subcontractor_cost": sum of subcontractor costs,
  "subcontractor_description": "Job 1: $[amount]. Job 2: $[amount].",
  "equipment_cost": sum of equipment costs,
  "equipment_description": "Job 1: $[amount]. Job 2: $[amount].",
  "permit_cost": sum of permit costs,
  "permit_description": "Job 1: $[amount]. Job 2: $[amount].",
  "bid_amount": ${combinedTotal},
  "total_estimated_cost": ${combinedTotal},
  "included_in_bid": "Job 1 scope + Job 2 scope combined",
  "notes": "BREAKDOWN: ${jobTotalsSummary} | COMBINED TOTAL: $${combinedTotal}"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            project_name: { type: "string" },
            scope_summary: { type: "string" },
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
            bid_amount: { type: "number" },
            total_estimated_cost: { type: "number" },
            included_in_bid: { type: "string" },
            exclusions: { type: "string" },
            notes: { type: "string" },
          },
        },
      });

      const firstBid = bids[0];
      setBids([{
        fileName: `Combined-${bids.length}Bids.json`,
        fileUrl: "",
        extractedData: combined,
        editedData: combined,
      }]);
      setStep(2);
      setCurrentIndex(0);
    } catch (err) {
      setError(err.message || "Failed to combine bids");
    } finally {
      setLoading(false);
    }
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

            {/* Branded loading placeholder when a step has no content yet */}
            {((step === 1 && currentIndex === null) || (step === 2 && currentIndex === null)) && (
              <div className="flex flex-col items-center justify-center h-48 gap-4 text-center">
                <img
                  src="https://media.base44.com/images/public/69b9774720c1d890b1162f57/17e5112da_MikeBuildsBooksLogo.png"
                  alt="MikeBuildsBooks"
                  className="h-20 object-contain opacity-90"
                />
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {step === 1 ? "Preparing your bid review…" : "Building your contract summary…"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step === 1 ? "Strong Builds. Stronger Books." : "Almost there — your bid is ready to finalize."}
                  </p>
                </div>
              </div>
            )}
            {/* Step 0: Upload */}
            {step === 0 && (
              <div className="space-y-4">
                {bids.length > 0 && (
                   <div className="space-y-2">
                     <div className="flex items-center justify-between">
                       <p className="text-sm font-semibold">{bids.length} document(s) loaded</p>
                       {bids[0]?.fileName?.includes("Combined") && (
                         <span className="text-xs text-green-600 font-medium">✓ Combined</span>
                       )}
                     </div>
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
               const isCombined = bid.project_name?.includes("Combined") || bids.length === 1 && bids[0].fileName?.includes("Combined");
               const directCosts = (bid.material_cost || 0) + (bid.labor_hours || 0) * (bid.labor_rate || 0) + (bid.subcontractor_cost || 0) + (bid.equipment_cost || 0) + (bid.permit_cost || 0);
               const overhead = directCosts * ((bid.overhead_percent || 10) / 100);
               const contingency = directCosts * ((bid.contingency_percent || 5) / 100);
               return (
                 <div className="space-y-4">
                   <div className="flex items-center justify-between mb-4">
                     <div>
                       <h3 className="font-semibold">{bid.client_name || "Unknown Client"}</h3>
                       <p className="text-sm text-muted-foreground">{bid.project_name || "Untitled Project"}</p>
                       {isCombined && <p className="text-xs text-green-600 mt-1">✓ Combined Bid ({bids.length} jobs merged)</p>}
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
                          <div className="text-sm space-y-1.5 whitespace-pre-wrap">
                            {bid.scope_summary}
                          </div>
                        </div>
                      )}

                     {bid.material_description && bid.scope_summary?.includes("JOB") && (
                       <div className="border-t pt-4">
                         <p className="text-xs text-muted-foreground mb-2">Materials Breakdown</p>
                         <div className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded">{bid.material_description}</div>
                       </div>
                     )}

                     {bid.subcontractor_description && bid.scope_summary?.includes("JOB") && (
                       <div className="border-t pt-4">
                         <p className="text-xs text-muted-foreground mb-2">Subcontractor Work</p>
                         <div className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded">{bid.subcontractor_description}</div>
                       </div>
                     )}

                     {bid.notes && (
                       <div className="border-t pt-4">
                         <p className="text-xs text-muted-foreground mb-2">Summary</p>
                         <div className="text-sm whitespace-pre-wrap bg-blue-50 p-3 rounded border border-blue-200">{bid.notes}</div>
                       </div>
                     )}

                     {bid.exclusions && (
                       <div className="border-t pt-4">
                         <p className="text-xs text-muted-foreground mb-2">Exclusions</p>
                         <div className="text-sm text-red-600 whitespace-pre-wrap">{bid.exclusions}</div>
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
                  <div className="space-y-3">
                    {bids.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No bids to review</p>
                    ) : (
                      bids.map((bid, idx) => {
                        const client = bid.editedData.client_name || "Unknown";
                        const project = bid.editedData.project_name || "Untitled";
                        const bidAmount = bid.editedData.bid_amount || 0;
                        const isCombined = bid.editedData.project_name?.includes("Combined");
                        return (
                          <Card key={idx} className="p-4 hover:bg-muted/50 cursor-pointer" onClick={() => {
                            setCurrentIndex(idx);
                            setStep(2);
                          }}>
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <p className="font-semibold text-sm">{project}</p>
                                <p className="text-xs text-muted-foreground">{client}</p>
                                {isCombined && <p className="text-xs text-green-600 mt-1">✓ Combined Bid</p>}
                              </div>
                              <p className="font-bold text-base text-primary">{formatCurrency(bidAmount)}</p>
                            </div>
                            {bid.editedData.scope_summary && (
                              <div className="border-t pt-3">
                                <p className="text-xs text-muted-foreground mb-2">Scope Preview</p>
                                <p className="text-xs line-clamp-2">{bid.editedData.scope_summary.substring(0, 150)}...</p>
                              </div>
                            )}
                          </Card>
                        );
                      })
                    )}
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
                  // If on a preview that came from edit, go back to edit; otherwise go to upload
                  if (currentIndex !== null && bids.length > 1) {
                    setStep(1);
                  } else {
                    setCurrentIndex(null);
                    setStep(0);
                  }
                } else if (step === 3) {
                  setCurrentIndex(null);
                  setStep(0);
                } else if (step === 0) {
                  onClose();
                } else {
                  setStep(s => s - 1);
                }
              }}
              disabled={loading}
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
                disabled={(step === 0 && bids.length === 0) || loading}
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