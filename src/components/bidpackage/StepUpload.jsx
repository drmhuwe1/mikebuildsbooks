import React, { useRef, useState, useCallback } from "react";

export default function StepUpload({ photo, onFile, onNext }) {
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    onFile(e.dataTransfer.files[0]);
  }, [onFile]);

  return (
    <div className="bp-card">
      <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, marginBottom: 6 }}>Upload Project Photo</h2>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
        Snap or upload a photo of the structure to bid. Our AI will analyze it and extract materials, structure, and costs.
      </p>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#f59e0b" : photo ? "#10b981" : "#334155"}`,
          borderRadius: 16, padding: "48px 24px", textAlign: "center", cursor: "pointer",
          background: dragging ? "#1a1a08" : photo ? "#0a1a0f" : "#0f172a",
          transition: "all 0.3s", minHeight: 200,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
        }}
      >
        {photo ? (
          <>
            <img src={photo} alt="Project" style={{ maxHeight: 280, maxWidth: "100%", borderRadius: 12, objectFit: "contain", marginBottom: 12 }} />
            <div style={{ color: "#10b981", fontSize: 14, fontWeight: 600 }}>✅ Photo loaded — AI will analyze this</div>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>Click to change photo</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Drop your project photo here</div>
            <div style={{ color: "#64748b", fontSize: 13 }}>or click to browse — JPG, PNG, WEBP</div>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => onFile(e.target.files[0])} />

      <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
        <button className="bp-btn-primary" onClick={onNext} disabled={!photo}>
          Next: Enter Measurements →
        </button>
      </div>
    </div>
  );
}