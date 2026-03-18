// Unified Workflow Engine
// Orchestrates design, code guidance, structural helpers, permits, and bid integration

export const UNIFIED_WORKFLOW_STEPS = [
  { id: 0, label: "Project Info", section: "Project Setup" },
  { id: 1, label: "Address & Municipality", section: "Project Setup" },
  { id: 2, label: "Design Measurements", section: "Design Input" },
  { id: 3, label: "Structural Helper", section: "Design Guidance" },
  { id: 4, label: "Code Guidance Review", section: "Design Guidance" },
  { id: 5, label: "Permit Requirements", section: "Compliance" },
  { id: 6, label: "Permit Fees", section: "Compliance" },
  { id: 7, label: "Drawing & Adjustment", section: "Documentation" },
  { id: 8, label: "Permit Packet", section: "Documentation" },
  { id: 9, label: "Bid Integration", section: "Finalization" },
];

// Code guidance rules - real-time checks against deck/roof inputs
export const CODE_GUIDANCE_RULES = {
  // Deck rules
  deckHeight: [
    { min: 0, max: 3, guidance: "No guardrail required (under 30 inches)" },
    { min: 3, max: null, guidance: "⚠️ Guardrails likely required (over 30 inches)" },
  ],
  stairRise: [
    { min: 0, max: 7.75, guidance: "Stair rise within code (max 7¾ inches)" },
    { min: 7.75, max: null, guidance: "⚠️ Stair rise exceeds code (max 7¾ inches)" },
  ],
  stairRun: [
    { min: 10, max: null, guidance: "Stair run within code (min 10 inches)" },
    { min: 0, max: 10, guidance: "⚠️ Stair run may be too shallow (min 10 inches)" },
  ],
  stairWidth: [
    { min: 3, max: null, guidance: "Stair width acceptable (36+ inches recommended)" },
    { min: 0, max: 3, guidance: "⚠️ Stair width is narrow - verify code" },
  ],
  decking: [
    { gap: 1, guidance: "Decking gap typical (1/8 inch for expansion)" },
  ],
  // Roof rules
  roofPitch: [
    { min: 0, max: 3, guidance: "Low-slope roof - verify drainage and code" },
    { min: 3, max: 12, guidance: "Standard residential pitch (typical 4:12 to 8:12)" },
    { min: 12, max: null, guidance: "Steep roof - verify material compatibility" },
  ],
  roofOverhang: [
    { min: 0, max: 1.5, guidance: "Minimal overhang - may affect drainage" },
    { min: 1.5, max: 2, guidance: "Standard overhang (1.5 to 2 feet typical)" },
    { min: 2, max: null, guidance: "Extended overhang - verify structural support" },
  ],
  supportPostSpacing: [
    { min: 0, max: 4, guidance: "Close post spacing - adequate for most conditions" },
    { min: 4, max: 8, guidance: "Standard post spacing (4-8 feet typical)" },
    { min: 8, max: 12, guidance: "Wider spacing - verify with beam size and load" },
    { min: 12, max: null, guidance: "⚠️ Large spacing - likely requires engineering review" },
  ],
};

// Generate real-time code guidance based on design inputs
export function generateCodeGuidance(data) {
  const guidance = [];

  // Deck checks
  if (data.projectType === "Deck") {
    // Deck height check
    if (data.deckHeight >= 3) {
      guidance.push({
        type: "warning",
        category: "Guardrails",
        message: "Deck height of " + data.deckHeight + " ft likely requires guardrails (over 30 inches)",
        actionRequired: true,
      });
    }

    // Stair checks
    if (data.numStairs > 0) {
      const stairRise = (data.deckHeight * 12) / (data.numStairs + 1);
      if (stairRise > 7.75) {
        guidance.push({
          type: "warning",
          category: "Stairs",
          message: "Stair rise of " + stairRise.toFixed(2) + " inches exceeds code (max 7¾ inches)",
          actionRequired: true,
        });
      }
      if (data.stairWidth < 3) {
        guidance.push({
          type: "info",
          category: "Stairs",
          message: "Stair width of " + data.stairWidth + " ft is narrow - verify local requirements",
          actionRequired: false,
        });
      }
    }

    // Attachment check
    if (data.isDeckAttached) {
      guidance.push({
        type: "info",
        category: "Attachment",
        message: "Attached deck - ledger board detail and connection notes will be required",
        actionRequired: true,
      });
    }

    // Footing check
    if (data.footingCount && data.footingCount < 4) {
      guidance.push({
        type: "info",
        category: "Structural",
        message: "Limited footings - verify post spacing and support adequacy",
        actionRequired: false,
      });
    }
  }

  // Roof checks
  if (["Porch Roof", "Roof Over Existing Deck"].includes(data.projectType)) {
    const pitchValue = extractPitchValue(data.roofPitch);

    // Pitch check
    if (pitchValue < 3) {
      guidance.push({
        type: "info",
        category: "Roof Pitch",
        message: "Low-slope roof at " + data.roofPitch + " - verify drainage and material compatibility",
        actionRequired: true,
      });
    }

    // Overhang check
    if (data.overhang > 2) {
      guidance.push({
        type: "warning",
        category: "Overhang",
        message: "Extended overhang of " + data.overhang + " ft - verify structural support",
        actionRequired: false,
      });
    }

    // Tie-in check
    if (data.tiedToExisting) {
      guidance.push({
        type: "info",
        category: "Connection",
        message: "Roof tied to existing structure - tie-in detail will be required",
        actionRequired: true,
      });
    }

    // Post spacing check
    if (data.supportPostCount > 0) {
      const postSpacing = data.roofWidth / data.supportPostCount;
      if (postSpacing > 12) {
        guidance.push({
          type: "warning",
          category: "Structural",
          message: "Post spacing of " + postSpacing.toFixed(1) + " ft is large - may require engineering review",
          actionRequired: true,
        });
      }
    }
  }

  return guidance;
}

