import React from "react";

const STEPS = ["📸 Upload", "📐 Measurements", "👷 Crew", "🧾 Bid Review"];

export default function WizardStepBar({ step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 32 }}>
      {STEPS.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              background: i < step ? "#10b981" : i === step ? "#f59e0b" : "#1e293b",
              border: `2px solid ${i === step ? "#f59e0b" : i < step ? "#10b981" : "#334155"}`,
              fontSize: 16, transition: "all 0.3s",
              boxShadow: i === step ? "0 0 16px #f59e0b55" : "none",
            }}>
              {i < step ? "✓" : s.split(" ")[0]}
            </div>
            <span style={{ fontSize: 10, color: i === step ? "#f59e0b" : i < step ? "#10b981" : "#64748b", whiteSpace: "nowrap" }}>
              {s.split(" ").slice(1).join(" ")}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ width: 60, height: 2, background: i < step ? "#10b981" : "#1e293b", margin: "0 4px", marginBottom: 20, transition: "background 0.3s" }} />
          )}
        </div>
      ))}
    </div>
  );
}