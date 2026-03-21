import React, { useState, useEffect } from "react";

const PHASES = [
  "🔍 Analyzing photo structure...",
  "📐 Detecting dimensions and materials...",
  "🏗️ Generating framing & roof plans...",
  "📦 Building material schedule...",
  "💰 Estimating costs...",
  "✅ Finalizing your Smart Bid...",
];

export default function WizardLoadingScreen() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(p => Math.min(p + 1, PHASES.length - 1)), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{
        width: 80, height: 80, border: "4px solid #1e293b", borderTop: "4px solid #f59e0b",
        borderRadius: "50%", margin: "0 auto 28px", animation: "spin 1s linear infinite"
      }} />
      <div style={{ fontSize: 18, color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: 12 }}>
        AI Analyzing Your Project
      </div>
      <div style={{ fontSize: 14, color: "#f59e0b", fontFamily: "monospace", minHeight: 24 }}>
        {PHASES[idx]}
      </div>
      <div style={{ marginTop: 24, display: "flex", gap: 8, justifyContent: "center" }}>
        {PHASES.map((_, i) => (
          <div key={i} style={{
            width: i <= idx ? 20 : 8, height: 8, borderRadius: 4,
            background: i <= idx ? "#10b981" : "#1e293b", transition: "all 0.4s"
          }} />
        ))}
      </div>
    </div>
  );
}