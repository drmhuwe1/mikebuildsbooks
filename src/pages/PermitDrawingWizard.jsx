import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PermitStep1Project from "@/components/permits/PermitStep1Project";
import PermitStep2Deck from "@/components/permits/PermitStep2Deck";
import PermitStep3Roof from "@/components/permits/PermitStep3Roof";
import PermitStep4Structural from "@/components/permits/PermitStep4Structural";
import PermitStep5Checklist from "@/components/permits/PermitStep5Checklist";
import PermitStep6Review from "@/components/permits/PermitStep6Review";
import PageHeader from "@/components/shared/PageHeader";

const STEPS = ["Project Info", "Deck Details", "Roof Details", "Structural", "Checklist", "Review"];

const defaultData = {
  projectType: "deck",
  customerName: "",
  projectAddress: "",
  municipality: "",
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
  checklist: {
    dimensions: false,
    footings: false,
    stairs: false,
    railings: false,
    roofPitch: false,
    support: false,
    attachment: false,
  },
};

export default function PermitDrawingWizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(defaultData);

  const set = (key, value) => setData(d => ({ ...d, [key]: value }));

  const isRoofProject = ["Porch Roof", "Roof Over Existing Deck"].includes(data.projectType);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Permit Drawing Wizard"
        description="Create basic deck and roof permit drawings for submission"
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s + i}>
            <button
              onClick={() => setStep(i)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="w-3 h-3 inline mr-1" /> : null}{s}
            </button>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
          </React.Fragment>
        ))}
      </div>

      <Card className="p-6">
        {step === 0 && <PermitStep1Project data={data} onChange={set} />}
        {step === 1 && <PermitStep2Deck data={data} onChange={set} />}
        {step === 2 && isRoofProject && <PermitStep3Roof data={data} onChange={set} />}
        {step === 3 && <PermitStep4Structural data={data} onChange={set} projectType={data.projectType} />}
        {step === 4 && <PermitStep5Checklist data={data} onChange={set} />}
        {step === 5 && <PermitStep6Review data={data} />}

        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => (step > 0 ? setStep(step - 1) : window.history.back())}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />{step > 0 ? "Back" : "Cancel"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button disabled className="bg-green-600">
              <Check className="w-4 h-4 mr-1" /> Complete
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}