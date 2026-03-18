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
import { CheckCircle, AlertTriangle, Loader, ExternalLink } from "lucide-react";

export default function PermitRequirementsChecker({ open, onClose, permitData, packetSections }) {
  const [step, setStep] = useState("input"); // "input" | "loading" | "results"
  const [formData, setFormData] = useState({
    address: permitData?.projectAddress || "",
    zipCode: "",
    municipality: permitData?.municipality || "",
    county: "",
    projectType: permitData?.projectType || "deck",
    description: "",
  });
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateInputs = () => {
    if (!formData.address.trim()) return "Please enter the project address";
    if (!formData.zipCode.trim()) return "Please enter the ZIP code";
    if (!formData.municipality.trim()) return "Please enter the municipality/city";
    if (!formData.county.trim()) return "Please enter the county";
    if (!formData.description.trim()) return "Please provide a brief description of the work";
    return null;
  };

  const fetchRequirements = async () => {
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    setStep("loading");
    setError(null);

    try {
      const prompt = `You are a construction permit expert. Research the official permit requirements for the following project:

Project Details:
- Type: ${formData.projectType}
- Address: ${formData.address}, ${formData.municipality}, ${formData.county}, ${formData.zipCode}
- Work Description: ${formData.description}

Your task:
1. Search official government sources (building department, township/city websites, county resources)
2. Identify likely permit submission requirements
3. List what documents/info are typically needed
4. Note any special requirements or inspections
5. Provide local contact guidance if available

Return a structured summary with:
- Building Permit Required: (yes/no/likely)
- Zoning Permit Required: (yes/no/likely)
- Site Plan Needed: (yes/no/likely)
- Plan View Needed: (yes/no/likely)
- Elevation View Needed: (yes/no/likely)
- Footing Details Needed: (yes/no/likely)
- Railing/Stair Details Needed: (yes/no/likely)
- Roof Pitch Details Needed: (yes/no/likely, if roof project)
- Engineering/Stamped Plans Required: (yes/no/likely)
- Application Form Needed: (yes/no/likely)
- Submission Method: (online/in-person/mail/other)
- Estimated Processing Time: (if available)
- Key Contact Information: (building department name, phone, website)
- Additional Notes: (any special requirements or warnings)
- Source Summary: (brief note on where this info came from - official government sites)`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        model: "gemini_3_pro",
      });

      setResults({
        raw: response,
        parsedRequirements: parseRequirements(response),
      });
      setStep("results");
    } catch (err) {
      setError(`Error fetching requirements: ${err.message}`);
      setStep("input");
    }
  };

  const parseRequirements = (text) => {
    const lines = text.split("\n");
    const parsed = {};

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.includes("Building Permit")) {
        parsed.buildingPermit = extractYesNo(trimmed);
      } else if (trimmed.includes("Zoning Permit")) {
        parsed.zoningPermit = extractYesNo(trimmed);
      } else if (trimmed.includes("Site Plan")) {
        parsed.sitePlan = extractYesNo(trimmed);
      } else if (trimmed.includes("Plan View")) {
        parsed.planView = extractYesNo(trimmed);
      } else if (trimmed.includes("Elevation")) {
        parsed.elevation = extractYesNo(trimmed);
      } else if (trimmed.includes("Footing")) {
        parsed.footingDetails = extractYesNo(trimmed);
      } else if (trimmed.includes("Railing") || trimmed.includes("Stair")) {
        parsed.railingStairDetails = extractYesNo(trimmed);
      } else if (trimmed.includes("Roof Pitch")) {
        parsed.roofPitchDetails = extractYesNo(trimmed);
      } else if (trimmed.includes("Engineering") || trimmed.includes("Stamped")) {
        parsed.engineeredPlans = extractYesNo(trimmed);
      } else if (trimmed.includes("Application Form")) {
        parsed.applicationForm = extractYesNo(trimmed);
      } else if (trimmed.includes("Submission Method")) {
        parsed.submissionMethod = trimmed.split(":")[1]?.trim() || "Unknown";
      } else if (trimmed.includes("Contact Information")) {
        parsed.contactInfo = trimmed.split(":")[1]?.trim() || "Contact local building department";
      }
    });

    return parsed;
  };

  const extractYesNo = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes("yes")) return "required";
    if (lower.includes("likely")) return "likely";
    if (lower.includes("no")) return "not_required";
    return "unknown";
  };

  const getItemStatus = (key, requirement) => {
    const packetHasItem = packetSections?.[key];
    if (requirement === "required" || requirement === "likely") {
      return packetHasItem ? "included" : "missing";
    }
    return "not_needed";
  };

  const getMissingItems = () => {
    if (!results?.parsedRequirements) return [];
    const reqs = results.parsedRequirements;
    const missing = [];

    const itemMap = {
      buildingPermit: "Building Permit",
      zoningPermit: "Zoning Permit",
      sitePlan: "Site Plan",
      planView: "Plan View Drawings",
      elevation: "Elevation Drawings",
      footingDetails: "Footing Details",
      railingStairDetails: "Railing/Stair Details",
      roofPitchDetails: "Roof Pitch Information",
      engineeredPlans: "Engineered/Stamped Plans",
      applicationForm: "Application Form",
    };

    Object.entries(itemMap).forEach(([key, label]) => {
      const status = getItemStatus(key, reqs[key]);
      if (status === "missing") {
        missing.push(label);
      }
    });

    return missing;
  };

  const missingItems = getMissingItems();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Permit Requirements Checker</DialogTitle>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                This tool searches official government sources to identify likely permit requirements. Always confirm final requirements with your local building office.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div>
                <Label>Project Address *</Label>
                <Input
                  value={formData.address}
                  onChange={e => handleInputChange("address", e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>ZIP Code *</Label>
                  <Input
                    value={formData.zipCode}
                    onChange={e => handleInputChange("zipCode", e.target.value)}
                    placeholder="12345"
                  />
                </div>
                <div>
                  <Label>Municipality/City *</Label>
                  <Input
                    value={formData.municipality}
                    onChange={e => handleInputChange("municipality", e.target.value)}
                    placeholder="Springfield"
                  />
                </div>
              </div>

              <div>
                <Label>County *</Label>
                <Input
                  value={formData.county}
                  onChange={e => handleInputChange("county", e.target.value)}
                  placeholder="Sangamon County"
                />
              </div>

              <div>
                <Label>Project Type *</Label>
                <Select value={formData.projectType} onValueChange={v => handleInputChange("projectType", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deck">Deck</SelectItem>
                    <SelectItem value="roof">Roof</SelectItem>
                    <SelectItem value="porch-roof">Porch Roof</SelectItem>
                    <SelectItem value="roof-over-deck">Roof Over Existing Deck</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Brief Description of Work *</Label>
                <Textarea
                  value={formData.description}
                  onChange={e => handleInputChange("description", e.target.value)}
                  placeholder="e.g., Building a 12x16 pressure-treated deck, 3 feet high, with stairs and railings"
                  rows={3}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button onClick={fetchRequirements} className="w-full">
                Check Permit Requirements
              </Button>
            </div>
          </div>
        )}

        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Searching official government sources...</p>
            <p className="text-xs text-muted-foreground">This may take a moment (15-30 seconds)</p>
          </div>
        )}

        {step === "results" && results && (
          <div className="space-y-6">
            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                Requirements identified from official sources. Verify with your local building department before submission.
              </AlertDescription>
            </Alert>

            {/* Requirements Summary */}
            <div className="space-y-3">
              <h3 className="font-semibold">Likely Requirements</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(results.parsedRequirements)
                  .filter(([k]) => !["submissionMethod", "contactInfo"].includes(k))
                  .map(([key, value]) => {
                    if (value === "unknown") return null;
                    const labels = {
                      buildingPermit: "Building Permit",
                      zoningPermit: "Zoning Permit",
                      sitePlan: "Site Plan",
                      planView: "Plan View",
                      elevation: "Elevation",
                      footingDetails: "Footing Details",
                      railingStairDetails: "Railing/Stairs",
                      roofPitchDetails: "Roof Pitch",
                      engineeredPlans: "Engineered Plans",
                      applicationForm: "Application Form",
                    };

                    const badgeVariant = value === "required" ? "default" : value === "likely" ? "secondary" : "outline";

                    return (
                      <div key={key} className="flex items-center gap-2">
                        <Badge variant={badgeVariant} className="text-xs">
                          {value === "required" ? "REQUIRED" : value === "likely" ? "LIKELY" : "NOT NEEDED"}
                        </Badge>
                        <span className="text-xs">{labels[key]}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Submission Info */}
            {(results.parsedRequirements.submissionMethod || results.parsedRequirements.contactInfo) && (
              <div className="space-y-2 bg-muted/40 rounded-lg p-3">
                <h3 className="text-sm font-semibold">Submission Info</h3>
                {results.parsedRequirements.submissionMethod && (
                  <p className="text-xs text-muted-foreground">
                    <strong>Method:</strong> {results.parsedRequirements.submissionMethod}
                  </p>
                )}
                {results.parsedRequirements.contactInfo && (
                  <p className="text-xs text-muted-foreground">
                    <strong>Contact:</strong> {results.parsedRequirements.contactInfo}
                  </p>
                )}
              </div>
            )}

            {/* Cross-Check Against Packet */}
            <div className="space-y-3">
              <h3 className="font-semibold">Your Permit Packet</h3>
              {missingItems.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <AlertTriangle className="w-4 h-4 inline mr-1 text-yellow-600" />
                    You may be missing {missingItems.length} item(s):
                  </p>
                  <ul className="space-y-1 ml-2">
                    {missingItems.map(item => (
                      <li key={item} className="text-sm text-muted-foreground">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Your packet appears to include all likely required items.
                </p>
              )}
            </div>

            {/* Raw Results */}
            <details className="text-xs">
              <summary className="cursor-pointer font-semibold text-muted-foreground">View Full Details</summary>
              <div className="mt-2 p-3 bg-muted/30 rounded-lg whitespace-pre-wrap text-xs text-muted-foreground max-h-40 overflow-y-auto">
                {results.raw}
              </div>
            </details>

            {/* Disclaimer */}
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-xs">
                <strong>Important Disclaimer:</strong> This AI-assisted guidance is based on official public sources and your project inputs. Permit requirements vary by jurisdiction and project specifics. Always confirm final requirements directly with your local building or zoning office before submission.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("input")}>
                ← New Check
              </Button>
              <Button className="flex-1" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}