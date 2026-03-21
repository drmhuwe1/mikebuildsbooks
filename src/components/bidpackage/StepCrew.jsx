import React from "react";

function Stars({ rating }) {
  if (!rating) return null;
  const r = Math.round(rating);
  return (
    <span style={{ color: "#f59e0b", fontSize: 11 }}>
      {"★".repeat(r)}{"☆".repeat(5 - r)}
      <span style={{ color: "#94a3b8", marginLeft: 4 }}>{rating}</span>
    </span>
  );
}

function formatCurrency(n) {
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function StepCrew({ subcontractors, selectedSubs, subHours, onToggleSub, onHoursChange, onBack, onGenerate, loading }) {
  const totalLabor = selectedSubs.reduce((acc, id) => {
    const sub = subcontractors.find(s => s.id === id);
    if (!sub) return acc;
    const rate = sub.default_pay_rate || sub.hourly_rate || 50;
    return acc + rate * (subHours[id] || 8);
  }, 0);

  return (
    <div className="bp-card">
      <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, marginBottom: 6 }}>Assign Your Crew</h2>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
        Select subcontractors and their estimated hours. Rates pull from your subcontractor database.
      </p>

      {subcontractors.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👷</div>
          <p>No active subcontractors found.</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Add subcontractors in the Subcontractors section first, or proceed without assigning crew.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginBottom: 24 }}>
          {subcontractors.map(sub => {
            const sel = selectedSubs.includes(sub.id);
            const rate = sub.default_pay_rate || sub.hourly_rate || 50;
            const initials = (sub.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
            return (
              <div
                key={sub.id}
                className={`bp-sub-card ${sel ? "selected" : ""}`}
                onClick={() => onToggleSub(sub.id)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: sel ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "#1e293b",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0
                  }}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: sel ? "#f59e0b" : "#f1f5f9" }}>{sub.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{sub.specialty || "General"}</div>
                  </div>
                  {sel && <div style={{ fontSize: 18 }}>✅</div>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Stars rating={null} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#10b981" }}>${rate}/hr</span>
                </div>
                {sel && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }} onClick={e => e.stopPropagation()}>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>Hours:</span>
                    <input
                      type="number" min={1} max={500}
                      value={subHours[sub.id] || 8}
                      onChange={e => onHoursChange(sub.id, +e.target.value)}
                      style={{ width: 60, background: "#0f172a", border: "1px solid #f59e0b", borderRadius: 6, padding: "3px 6px", color: "#f59e0b", fontSize: 13, fontWeight: 700, textAlign: "center" }}
                    />
                  </div>
                )}
                {sel && (
                  <div style={{ padding: "6px 8px", background: "#0a0f1a", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "#64748b" }}>Est. Labor Cost:</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>{formatCurrency(rate * (subHours[sub.id] || 8))}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedSubs.length > 0 && (
        <div style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10 }}>Crew Summary</div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div><span style={{ fontSize: 12, color: "#64748b" }}>Workers: </span><span style={{ fontWeight: 700, color: "#f59e0b" }}>{selectedSubs.length}</span></div>
            <div><span style={{ fontSize: 12, color: "#64748b" }}>Total Hours: </span><span style={{ fontWeight: 700, color: "#f59e0b" }}>{selectedSubs.reduce((a, id) => a + (subHours[id] || 8), 0)}</span></div>
            <div><span style={{ fontSize: 12, color: "#64748b" }}>Est. Labor: </span><span style={{ fontWeight: 700, color: "#10b981" }}>{formatCurrency(totalLabor)}</span></div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button className="bp-btn-secondary" onClick={onBack}>← Back</button>
        <button className="bp-btn-primary" onClick={onGenerate} disabled={loading}>
          {loading ? "⏳ Generating Bid..." : "🧠 Generate Smart Bid →"}
        </button>
      </div>
    </div>
  );
}