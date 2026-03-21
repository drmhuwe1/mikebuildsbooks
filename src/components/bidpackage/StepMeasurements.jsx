import React from "react";

export default function StepMeasurements({ measurements, onChange, markup, contingency, onMarkupChange, onContingencyChange, onBack, onNext }) {
  return (
    <div className="bp-card">
      <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, marginBottom: 6 }}>Project Measurements</h2>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
        Enter your key dimensions. The AI will fill in structural details from the photo.
      </p>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 }}>Project Address</label>
        <input 
          className="bp-input" 
          type="text" 
          value={measurements.address || ''} 
          onChange={e => onChange({ ...measurements, address: e.target.value })} 
          placeholder="123 Main St, City, State 12345"
        />
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>AI will research local permits, zoning, and fees for this location</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 }}>Width (feet)</label>
          <input className="bp-input" type="number" value={measurements.width} onChange={e => onChange({ ...measurements, width: e.target.value })} placeholder="10" />
        </div>
        <div>
          <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 }}>Depth (feet)</label>
          <input className="bp-input" type="number" value={measurements.depth} onChange={e => onChange({ ...measurements, depth: e.target.value })} placeholder="8" />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 }}>Additional Notes (optional)</label>
        <textarea
          className="bp-input"
          rows={3}
          value={measurements.notes}
          onChange={e => onChange({ ...measurements, notes: e.target.value })}
          placeholder="e.g. cedar decking preferred, match existing roofline, add ceiling fan rough-in..."
          style={{ resize: "vertical" }}
        />
      </div>

      <div style={{ background: "#1a1a08", border: "1px solid #f59e0b44", borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 600, marginBottom: 8 }}>💡 AI will auto-detect from your photo:</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {["Roof type & pitch", "Post/beam layout", "Railing style", "Stair configuration", "Material types", "Hardware requirements"].map(item => (
            <div key={item} style={{ fontSize: 12, color: "#94a3b8" }}>✓ {item}</div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        <div>
          <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 }}>Your Markup %</label>
          <input className="bp-input" type="number" value={markup} onChange={e => onMarkupChange(+e.target.value)} min={0} max={100} />
        </div>
        <div>
          <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 }}>Contingency %</label>
          <input className="bp-input" type="number" value={contingency} onChange={e => onContingencyChange(+e.target.value)} min={0} max={50} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button className="bp-btn-secondary" onClick={onBack}>← Back</button>
        <button className="bp-btn-primary" onClick={onNext}>Next: Assign Crew →</button>
      </div>
    </div>
  );
}