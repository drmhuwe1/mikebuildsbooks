import React from "react";

export default function StepMeasurements({ measurements, onChange, markup, contingency, onMarkupChange, onContingencyChange, onBack, onNext }) {
  return (
    <div className="bp-card">
      <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, marginBottom: 6 }}>Project Measurements</h2>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
        Enter your key dimensions. The AI will fill in structural details from the photo.
      </p>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 }}>Project Type</label>
        <select 
          className="bp-input" 
          value={measurements.projectType || ''} 
          onChange={e => onChange({ ...measurements, projectType: e.target.value })}
          style={{ appearance: "none", paddingRight: 32 }}
        >
          <option value="">Select project type...</option>
          <option value="deck">Deck (open or covered)</option>
          <option value="deck-roof">Deck with Roof/Canopy</option>
          <option value="roof">Roof (house or addition)</option>
          <option value="fence">Fence or Railing</option>
          <option value="addition">Room Addition</option>
          <option value="garage">Garage</option>
          <option value="patio">Patio or Pergola</option>
          <option value="other">Other</option>
        </select>
      </div>

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

      {measurements.projectType === 'deck' || measurements.projectType === 'deck-roof' ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 }}>Deck Height (feet)</label>
            <input className="bp-input" type="number" value={measurements.deckHeight || ''} onChange={e => onChange({ ...measurements, deckHeight: e.target.value })} placeholder="e.g. 2-3 for ground level, 8-10 for elevated" />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 }}>Deck Surface Material</label>
            <select className="bp-input" value={measurements.deckMaterial || ''} onChange={e => onChange({ ...measurements, deckMaterial: e.target.value })}>
              <option value="">Select material...</option>
              <option value="pressure-treated">Pressure Treated Wood</option>
              <option value="cedar">Cedar/Composite</option>
              <option value="composite">Composite Decking</option>
              <option value="pvc">PVC/Vinyl</option>
            </select>
          </div>
        </div>
      ) : null}

      {measurements.projectType === 'deck-roof' || measurements.projectType === 'roof' ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 }}>Roof Type</label>
            <select className="bp-input" value={measurements.roofType || ''} onChange={e => onChange({ ...measurements, roofType: e.target.value })}>
              <option value="">Select roof type...</option>
              <option value="pitched">Pitched/Sloped Roof</option>
              <option value="flat">Flat Roof</option>
              <option value="shed">Shed Roof</option>
              <option value="gable">Gable Roof</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 }}>Roof Material</label>
            <select className="bp-input" value={measurements.roofMaterial || ''} onChange={e => onChange({ ...measurements, roofMaterial: e.target.value })}>
              <option value="">Select material...</option>
              <option value="asphalt">Asphalt Shingles</option>
              <option value="metal">Metal Roofing</option>
              <option value="wood">Wood Shakes</option>
              <option value="polycarbonate">Polycarbonate/Clear</option>
            </select>
          </div>
        </div>
      ) : null}

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 6 }}>Additional Notes & Specifications</label>
        <textarea
          className="bp-input"
          rows={3}
          value={measurements.notes}
          onChange={e => onChange({ ...measurements, notes: e.target.value })}
          placeholder="e.g. match existing roofline, add ceiling fan rough-in, stairs on east side, railing code requirements..."
          style={{ resize: "vertical" }}
        />
      </div>

      <div style={{ background: "#1a1a08", border: "1px solid #f59e0b44", borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 600, marginBottom: 8 }}>💡 AI will auto-detect from your photo:</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {["Structural details", "Hidden defects", "Material condition", "Code issues", "Grade/slope", "Existing conditions"].map(item => (
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