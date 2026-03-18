import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, ArrowRight, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UNIFIED_WORKFLOW_STEPS, generateCodeGuidance, generateStructuralGuidance, generatePermitChecklist, estimatePermitFeeRange, generateIntegratedWarnings } from "@/lib/unifiedWorkflowEngine";
import PageHeader from "@/components/shared/PageHeader";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import WorkflowStep1ProjectInfo from "@/components/workflow/WorkflowStep1ProjectInfo";
import WorkflowStep2Municipality from "@/components/workflow/WorkflowStep2Municipality";
import WorkflowStep3Design from "@/components/workflow/WorkflowStep3Design";
import WorkflowStep4Structural from "@/components/workflow/WorkflowStep4Structural";
import WorkflowStep5CodeGuidance from "@/components/workflow/WorkflowStep5CodeGuidance";
import WorkflowStep6Permits from "@/components/workflow/WorkflowStep6Permits";
import WorkflowStep7Fees from "@/components/workflow/WorkflowStep7Fees";
import WorkflowStep8Drawing from "@/components/workflow/WorkflowStep8Drawing";
import WorkflowStep9Packet from "@/components/workflow/WorkflowStep9Packet";
import WorkflowStep10Bid from "@/components/workflow/WorkflowStep10Bid";

const defaultData = {
  projectType: "Deck",
  customerName: "",
  projectAddress: "",
  municipality: "",
  county: "",
  zipCode: "",
  deckWidth: 12,
  deckDepth: 12,
  deckHeight: 3,
  numStairs: 1,
  stairWidth: 3,
  stairLocation: "front",
  hasRailing: true,
  isDeckAttached: true,
  roofWidth: 12,
  roofProjection: 8,
  roofHeight: 10,
  roofPitch: "4:12",
  overhang: 1.5,
  supportPostCount: 4,
  tiedToExisting: true,
  footingCount: 4,
  materialType: "pressure-treated",
  deckingMaterial: "composite",
  roofingMaterial: "asphalt",
  permitFeeItems: [],
  integratedWarnings: [],
};

export default function UnifiedDesignWorkflow() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(defaultData);
  const [savedDraft, setSavedDraft] = useState(null);

  const { data: settings = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }),
  });

  const set = (key, value) => {
    setData(d => {
      const updated = { ...d, [key]: value };
      // Recalculate guidance whenever data changes
      return updated;
    });
  };

  const company = settings[0] || {};

  // Real-time guidance calculations
  const codeGuidance = useMemo(() => generateCodeGuidance(data), [data]);
  const structuralGuidance = useMemo(() => generateStructuralGuidance(data), [data]);
  const permitChecklist = useMemo(() => generatePermitChecklist(data), [data]);
  const estimatedFees = useMemo(() => estimatePermitFeeRange(data), [data]);
  const warnings = useMemo(() => generateIntegratedWarnings(data, codeGuidance, structuralGuidance, []), [data, codeGuidance, structuralGuidance]);

  const isRoofProject = ["Porch Roof", "Roof Over Existing Deck"].includes(data.projectType);
  const currentStep = UNIFIED_WORKFLOW_STEPS[step];

  const handleSaveDraft = () => {
    setSavedDraft(data);
    // Could also save to backend here
  };

  const handleLoadDraft = () => {
    if (savedDraft) {
      setData(savedDraft);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Unified Design & Permit Workflow"
        description="Design, code review, permits, and bid preparation in one guided process"
      />

      {/* Critical warnings banner */}
      {warnings.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-900 mb-2">⚠️ Important Guidance Items</p>
              <ul className="space-y-1 text-xs text-red-800">
                {warnings.slice(0, 3).map((w, i) => (
                  <li key={i}>• {w.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Step indicator with section labels */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase">Step {step + 1} of {UNIFIED_WORKFLOW_STEPS.length}: {currentStep.section}</p>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {UNIFIED_WORKFLOW_STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                onClick={() => setStep(i)}
                disabled={i > step}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                    ? "bg-green-100 text-green-700 cursor-pointer"
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                }`}
              >
                {i < step ? <Check className="w-3 h-3 inline mr-1" /> : null}{s.label}
              </button>
              {i < UNIFIED_WORKFLOW_STEPS.length - 1 && <div className="h-px w-2 bg-border" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <Card className="p-6">
        {/* Step content */}
        {step === 0 && <WorkflowStep1ProjectInfo data={data} onChange={set} />}
        {step === 1 && <WorkflowStep2Municipality data={data} onChange={set} />}
        {step === 2 && <WorkflowStep3Design data={data} onChange={set} isRoof={isRoofProject} warnings={warnings} />}
        {step === 3 && <WorkflowStep4Structural data={data} guidance={structuralGuidance} onChange={set} />}
        {step === 4 && <WorkflowStep5CodeGuidance data={data} guidance={codeGuidance} warnings={warnings} />}
        {step === 5 && <WorkflowStep6Permits data={data} checklist={permitChecklist} />}
        {step === 6 && <WorkflowStep7Fees data={data} estimatedFees={estimatedFees} onChange={set} />}
        {step === 7 && <WorkflowStep8Drawing data={data} company={company} />}
        {step === 8 && <WorkflowStep9Packet data={data} company={company} checklist={permitChecklist} />}
        {step === 9 && <WorkflowStep10Bid data={data} fees={estimatedFees} onChange={set} />}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t gap-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => (step > 0 ? setStep(step - 1) : window.history.back())}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />{step > 0 ? "Back" : "Cancel"}
            </Button>
            {step > 1 && (
              <Button variant="ghost" onClick={handleSaveDraft} size="sm">
                💾 Save Draft
              </Button>
            )}
            {savedDraft && (
              <Button variant="ghost" onClick={handleLoadDraft} size="sm">
                📂 Load Draft
              </Button>
            )}
          </div>

          {step < UNIFIED_WORKFLOW_STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => window.history.back()} className="bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4 mr-1" /> Complete & Close
            </Button>
          )}
        </div>
      </Card>

      {/* Progress summary */}
      <Card className="p-4 bg-muted/40">
        <p className="text-xs font-semibold text-muted-foreground mb-2">WORKFLOW PROGRESS</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Project Details:</span>
            <span className={data.projectType && data.customerName ? "✓ Complete" : "Incomplete"}>
              {data.projectType && data.customerName ? "✓" : "○"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Measurements:</span>
            <span className={data.deckWidth && data.deckHeight ? "✓ Complete" : "Incomplete"}>
              {data.deckWidth && data.deckHeight ? "✓" : "○"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Code Review:</span>
            <span className={step >= 4 ? "Reviewed" : "Not yet"}>{step >= 4 ? "✓" : "○"}</span>
          </div>
          <div className="flex justify-between">
            <span>Permits & Fees:</span>
            <span className={step >= 6 ? "Reviewed" : "Not yet"}>{step >= 6 ? "✓" : "○"}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}