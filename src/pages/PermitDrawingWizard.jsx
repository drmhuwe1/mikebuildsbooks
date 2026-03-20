import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, ArrowRight, Check, Hammer, Home, Fence, Package, Building2, TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/shared/PageHeader";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

// Existing wizard components
import PermitStep1Project from "@/components/permits/PermitStep1Project";
import PermitStep2Deck from "@/components/permits/PermitStep2Deck";
import PermitStep3Roof from "@/components/permits/PermitStep3Roof";
import PermitStep4Structural from "@/components/permits/PermitStep4Structural";
import PermitStep5Checklist from "@/components/permits/PermitStep5Checklist";
import PermitStep6Review from "@/components/permits/PermitStep6Review";
import PermitConfirmationStep from "@/components/permits/PermitConfirmationStep";

// New wizard step components
import AdditionDimensions from "@/components/permits/new/AdditionDimensions.jsx";
import AdditionFoundation from "@/components/permits/new/AdditionFoundation.jsx";
import AdditionStructural from "@/components/permits/new/AdditionStructural.jsx";
import AdditionMEP from "@/components/permits/new/AdditionMEP.jsx";
import GarageDimensions from "@/components/permits/new/GarageDimensions.jsx";
import GarageDoorsWindows from "@/components/permits/new/GarageDoorsWindows.jsx";
import GarageElectrical from "@/components/permits/new/GarageElectrical.jsx";
import FenceType from "@/components/permits/new/FenceType.jsx";
import FenceDetails from "@/components/permits/new/FenceDetails.jsx";
import FenceGatesHOA from "@/components/permits/new/FenceGatesHOA.jsx";
import ShedDimensions from "@/components/permits/new/ShedDimensions.jsx";
import ShedFoundation from "@/components/permits/new/ShedFoundation.jsx";
import ShedUseElectrical from "@/components/permits/new/ShedUseElectrical.jsx";
import MunicipalityCodeCheck from "@/components/permits/new/MunicipalityCodeCheck.jsx";
import NewProjectReview from "@/components/permits/new/NewProjectReview.jsx";

const PROJECT_TYPES = [
  { id: "deck",     label: "Deck",            icon: Hammer,    color: "bg-amber-50 border-amber-200 text-amber-700", steps: ["Project Info","Deck Details","Roof Details","Structural","Checklist","Review","Confirm"] },
  { id: "roof",     label: "Roof",            icon: Home,      color: "bg-blue-50 border-blue-200 text-blue-700",   steps: ["Project Info","Deck Details","Roof Details","Structural","Checklist","Review","Confirm"] },
  { id: "addition", label: "Room Addition",   icon: Building2, color: "bg-purple-50 border-purple-200 text-purple-700", steps: ["Project Info","Dimensions","Foundation","Structural","MEP","Code Check","Review","Confirm"] },
  { id: "garage",   label: "Detached Garage", icon: Package,   color: "bg-green-50 border-green-200 text-green-700", steps: ["Project Info","Dimensions","Foundation","Doors & Windows","Electrical","Code Check","Review","Confirm"] },
  { id: "fence",    label: "Fence",           icon: Fence,     color: "bg-orange-50 border-orange-200 text-orange-700", steps: ["Project Info","Fence Type","Details","Gates & HOA","Code Check","Review","Confirm"] },
  { id: "shed",     label: "Shed / Accessory",icon: TreePine,  color: "bg-teal-50 border-teal-200 text-teal-700",   steps: ["Project Info","Dimensions","Foundation","Use & Electrical","Code Check","Review","Confirm"] },
];

const defaultData = {
  projectType: "deck",
  customerName: "", projectAddress: "", projectZipCode: "", projectState: "PA",
  municipality: "", contractorLicense: "",
  // Deck
  deckWidth: 12, deckDepth: 12, deckHeight: 3, numStairs: 1, stairWidth: 3,
  stairLocation: "front", hasRailing: true, isDeckAttached: true,
  // Roof
  roofWidth: 12, roofProjection: 8, roofHeight: 10, roofPitch: "4:12",
  overhang: 1.5, supportPostCount: 4, tiedToExisting: true,
  // Materials
  materialType: "pressure-treated", deckingMaterial: "composite", roofingMaterial: "asphalt",
  // Addition
  additionLength: 20, additionWidth: 16, ceilingHeight: 9, additionStories: 1,
  foundationType: "slab",
  wallFraming: "wood", roofConnectionMethod: "gable", loadBearingWalls: "",
  newHVAC: false, newElectrical: false, newPlumbing: false,
  // Garage
  garageWidth: 24, garageDepth: 24, garageHeight: 10, garageBays: 2,
  overheadDoors: 2, entryDoors: 1, garageWindows: 1,
  garageElectrical: false, garagePanelSize: "",
  setbackFront: "", setbackSide: "", setbackRear: "",
  // Fence
  fenceType: "wood_privacy", fenceTotalLinearFt: 100, fenceHeight: 6,
  numGates: 1, gateWidth: 4, hasHOA: false,
  // Shed
  shedWidth: 12, shedDepth: 16, shedHeight: 10,
  shedFoundation: "concrete_pad", shedUse: "storage",
  shedElectrical: false,
  // Shared
  codeCheckResult: null,
  checklist: { dimensions: false, footings: false, stairs: false, railings: false, roofPitch: false, support: false, attachment: false },
};

