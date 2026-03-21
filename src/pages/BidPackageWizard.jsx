import React, { useState, useRef, useCallback } from "react";
import SubscriptionGate from "@/components/subscription/SubscriptionGate";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import WizardStepBar from "@/components/bidpackage/WizardStepBar";
import StepUpload from "@/components/bidpackage/StepUpload";
import StepMeasurements from "@/components/bidpackage/StepMeasurements";
import StepCrew from "@/components/bidpackage/StepCrew";
import StepBidReview from "@/components/bidpackage/StepBidReview";
import WizardLoadingScreen from "@/components/bidpackage/WizardLoadingScreen";


export default function BidPackageWizard() {
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState(null);       // image preview URL
  const [fileName, setFileName] = useState(null); // PDF filename
  const [photoFile, setPhotoFile] = useState(null);
  const [measurements, setMeasurements] = useState({ width: "10", depth: "8", notes: "" });
  const [selectedSubs, setSelectedSubs] = useState([]);
  const [subHours, setSubHours] = useState({});
  const [loading, setLoading] = useState(false);
  const [bidData, setBidData] = useState(null);
  const [markup, setMarkup] = useState(20);
  const [contingency, setContingency] = useState(10);

  const { data: subcontractors = [] } = useQuery({
    queryKey: ["subcontractors"],
    queryFn: () => base44.entities.Subcontractor.filter({ status: "active" }),
  });

  const { data: settings = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }),
  });
  const s = settings[0] || {};

  const handleFile = useCallback((file) => {
    if (!file) return;
    setPhotoFile(file);
    if (file.type === "application/pdf") {
      setPhoto(null);
      setFileName(file.name);
    } else if (file.type.startsWith("image/")) {
      setFileName(null);
      setPhoto(URL.createObjectURL(file));
    }
  }, []);

  const toggleSub = (id) => {
    setSelectedSubs(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
    if (!subHours[id]) setSubHours(p => ({ ...p, [id]: 8 }));
  };

  const generateBid = async () => {
    setLoading(true);
    try {
      const crew = subcontractors
        .filter(s => selectedSubs.includes(s.id))
        .map(s => ({
          name: s.name,
          trade: s.specialty || "General",
          rate: s.default_pay_rate || s.hourly_rate || 50,
          hours: subHours[s.id] || 8,
        }));

      let fileUrl = null;
      if (photoFile) {
        const uploadResult = await base44.integrations.Core.UploadFile({ file: photoFile });
        fileUrl = uploadResult.file_url;
      }

      const fileType = photoFile?.type === "application/pdf" ? "PDF blueprint" : "project photo";
      const prompt = `You are a professional construction estimator. Analyze this ${fileType} and create a contractor bid.

Project dimensions: ${measurements.width}' wide x ${measurements.depth}' deep
Notes: ${measurements.notes || "None"}

Crew:
${crew.length > 0 ? crew.map(c => `- ${c.name} (${c.trade}): $${c.rate}/hr, ${c.hours} hours`).join("\n") : "No crew assigned"}

Return a JSON object:
{
  "projectTitle": "string",
  "projectDescription": "string",
  "structuralSummary": { "footprint": "string", "squareFootage": number, "roofType": "string" },
  "materials": [
    { "category": "string", "items": [{ "name": "string", "qty": number, "unit": "string", "unitCost": number, "totalCost": number }] }
  ],
  "laborBreakdown": [
    { "phase": "string", "trade": "string", "hours": number, "rate": number, "total": number, "assignedTo": "string" }
  ],
  "timeline": [
    { "day": number, "phase": "string", "tasks": ["string"] }
  ],
  "financials": { "materialSubtotal": number, "laborSubtotal": number, "subtotal": number, "markup": number, "contingency": number, "total": number, "perSqFt": number },
  "buildNotes": ["string"],
  "permitItems": ["string"]
}

Use realistic 2025 material prices. Material categories: Foundation, Framing, Decking, Roofing, Railing/Stairs, Hardware, Finishing.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: "gemini_3_pro",
        file_urls: fileUrl ? [fileUrl] : undefined,
        response_json_schema: {
          type: "object",
          properties: {
            projectTitle: { type: "string" },
            projectDescription: { type: "string" },
            structuralSummary: { type: "object" },
            materials: { type: "array", items: { type: "object" } },
            laborBreakdown: { type: "array", items: { type: "object" } },
            timeline: { type: "array", items: { type: "object" } },
            financials: { type: "object" },
            buildNotes: { type: "array", items: { type: "string" } },
            permitItems: { type: "array", items: { type: "string" } },
          },
        },
      });

      // Recalculate financials with user's markup/contingency
      const matSub = result.financials?.materialSubtotal || 0;
      const labSub = result.financials?.laborSubtotal || 0;
      const sub = matSub + labSub;
      const sqft = result.structuralSummary?.squareFootage || 80;

      result.financials = {
        materialSubtotal: matSub,
        laborSubtotal: labSub,
        subtotal: sub,
        markup: Math.round(sub * markup / 100),
        contingency: Math.round(sub * contingency / 100),
        total: Math.round(sub * (1 + markup / 100 + contingency / 100)),
        perSqFt: Math.round(sub * (1 + markup / 100 + contingency / 100) / sqft),
      };

      setBidData(result);
      setStep(3);
    } catch (err) {
      console.error("Bid generation error:", err);
      alert("Error generating bid. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setStep(0);
    setBidData(null);
    setPhoto(null);
    setFileName(null);
    setPhotoFile(null);
    setSelectedSubs([]);
    setSubHours({});
  };

  return (
    <SubscriptionGate feature="bidpackagewizard">
    <div className="min-h-screen bg-gray-950 text-slate-100" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        .bp-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; animation: fadeUp 0.4s ease; }
        .bp-btn-primary { background: linear-gradient(135deg,#f59e0b,#ef4444); color: #fff; border: none; border-radius: 10px; padding: 12px 28px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .bp-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px #f59e0b44; }
        .bp-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .bp-btn-secondary { background: #1e293b; color: #cbd5e1; border: 1px solid #334155; border-radius: 10px; padding: 10px 20px; font-size: 14px; cursor: pointer; transition: all 0.2s; }
        .bp-btn-secondary:hover { background: #273548; color: #f1f5f9; }
        .bp-input { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 10px 14px; color: #f1f5f9; font-size: 14px; width: 100%; box-sizing: border-box; outline: none; }
        .bp-input:focus { border-color: #f59e0b; box-shadow: 0 0 0 2px #f59e0b22; }
        .bp-tab { padding: 8px 18px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; border: none; transition: all 0.2s; }
        .bp-sub-card { background: #0f172a; border: 2px solid #1e293b; border-radius: 14px; padding: 16px; cursor: pointer; transition: all 0.2s; }
        .bp-sub-card:hover { border-color: #334155; transform: translateY(-2px); }
        .bp-sub-card.selected { border-color: #f59e0b; background: #1a1a08; box-shadow: 0 0 20px #f59e0b22; }
        .mat-row:hover { background: #1a2035 !important; }
      `}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0f172a 0%,#1a0a05 100%)", borderBottom: "1px solid #1e293b", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="flex items-center gap-4">
          <Link to="/SmartBidBuilder" className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, background: "linear-gradient(90deg,#f59e0b,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              ⚡ Bid Package Wizard
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>AI-Powered Complete Bid Generator</div>
          </div>
        </div>
        {bidData && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>Total Bid</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 700, color: "#10b981" }}>
              ${Number(bidData.financials?.total).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px" }}>
        <WizardStepBar step={step} />

        {step === 0 && (
          <StepUpload
            photo={photo}
            fileName={fileName}
            onFile={handleFile}
            onNext={() => setStep(1)}
          />
        )}

        {step === 1 && (
          <StepMeasurements
            measurements={measurements}
            onChange={setMeasurements}
            markup={markup}
            contingency={contingency}
            onMarkupChange={setMarkup}
            onContingencyChange={setContingency}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <>
            <StepCrew
              subcontractors={subcontractors}
              selectedSubs={selectedSubs}
              subHours={subHours}
              onToggleSub={toggleSub}
              onHoursChange={(id, hrs) => setSubHours(p => ({ ...p, [id]: hrs }))}
              onBack={() => setStep(1)}
              onGenerate={generateBid}
              loading={loading}
            />
            {loading && <WizardLoadingScreen />}
          </>
        )}

        {step === 3 && bidData && (
          <StepBidReview
            bidData={bidData}
            markup={markup}
            contingency={contingency}
            selectedSubs={selectedSubs}
            subHours={subHours}
            subcontractors={subcontractors}
            measurements={measurements}
            settings={s}
            onNewBid={resetWizard}
            onEditCrew={() => setStep(2)}
            onRecalculate={generateBid}
          />
        )}
      </div>
    </div>
    </SubscriptionGate>
  );
}