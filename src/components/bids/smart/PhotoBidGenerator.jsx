import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Camera, Upload, Loader2, Sparkles, Users, Clock, Package, DollarSign, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function PhotoBidGenerator({ settings = {}, onLineItemsGenerated, onAIDataGenerated }) {
  const { toast } = useToast();
  const fileRef = useRef();

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [showBlueprint, setShowBlueprint] = useState(false);

  // Optional inputs
  const [measurements, setMeasurements] = useState("");
  const [crewSize, setCrewSize] = useState(2);
  const [hourlyRate, setHourlyRate] = useState(settings.default_labor_rate || 45);
  const [includeMaterials, setIncludeMaterials] = useState(true);
  const [projectType, setProjectType] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!imageFile) {
      toast({ title: "Please upload a photo first.", variant: "destructive" });
      return;
    }

    setAnalyzing(true);
    setUploading(true);

    // Upload image
    const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
    setUploading(false);

    const prompt = `You are an expert construction estimator and blueprint designer. Analyze this image of what a contractor wants to build.

${projectType ? `Project type hint: ${projectType}` : ""}
${measurements ? `Measurements provided: ${measurements}` : "Estimate measurements from the image."}
Crew size: ${crewSize} workers
Hourly rate per worker: $${hourlyRate}/hr
Include materials in estimate: ${includeMaterials}

Please provide a comprehensive construction estimate in JSON format with these exact fields:
{
  "projectTitle": "short project name",
  "projectDescription": "detailed description of what is being built",
  "scopeOfWork": "detailed scope of work",
  "estimatedMeasurements": "your best estimate of dimensions/square footage",
  "blueprintNotes": "detailed blueprint specifications: dimensions, structural notes, load requirements, materials of construction, roof pitch if applicable, foundation type, etc. — written as professional blueprint notes",
  "estimatedDuration": "X days / X weeks",
  "totalLaborHours": number (total labor hours for entire project),
  "crewNotes": "notes about crew requirements, phases, skill needs",
  "materials": [
    { "name": "item name", "quantity": number, "unit": "unit (sq ft, LF, EA, etc.)", "unitCost": number, "totalCost": number, "category": "materials" }
  ],
  "laborItems": [
    { "description": "task", "hours": number, "rate": number, "totalCost": number, "category": "labor" }
  ],
  "permits": { "required": true/false, "estimatedCost": number, "notes": "permit notes" },
  "additionalFees": [
    { "description": "fee name", "amount": number, "notes": "why this fee" }
  ],
  "riskFlags": ["risk 1", "risk 2"],
  "totalMaterialCost": number,
  "totalLaborCost": number,
  "totalPermitCost": number,
  "totalAdditionalFees": number,
  "totalProjectCost": number,
  "recommendedBidAmount": number (add ~20% profit margin to total cost)
}`;

    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [file_url],
      model: "claude_sonnet_4_6",
      response_json_schema: {
        type: "object",
        properties: {
          projectTitle: { type: "string" },
          projectDescription: { type: "string" },
          scopeOfWork: { type: "string" },
          estimatedMeasurements: { type: "string" },
          blueprintNotes: { type: "string" },
          estimatedDuration: { type: "string" },
          totalLaborHours: { type: "number" },
          crewNotes: { type: "string" },
          materials: { type: "array", items: { type: "object" } },
          laborItems: { type: "array", items: { type: "object" } },
          permits: { type: "object" },
          additionalFees: { type: "array", items: { type: "object" } },
          riskFlags: { type: "array", items: { type: "string" } },
          totalMaterialCost: { type: "number" },
          totalLaborCost: { type: "number" },
          totalPermitCost: { type: "number" },
          totalAdditionalFees: { type: "number" },
          totalProjectCost: { type: "number" },
          recommendedBidAmount: { type: "number" },
        }
      }
    });

    setResult(aiResult);
    setAnalyzing(false);

    // Build line items for the bid
    const lineItems = [];
    let id = Date.now();

    if (includeMaterials && aiResult.materials?.length > 0) {
      aiResult.materials.forEach(m => {
        lineItems.push({
          id: id++,
          description: `${m.name} (${m.quantity} ${m.unit})`,
          estimatedCost: m.totalCost || 0,
          category: "materials",
          quantity: m.quantity,
          unit: m.unit,
          unitCost: m.unitCost,
        });
      });
    }

    if (aiResult.laborItems?.length > 0) {
      aiResult.laborItems.forEach(l => {
        lineItems.push({
          id: id++,
          description: l.description,
          estimatedCost: l.totalCost || 0,
          category: "labor",
        });
      });
    }

    if (aiResult.permits?.required && aiResult.permits?.estimatedCost > 0) {
      lineItems.push({
        id: id++,
        description: `Permits - ${aiResult.permits.notes || "Building Permits"}`,
        estimatedCost: aiResult.permits.estimatedCost,
        category: "permit",
      });
    }

    if (aiResult.additionalFees?.length > 0) {
      aiResult.additionalFees.forEach(f => {
        lineItems.push({
          id: id++,
          description: f.description,
          estimatedCost: f.amount || 0,
          category: "other",
        });
      });
    }

    onLineItemsGenerated(lineItems);
    onAIDataGenerated({
      projectDescription: aiResult.projectDescription,
      scopeOfWork: aiResult.scopeOfWork,
      estimatedDuration: aiResult.estimatedDuration,
      riskFlags: aiResult.riskFlags || [],
    });

    toast({ title: "Photo analyzed! Line items generated below." });
  };

  return (
    <div className="space-y-5">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <Camera className="w-4 h-4 text-purple-600" />
          <p className="text-sm font-semibold text-purple-900">Photo-to-Bid AI</p>
        </div>
        <p className="text-xs text-purple-800">Upload a photo of what you want to build. AI will analyze it, estimate materials, labor, time, and generate a full bid — including blueprint notes.</p>
      </div>

      {/* Photo Upload */}
      <div>
        <Label className="text-xs mb-2 block font-semibold">Upload Project Photo *</Label>
        <div
          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {imagePreview ? (
            <img src={imagePreview} alt="Project" className="max-h-48 mx-auto rounded-lg object-contain" />
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload a photo of the project</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, HEIC supported</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        {imagePreview && (
          <Button variant="ghost" size="sm" className="mt-1 text-xs" onClick={() => { setImageFile(null); setImagePreview(null); setResult(null); }}>
            Remove photo
          </Button>
        )}
      </div>

      {/* Optional Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Project Type (optional)</Label>
          <Input
            value={projectType}
            onChange={e => setProjectType(e.target.value)}
            placeholder="e.g. Deck, Addition, Fence, Roof..."
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Measurements (optional)</Label>
          <Input
            value={measurements}
            onChange={e => setMeasurements(e.target.value)}
            placeholder="e.g. 20x30 ft, 600 sq ft..."
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Crew Size</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={crewSize}
            onChange={e => setCrewSize(parseInt(e.target.value) || 1)}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Hourly Rate per Worker ($/hr)</Label>
          <Input
            type="number"
            min={1}
            value={hourlyRate}
            onChange={e => setHourlyRate(parseFloat(e.target.value) || 45)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="includeMaterials"
          checked={includeMaterials}
          onChange={e => setIncludeMaterials(e.target.checked)}
          className="rounded"
        />
        <Label htmlFor="includeMaterials" className="text-sm cursor-pointer">Include materials in bid estimate</Label>
      </div>

      <Button
        className="w-full gap-2"
        onClick={handleAnalyze}
        disabled={!imageFile || analyzing}
      >
        {analyzing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {uploading ? "Uploading photo..." : "AI is analyzing your project..."}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Analyze Photo & Generate Bid
          </>
        )}
      </Button>

      {/* Results */}
      {result && (
        <div className="space-y-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold">AI Analysis Complete</p>
            <Badge className="bg-green-100 text-green-800 text-xs">Line items added below</Badge>
          </div>

          {/* Project Summary */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-xs font-bold text-blue-900 mb-2">Project Summary</p>
            <p className="text-sm font-semibold text-blue-900">{result.projectTitle}</p>
            <p className="text-xs text-blue-800 mt-1">{result.projectDescription}</p>
            {result.estimatedMeasurements && (
              <p className="text-xs text-blue-700 mt-1 font-medium">📐 Measurements: {result.estimatedMeasurements}</p>
            )}
          </Card>

          {/* Time & Crew */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card className="p-3">
              <div className="flex items-center gap-1.5 mb-1"><Clock className="w-3.5 h-3.5 text-orange-500" /><p className="text-xs text-muted-foreground">Duration</p></div>
              <p className="text-sm font-bold">{result.estimatedDuration}</p>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-1.5 mb-1"><Users className="w-3.5 h-3.5 text-blue-500" /><p className="text-xs text-muted-foreground">Total Labor Hrs</p></div>
              <p className="text-sm font-bold">{result.totalLaborHours}h</p>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-1.5 mb-1"><DollarSign className="w-3.5 h-3.5 text-green-500" /><p className="text-xs text-muted-foreground">Recommended Bid</p></div>
              <p className="text-sm font-bold text-green-700">{formatCurrency(result.recommendedBidAmount)}</p>
            </Card>
          </div>

          {/* Cost Breakdown */}
          <Card className="p-4">
            <p className="text-xs font-bold mb-3">Cost Breakdown</p>
            <div className="space-y-1.5 text-sm">
              {includeMaterials && <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><Package className="w-3 h-3" />Materials</span><span className="font-medium">{formatCurrency(result.totalMaterialCost)}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" />Labor</span><span className="font-medium">{formatCurrency(result.totalLaborCost)}</span></div>
              {result.totalPermitCost > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Permits</span><span className="font-medium">{formatCurrency(result.totalPermitCost)}</span></div>}
              {result.totalAdditionalFees > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Additional Fees</span><span className="font-medium">{formatCurrency(result.totalAdditionalFees)}</span></div>}
              <div className="flex justify-between border-t pt-1.5 font-bold"><span>Total Cost</span><span>{formatCurrency(result.totalProjectCost)}</span></div>
              <div className="flex justify-between text-green-700 font-bold"><span>Recommended Bid (~20% margin)</span><span>{formatCurrency(result.recommendedBidAmount)}</span></div>
            </div>
          </Card>

          {/* Blueprint Notes */}
          <Card className="p-4">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setShowBlueprint(!showBlueprint)}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <p className="text-xs font-bold">Blueprint / Specification Notes</p>
              </div>
              {showBlueprint ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showBlueprint && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{result.blueprintNotes}</p>
              </div>
            )}
          </Card>

          {/* Scope of Work */}
          {result.scopeOfWork && (
            <Card className="p-4">
              <p className="text-xs font-bold mb-2">Scope of Work</p>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{result.scopeOfWork}</p>
            </Card>
          )}

          {/* Crew Notes */}
          {result.crewNotes && (
            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <p className="text-xs font-bold text-yellow-900 mb-1">Crew Notes</p>
              <p className="text-xs text-yellow-800">{result.crewNotes}</p>
            </Card>
          )}

          {/* Risk Flags */}
          {result.riskFlags?.length > 0 && (
            <Card className="p-4 bg-orange-50 border-orange-200">
              <p className="text-xs font-bold text-orange-900 mb-2">⚠ Risk Flags</p>
              <ul className="space-y-1">
                {result.riskFlags.map((f, i) => (
                  <li key={i} className="text-xs text-orange-800">• {f}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}