// Structural helper - provides span/spacing guidance
export function generateStructuralGuidance(data) {
  if (data.projectType !== "Deck") return [];

  const recommendations = [];

  // Joist spacing guidance (2x lumber)
  if (data.deckDepth <= 12) {
    recommendations.push({
      category: "Joist Spacing",
      current: "user should specify",
      recommended: "12 to 16 inches on center (2x10 @ 16\" for 12 ft span typical)",
      note: "Smaller spacing = less deflection, more joists",
    });
  }

  // Post spacing guidance
  if (data.footingCount && data.deckWidth) {
    const postSpacing = data.deckWidth / (data.footingCount - 1);
    recommendations.push({
      category: "Post Spacing",
      current: postSpacing.toFixed(1) + " ft",
      recommended: postSpacing <= 8 ? "✓ Within typical range (8 ft max)" : "⚠️ Over 8 ft - verify with beam size",
      note: "4x4 posts typical for residential decks",
    });
  }

  // Beam guidance
  if (data.deckWidth >= 12) {
    recommendations.push({
      category: "Beam Size",
      current: "user should specify",
      recommended: "2x10 or 2x12 depending on span and post spacing",
      note: "Larger beams reduce deflection and support greater spans",
    });
  }

  // Footing depth guidance
  recommendations.push({
    category: "Footing Depth",
    current: "user should verify locally",
    recommended: "Extend below frost line (typically 36-48 inches in cold climates)",
    note: "Check with local building department for your area",
  });

  return recommendations;
}

// Extract numeric pitch value from "4:12" format
function extractPitchValue(pitchStr) {
  if (!pitchStr) return 0;
  const parts = pitchStr.split(":");
  return parts.length === 2 ? parseFloat(parts[0]) : 0;
}

// Generate permit requirement checklist based on project details
export function generatePermitChecklist(data, permitRequirements = []) {
  const checklist = {
    documentation: [
      { id: "planView", label: "Top-view plan drawing", required: true },
      { id: "elevation", label: "Side-elevation drawing", required: true },
      { id: "footing", label: "Footing/support detail", required: data.projectType === "Deck" },
      { id: "attachment", label: "Ledger/tie-in detail", required: data.isDeckAttached || data.tiedToExisting },
      { id: "stair", label: "Stair detail", required: data.numStairs > 0 },
      { id: "roof", label: "Roof pitch/material detail", required: ["Porch Roof", "Roof Over Existing Deck"].includes(data.projectType) },
      { id: "site", label: "Site plan/location", required: permitRequirements.some(r => r.includes("site")) },
      { id: "engineering", label: "Engineering review", required: permitRequirements.some(r => r.includes("engineering")) },
    ],
    inspections: [
      { id: "footing", label: "Footing/foundation inspection", required: true },
      { id: "framing", label: "Framing inspection", required: true },
      { id: "final", label: "Final inspection", required: true },
      { id: "roof", label: "Roof material inspection", required: ["Porch Roof", "Roof Over Existing Deck"].includes(data.projectType) },
    ],
  };

  return checklist;
}

// Calculate likely permit fees based on project scope
export function estimatePermitFeeRange(data) {
  const fees = [];

  // Base building permit
  let permitFee = 150;
  if (data.deckWidth && data.deckDepth) {
    const sqFt = (data.deckWidth * data.deckDepth);
    permitFee = Math.min(150 + sqFt * 0.5, 500); // Typical scaled fee
  }

  fees.push({
    name: "Building Permit",
    estimatedAmount: permitFee,
    type: "standard",
    confidence: "medium",
    note: "Based on square footage",
  });

  // Zoning/use fee
  fees.push({
    name: "Zoning Compliance Fee",
    estimatedAmount: 75,
    type: "standard",
    confidence: "medium",
  });

  // Inspection fees (per inspection)
  const inspectionCount = 3; // Typical for deck/roof
  fees.push({
    name: "Inspection Fees",
    estimatedAmount: 50 * inspectionCount,
    type: "per-inspection",
    confidence: "medium",
    note: "Estimate for " + inspectionCount + " inspections",
  });

  // Engineering review (if needed)
  if (data.footingCount < 4 || (data.roofWidth && data.roofWidth > 20)) {
    fees.push({
      name: "Engineering Review",
      estimatedAmount: 200,
      type: "optional",
      confidence: "low",
      note: "May be required for design review",
    });
  }

  return fees;
}

// Generate integrated warnings based on full project context
export function generateIntegratedWarnings(data, codeGuidance, structuralGuidance, permitRequirements) {
  const warnings = [];

  // Code-related warnings
  codeGuidance.forEach(item => {
    if (item.type === "warning") {
      warnings.push({
        type: "code",
        severity: "high",
        message: item.message,
        category: item.category,
      });
    }
  });

  // Structural warnings
  structuralGuidance.forEach(item => {
    if (item.recommended?.includes("⚠️")) {
      warnings.push({
        type: "structural",
        severity: "medium",
        message: item.recommended,
        category: item.category,
      });
    }
  });

  // Permit-related warnings
  if (permitRequirements.some(r => r.includes("engineering"))) {
    warnings.push({
      type: "permit",
      severity: "high",
      message: "Engineering review may be required for this design",
      category: "Structural",
    });
  }

  return warnings;
}