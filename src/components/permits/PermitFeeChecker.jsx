import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader, AlertTriangle, DollarSign, ExternalLink, CheckCircle } from "lucide-react";

export default function PermitFeeChecker({ open, onClose, permitData, onFeesDetected }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fees, setFees] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    address: permitData?.projectAddress || "",
    zipCode: "",
    municipality: permitData?.municipality || "",
    county: "",
    projectType: permitData?.projectType || "deck",
    estimatedValue: "",
    description: "",
  });

  const TOTAL_STEPS = 3;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateInputs = () => {
    if (!formData.address.trim()) return "Please enter the project address";
    if (!formData.zipCode.trim()) return "Please enter the ZIP code";
    if (!formData.municipality.trim()) return "Please enter the municipality/city";
    if (!formData.county.trim()) return "Please enter the county";
    return null;
  };

  const handleNext = () => {
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep(2);
  };

  const handleSearchFees = async () => {
    setStep(3);
    setLoading(true);
    setError(null);

    try {
      const prompt = `You are a construction permit fee expert. Research official permit fee schedules for the following project:

Project Details:
- Type: ${formData.projectType}
- Address: ${formData.address}, ${formData.municipality}, ${formData.county}, ${formData.zipCode}
- Estimated Project Value: ${formData.estimatedValue ? "$" + formData.estimatedValue : "Not specified"}
- Description: ${formData.description || "Standard construction"}

Your task:
1. Search OFFICIAL government sources (building department, zoning boards, county clerk websites)
2. Find permit-related fee schedules and cost lists
3. Identify all applicable fees including:
   - Permit Application Fees
   - Building Permit Fees
   - Zoning Permit Fees
   - Zoning Variance Fees
   - Inspection Fees
   - Review Fees
   - Filing Fees
   - Plan Review Fees
   - Deck-specific Permit Fees (if applicable)
   - Roof-specific Permit Fees (if applicable)

Return a structured fee report with:
- Fee Name: (exact name from official source)
- Estimated Amount: (dollar amount if available)
- Fee Type: (fixed/percentage/range/value-based)
- Description: (what triggers this fee)
- Depends On: (project value, square footage, etc if applicable)
- Confidence: (high/medium/low)
- Source: (exact government office/department)
- Notes: (any special conditions or requirements)

IMPORTANT: Only report fees from official government sources. If information is not available, mark confidence as "low" and note that final amounts should be confirmed with the building department.

Format as a clear list with each fee clearly separated.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        model: "gemini_3_pro",
      });

      const parsedFees = parseFeeData(response);
      setFees({
        raw: response,
        parsed: parsedFees,
      });
    } catch (err) {
      setError(`Error fetching permit fees: ${err.message}`);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const parseFeeData = (text) => {
    const lines = text.split("\n");
    const feeList = [];
    let currentFee = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed.match(/^-?\s*Fee Name:|^-?\s*\d+\./)) {
        if (currentFee && currentFee.name) {
          feeList.push(currentFee);
        }
        currentFee = {
          name: "",
          amount: 0,
          type: "fixed",
          description: "",
          dependsOn: "",
          confidence: "medium",
          source: "",
          notes: "",
        };
      }

      if (currentFee) {
        if (trimmed.includes("Fee Name:") || trimmed.match(/^\d+\./)) {
          currentFee.name = trimmed.replace(/^-?\s*Fee Name:\s*/i, "").replace(/^\d+\.\s*/, "").trim();
        } else if (trimmed.includes("Estimated Amount:") || trimmed.includes("Amount:")) {
          const match = trimmed.match(/\$?([\d,]+\.?\d*)/);
          currentFee.amount = match ? parseFloat(match[1].replace(/,/g, "")) : 0;
        } else if (trimmed.includes("Fee Type:")) {
          const type = trimmed.split(":")[1]?.trim().toLowerCase() || "fixed";
          currentFee.type = type;
        } else if (trimmed.includes("Description:")) {
          currentFee.description = trimmed.split(":")[1]?.trim() || "";
        } else if (trimmed.includes("Depends On:")) {
          currentFee.dependsOn = trimmed.split(":")[1]?.trim() || "";
        } else if (trimmed.includes("Confidence:")) {
          currentFee.confidence = trimmed.split(":")[1]?.trim().toLowerCase() || "medium";
        } else if (trimmed.includes("Source:")) {
          currentFee.source = trimmed.split(":")[1]?.trim() || "";
        } else if (trimmed.includes("Notes:")) {
          currentFee.notes = trimmed.split(":")[1]?.trim() || "";
        }
      }
    });

    if (currentFee && currentFee.name) {
      feeList.push(currentFee);
    }

    return feeList.filter(f => f.name);
  };

  const handleAddFees = () => {
    if (onFeesDetected) {
      onFeesDetected({
        fees: fees.parsed,
        formData,
      });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Permit Fees Intelligence</DialogTitle>
            <span className="text-xs text-muted-foreground font-normal">Step {step} of {TOTAL_STEPS}</span>
          </div>
        </DialogHeader>

        {/* Step 1: Input */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-900 mb-1">STEP 1: PROJECT DETAILS</p>
              <p className="text-xs text-blue-800">We'll search official government sources for permit-related fees in your area.</p>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Project Address *</Label>
                <Input value={formData.address} onChange={e => handleInputChange("address", e.target.value)} placeholder="123 Main Street" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>ZIP Code *</Label>
                  <Input value={formData.zipCode} onChange={e => handleInputChange("zipCode", e.target.value)} placeholder="12345" />
                </div>
                <div>
                  <Label>Municipality/City *</Label>
                  <Input value={formData.municipality} onChange={e => handleInputChange("municipality", e.target.value)} placeholder="Springfield" />
                </div>
              </div>

              <div>
                <Label>County *</Label>
                <Input value={formData.county} onChange={e => handleInputChange("county", e.target.value)} placeholder="Sangamon County" />
              </div>

              <div>
                <Label>Project Type</Label>
                <Select value={formData.projectType} onValueChange={v => handleInputChange("projectType", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deck">Deck</SelectItem>
                    <SelectItem value="roof">Roof</SelectItem>
                    <SelectItem value="porch-roof">Porch Roof</SelectItem>
                    <SelectItem value="roof-over-deck">Roof Over Deck</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Estimated Project Value (optional)</Label>
                <Input type="number" value={formData.estimatedValue} onChange={e => handleInputChange("estimatedValue", e.target.value)} placeholder="e.g. 25000" />
              </div>

              <div>
                <Label>Description (optional)</Label>
                <Textarea value={formData.description} onChange={e => handleInputChange("description", e.target.value)} placeholder="e.g., 12x16 deck with stairs" rows={2} />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                <Button className="flex-1" onClick={handleNext}>Next →</Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-900 mb-1">STEP 2: REVIEW INFORMATION</p>
              <p className="text-xs text-amber-800">Confirm these details before we search for fees.</p>
            </div>

            <div className="space-y-3 bg-muted/40 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Address</p>
                  <p>{formData.address}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">ZIP Code</p>
                  <p>{formData.zipCode}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Municipality</p>
                  <p>{formData.municipality}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">County</p>
                  <p>{formData.county}</p>
                </div>
                {formData.estimatedValue && (
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Est. Value</p>
                    <p>${formData.estimatedValue}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>← Edit</Button>
              <Button className="flex-1" onClick={handleSearchFees} disabled={loading}>{loading ? "Searching..." : "Search Fees →"}</Button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Searching official fee schedules...</p>
            <p className="text-xs text-muted-foreground">This may take 15-30 seconds</p>
          </div>
        )}

        {step === 3 && !loading && fees && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-900 mb-1">STEP 3: FEES DETECTED</p>
              <p className="text-xs text-green-800">Review the permit-related fees below.</p>
            </div>

            {fees.parsed.length === 0 ? (
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>No specific fees found. Contact your local building department for current fee schedules.</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {fees.parsed.map((fee, idx) => (
                  <div key={idx} className="border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          {fee.name}
                        </p>
                        {fee.amount > 0 && (
                          <p className="text-lg font-bold text-green-600 mt-1">${fee.amount.toFixed(2)}</p>
                        )}
                      </div>
                      <Badge variant={fee.confidence === "high" ? "default" : fee.confidence === "medium" ? "secondary" : "outline"}>
                        {fee.confidence}
                      </Badge>
                    </div>

                    {fee.description && (
                      <p className="text-xs text-muted-foreground mb-1">{fee.description}</p>
                    )}

                    {fee.dependsOn && (
                      <p className="text-xs text-amber-600 mb-1">⚠️ Depends on: {fee.dependsOn}</p>
                    )}

                    {fee.source && (
                      <p className="text-xs text-muted-foreground">Source: {fee.source}</p>
                    )}

                    {fee.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{fee.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Disclaimer */}
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-xs">
                <strong>Important:</strong> Permit fees are AI-assisted estimates from official public sources. Final fees should always be confirmed with your local building/zoning office before submission.
              </AlertDescription>
            </Alert>

            <details className="text-xs">
              <summary className="cursor-pointer font-semibold text-muted-foreground">View Raw Details</summary>
              <div className="mt-2 p-3 bg-muted/30 rounded-lg whitespace-pre-wrap text-xs text-muted-foreground max-h-40 overflow-y-auto">
                {fees.raw}
              </div>
            </details>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>← New Search</Button>
              <Button className="flex-1" onClick={handleAddFees}>Add Fees to Bid →</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}