export default function PermitDrawingWizard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selectedType, setSelectedType] = useState(null);
  const [step, setStep] = useState(0);
  const [data, setData] = useState(defaultData);

  const { data: settings = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }),
  });
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 100) });

  const saveMutation = useMutation({
    mutationFn: (payload) => base44.entities.PermitProject.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["permit-projects"] });
      toast({ title: "Permit project saved" });
    },
  });

  const set = (key, value) => setData(d => ({ ...d, [key]: value }));
  const company = settings[0] || {};

  const typeConfig = PROJECT_TYPES.find(t => t.id === selectedType);
  const steps = typeConfig?.steps || [];
  const isLegacy = selectedType === "deck" || selectedType === "roof";

  // ── Legacy deck/roof flow ──────────────────────────────────────────────────
  const isRoofProject = ["porch-roof", "roof-existing", "covered-deck", "roof"].includes(data.projectType);

  // ── Step renderer ──────────────────────────────────────────────────────────
  const renderStep = () => {
    if (isLegacy) {
      switch (step) {
        case 0: return <PermitStep1Project data={data} onChange={set} />;
        case 1: return <PermitStep2Deck data={data} onChange={set} />;
        case 2: return isRoofProject ? <PermitStep3Roof data={data} onChange={set} /> : <PermitStep4Structural data={data} onChange={set} projectType={data.projectType} />;
        case 3: return isRoofProject ? <PermitStep4Structural data={data} onChange={set} projectType={data.projectType} /> : <PermitStep5Checklist data={data} onChange={set} />;
        case 4: return isRoofProject ? <PermitStep5Checklist data={data} onChange={set} /> : <PermitStep6Review data={data} company={company} />;
        case 5: return isRoofProject ? <PermitStep6Review data={data} company={company} /> : <PermitConfirmationStep data={data} />;
        case 6: return isRoofProject ? <PermitConfirmationStep data={data} /> : <PermitConfirmationStep data={data} />;
        default: return null;
      }
    }

    if (selectedType === "addition") {
      switch (step) {
        case 0: return <PermitStep1Project data={data} onChange={set} />;
        case 1: return <AdditionDimensions data={data} onChange={set} />;
        case 2: return <AdditionFoundation data={data} onChange={set} />;
        case 3: return <AdditionStructural data={data} onChange={set} />;
        case 4: return <AdditionMEP data={data} onChange={set} />;
        case 5: return <MunicipalityCodeCheck data={data} onChange={set} projectTypeLabel="Room Addition" />;
        case 6: return <NewProjectReview data={data} company={company} projectType="addition" onSave={() => saveMutation.mutate(buildSavePayload())} />;
        case 7: return <NewConfirm data={data} navigate={navigate} />;
        default: return null;
      }
    }

    if (selectedType === "garage") {
      switch (step) {
        case 0: return <PermitStep1Project data={data} onChange={set} />;
        case 1: return <GarageDimensions data={data} onChange={set} />;
        case 2: return <AdditionFoundation data={data} onChange={set} />;
        case 3: return <GarageDoorsWindows data={data} onChange={set} />;
        case 4: return <GarageElectrical data={data} onChange={set} />;
        case 5: return <MunicipalityCodeCheck data={data} onChange={set} projectTypeLabel="Detached Garage" />;
        case 6: return <NewProjectReview data={data} company={company} projectType="garage" onSave={() => saveMutation.mutate(buildSavePayload())} />;
        case 7: return <NewConfirm data={data} navigate={navigate} />;
        default: return null;
      }
    }

    if (selectedType === "fence") {
      switch (step) {
        case 0: return <PermitStep1Project data={data} onChange={set} />;
        case 1: return <FenceType data={data} onChange={set} />;
        case 2: return <FenceDetails data={data} onChange={set} />;
        case 3: return <FenceGatesHOA data={data} onChange={set} />;
        case 4: return <MunicipalityCodeCheck data={data} onChange={set} projectTypeLabel="Fence" />;
        case 5: return <NewProjectReview data={data} company={company} projectType="fence" onSave={() => saveMutation.mutate(buildSavePayload())} />;
        case 6: return <NewConfirm data={data} navigate={navigate} />;
        default: return null;
      }
    }

    if (selectedType === "shed") {
      switch (step) {
        case 0: return <PermitStep1Project data={data} onChange={set} />;
        case 1: return <ShedDimensions data={data} onChange={set} />;
        case 2: return <ShedFoundation data={data} onChange={set} />;
        case 3: return <ShedUseElectrical data={data} onChange={set} />;
        case 4: return <MunicipalityCodeCheck data={data} onChange={set} projectTypeLabel="Shed / Accessory Structure" />;
        case 5: return <NewProjectReview data={data} company={company} projectType="shed" onSave={() => saveMutation.mutate(buildSavePayload())} />;
        case 6: return <NewConfirm data={data} navigate={navigate} />;
        default: return null;
      }
    }

    return null;
  };

  const buildSavePayload = () => ({
    project_type: selectedType,
    customer_name: data.customerName,
    project_address: data.projectAddress,
    municipality: data.municipality,
    project_data: data,
    status: "completed",
  });

  // ── Landing: project type selector ────────────────────────────────────────
  if (!selectedType) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader title="Permit Drawing Wizard" description="Select a project type to begin generating permit drawings and assembling your permit packet" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROJECT_TYPES.map(pt => (
            <Card
              key={pt.id}
              className={`p-6 border-2 cursor-pointer hover:shadow-md transition-all ${pt.color}`}
              onClick={() => {
                setSelectedType(pt.id);
                setStep(0);
                setData({ ...defaultData, projectType: pt.id });
              }}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/70 flex items-center justify-center">
                  <pt.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{pt.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">{pt.steps.length - 1} steps</p>
                </div>
                <Button size="sm" className="w-full bg-white/80 hover:bg-white text-gray-800 border border-current/20 mt-1">
                  Start Wizard
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Active wizard ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`${typeConfig?.label} Permit Wizard`}
        description="Complete each step to generate permit drawings and assemble your permit packet"
      >
        <Button variant="ghost" size="sm" onClick={() => { setSelectedType(null); setStep(0); }}>
          <ArrowLeft className="w-4 h-4 mr-1" /> All Project Types
        </Button>
      </PageHeader>

      {/* Step indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {steps.map((s, i) => (
          <React.Fragment key={s + i}>
            <button
              onClick={() => i < step && setStep(i)}
              className={`px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                i === step ? "bg-primary text-primary-foreground" :
                i < step ? "bg-green-100 text-green-700 cursor-pointer hover:bg-green-200" :
                "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="w-3 h-3 inline mr-1" /> : null}{s}
            </button>
            {i < steps.length - 1 && <div className="h-px w-4 shrink-0 bg-border" />}
          </React.Fragment>
        ))}
      </div>

      <Card className="p-6">
        {renderStep()}

        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : setSelectedType(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" />{step > 0 ? "Back" : "Cancel"}
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => setSelectedType(null)} className="bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4 mr-1" /> Done
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function NewConfirm({ data, navigate }) {
  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
        <Check className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-green-900 text-sm">Permit Project Complete</p>
          <p className="text-xs text-green-800 mt-1">Your permit drawings and checklist have been generated. Review the summary below and proceed to submit.</p>
        </div>
      </div>
      <Card className="p-4 grid grid-cols-2 gap-3 text-sm">
        <div><p className="text-xs text-muted-foreground">Customer</p><p className="font-medium">{data.customerName || "—"}</p></div>
        <div><p className="text-xs text-muted-foreground">Project Type</p><p className="font-medium capitalize">{data.projectType}</p></div>
        <div className="col-span-2"><p className="text-xs text-muted-foreground">Address</p><p className="font-medium">{data.projectAddress}</p></div>
        <div><p className="text-xs text-muted-foreground">Municipality</p><p className="font-medium">{data.municipality || "—"}</p></div>
      </Card>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate("/BidBuilder")}>
          Open Bid Builder
        </Button>
        <Button className="flex-1" onClick={() => navigate("/QuickBid")}>
          Generate Bid from Permit Data
        </Button>
      </div>
      <Card className="p-3 bg-yellow-50 border-yellow-200 text-xs text-yellow-800">
        Always verify final requirements directly with your local building department before submission. Engineered or stamped plans may be required.
      </Card>
    </div>
  );
}