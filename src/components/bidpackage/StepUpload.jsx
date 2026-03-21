import React, { useRef, useState, useCallback } from "react";

export default function StepUpload({ photo, fileName, onFile, onNext }) {
  const [dragging, setDragging] = useState(false);
  const [generatingBlueprints, setGeneratingBlueprints] = useState(false);
  const fileRef = useRef();

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    onFile(e.dataTransfer.files[0]);
  }, [onFile]);

  const isLoaded = !!photo || !!fileName;

  const handleGenerateBlueprints = async () => {
    if (!photo) {
      alert("Please upload a design photo first");
      return;
    }
    
    setGeneratingBlueprints(true);
    try {
      const response = await base44.functions.invoke('generateBlueprintsFromDesignPhoto', {
        photoUrl: photo,
        width: 8,
        depth: 10,
        designNotes: ''
      });
      
      if (response.data) {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'blueprints.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert("Error generating blueprints: " + err.message);
    } finally {
      setGeneratingBlueprints(false);
    }
  };

  return (
    <div className="bp-card">
      <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, marginBottom: 6 }}>Upload Project File</h2>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
        Upload a photo of the structure <strong style={{ color: "#94a3b8" }}>or a PDF blueprint</strong>. Our AI will analyze it and extract materials, structure, and costs.
      </p>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#f59e0b" : isLoaded ? "#10b981" : "#334155"}`,
          borderRadius: 16, padding: "48px 24px", textAlign: "center", cursor: "pointer",
          background: dragging ? "#1a1a08" : isLoaded ? "#0a1a0f" : "#0f172a",
          transition: "all 0.3s", minHeight: 200,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
        }}
      >
        {photo ? (
          <>
            <img src={photo} alt="Project" style={{ maxHeight: 280, maxWidth: "100%", borderRadius: 12, objectFit: "contain", marginBottom: 12 }} />
            <div style={{ color: "#10b981", fontSize: 14, fontWeight: 600 }}>✅ Photo loaded — AI will analyze this</div>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>Click to change file</div>
          </>
        ) : fileName ? (
          <>
            <div style={{ fontSize: 56, marginBottom: 12 }}>📄</div>
            <div style={{ color: "#10b981", fontSize: 15, fontWeight: 700 }}>{fileName}</div>
            <div style={{ color: "#10b981", fontSize: 13, marginTop: 4 }}>✅ PDF blueprint loaded — AI will analyze this</div>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>Click to change file</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Drop your project photo or blueprint here</div>
            <div style={{ color: "#64748b", fontSize: 13, marginBottom: 12 }}>or click to browse</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              {["📷 JPG / PNG / WEBP", "📄 PDF Blueprint"].map(tag => (
                <span key={tag} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "4px 12px", fontSize: 12, color: "#94a3b8" }}>
                  {tag}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        style={{ display: "none" }}
        onChange={e => onFile(e.target.files[0])}
      />

      <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
        <button className="bp-btn-primary" onClick={onNext} disabled={!isLoaded}>
          Next: Enter Measurements →
        </button>
      </div>
    </div>
  );
}