import React, { useState } from "react";
import { base44 } from "@/api/base44Client";

function formatCurrency(n) {
  return "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function StepBidReview({ bidData, markup, contingency, selectedSubs, subHours, subcontractors, measurements, settings, onNewBid, onEditCrew, onRecalculate }) {
  const [activeTab, setActiveTab] = useState("blueprint");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [regenerating, setRegenerating] = useState(false);

  const fin = bidData.financials || {};
  const struct = bidData.structuralSummary || {};

  const summaryCards = [
    { label: "Total Bid", value: formatCurrency(fin.total), color: "#10b981", icon: "💰" },
    { label: "Materials", value: formatCurrency(fin.materialSubtotal), color: "#f59e0b", icon: "📦" },
    { label: "Labor", value: formatCurrency(fin.laborSubtotal), color: "#3b82f6", icon: "👷" },
    { label: "Per Sq Ft", value: formatCurrency(fin.perSqFt), color: "#a855f7", icon: "📐" },
    { label: "Sq Footage", value: `${struct.squareFootage || 0} sqft`, color: "#06b6d4", icon: "🏗️" },
  ];

  const tabs = [
    { id: "blueprint", label: "🏗️ Blueprint" },
    { id: "summary", label: "📋 Summary" },
    { id: "materials", label: "📦 Materials" },
    { id: "labor", label: "👷 Labor" },
    { id: "timeline", label: "📅 Timeline" },
    { id: "financials", label: "💰 Financials" },
    { id: "bid", label: "📄 Full Bid" },
  ];

  const handleBlueprintFeedback = async () => {
    if (!feedbackMessage.trim()) return;
    setRegenerating(true);
    try {
      const response = await base44.functions.invoke('refineBlueprintFromFeedback', {
        currentBidData: bidData,
        userFeedback: feedbackMessage,
        dimensions: measurements,
      });
      if (response.data?.data) {
        Object.assign(bidData, response.data.data);
        setFeedbackMessage("");
      }
    } catch (err) {
      alert("Error refining blueprint: " + err.message);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div style={{ animation: "fadeUp 0.5s ease" }}>
      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {summaryCards.map(card => (
          <div key={card.label} style={{ background: "#0f172a", border: `1px solid ${card.color}33`, borderRadius: 14, padding: "16px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 22 }}>{card.icon}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{card.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: card.color, marginTop: 2 }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Tab Nav */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} className="bp-tab" onClick={() => setActiveTab(t.id)} style={{
            background: activeTab === t.id ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "#1e293b",
            color: activeTab === t.id ? "#fff" : "#94a3b8",
            border: "none",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Blueprint Tab ── */}
      {activeTab === "blueprint" && (
        <div className="bp-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif" }}>Extracted Blueprint Analysis</h3>
            <button className="bp-btn-secondary" style={{ fontSize: 13 }} onClick={() => {
              const element = document.getElementById('blueprint-print');
              const printWindow = window.open('', '', 'height=800,width=900');
              printWindow.document.write('<html><head><title>Blueprint Analysis</title>');
              printWindow.document.write('<style>body { font-family: Arial; background: #fff; color: #000; margin: 20px; } h3 { font-size: 18px; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #333; padding-bottom: 5px; } div { margin-bottom: 15px; } .spec-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #ddd; } .label { font-weight: bold; } .risk { margin: 10px 0; padding: 10px; background: #fff3cd; border-left: 4px solid #ff6b6b; }</style>');
              printWindow.document.write('</head><body>');
              printWindow.document.write(element.innerHTML);
              printWindow.document.write('</body></html>');
              printWindow.document.close();
              printWindow.print();
            }}>
              🖨️ Print / Export PDF
            </button>
          </div>
          <div id="blueprint-print">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={{ background: "#0a0f1a", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 600, marginBottom: 12 }}>📐 Structural Dimensions</div>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1e293b" }}>
                  <span style={{ color: "#64748b" }}>Footprint</span>
                  <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{struct.footprint || "N/A"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1e293b" }}>
                  <span style={{ color: "#64748b" }}>Square Footage</span>
                  <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{struct.squareFootage || 0} sqft</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1e293b" }}>
                  <span style={{ color: "#64748b" }}>Deck Height</span>
                  <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{struct.deckHeight || "N/A"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1e293b" }}>
                  <span style={{ color: "#64748b" }}>Total Height</span>
                  <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{struct.totalHeight || "N/A"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                  <span style={{ color: "#64748b" }}>Estimated Duration</span>
                  <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{struct.estimatedDuration || "N/A"}</span>
                </div>
              </div>
            </div>
            <div style={{ background: "#0a0f1a", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, color: "#3b82f6", fontWeight: 600, marginBottom: 12 }}>🏗️ Building Specifications</div>
              {bidData.blueprintSpecs && Object.entries(bidData.blueprintSpecs).map(([key, value]) => (
                <div key={key} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #1e293b" }}>
                  <div style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize", marginBottom: 4 }}>{key.replace(/([A-Z])/g, " $1")}</div>
                  <div style={{ fontSize: 13, color: "#f1f5f9" }}>{value || "Not specified"}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#0a0f1a", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 13, color: "#ef4444", fontWeight: 600, marginBottom: 12 }}>⚠️ Risk Flags</div>
            {(bidData.riskFlags || []).length > 0 ? (
              <div style={{ display: "grid", gap: 8 }}>
                {bidData.riskFlags.map((flag, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: 10, background: "#1e0a0a", borderRadius: 8, borderLeft: "3px solid #ef4444" }}>
                    <span style={{ fontSize: 20 }}>⚡</span>
                    <span style={{ color: "#fca5a5", fontSize: 13 }}>{flag}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#64748b", fontSize: 13 }}>No significant risk flags identified.</p>
            )}
          </div>
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "2px solid #1e293b" }}>
            <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 600, marginBottom: 12 }}>💬 Refine Blueprint with AI</div>
            <textarea
              value={feedbackMessage}
              onChange={e => setFeedbackMessage(e.target.value)}
              placeholder="e.g., 'Make it 2 feet wider', 'Add a covered porch on the east side', 'Change roof pitch to 6:12'"
              style={{
                width: "100%", height: 80, background: "#0a0f1a", border: "1px solid #334155", borderRadius: 8,
                padding: 10, color: "#f1f5f9", fontSize: 13, fontFamily: "monospace", resize: "none"
              }}
            />
            <button
              className="bp-btn-primary"
              onClick={handleBlueprintFeedback}
              disabled={!feedbackMessage.trim() || regenerating}
              style={{ marginTop: 10 }}
            >
              {regenerating ? "🧠 AI Redesigning..." : "✨ Apply Changes"}
            </button>
          </div>
          </div>
        </div>
      )}

      {/* ── Summary Tab ── */}
      {activeTab === "summary" && (
        <div className="bp-card">
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", color: "#f59e0b", marginBottom: 4 }}>{bidData.projectTitle}</h3>
          <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 20 }}>{bidData.projectDescription}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div style={{ background: "#0a0f1a", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 600, marginBottom: 10 }}>📐 Structural Summary</div>
              {Object.entries(struct).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #1e293b", fontSize: 13 }}>
                  <span style={{ color: "#64748b", textTransform: "capitalize" }}>{k.replace(/([A-Z])/g, " $1")}</span>
                  <span style={{ color: "#f1f5f9", fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "#0a0f1a", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, color: "#10b981", fontWeight: 600, marginBottom: 10 }}>📋 Build Notes</div>
              {(bidData.buildNotes || []).map((n, i) => (
                <div key={i} style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, paddingLeft: 12, borderLeft: "2px solid #10b981" }}>{n}</div>
              ))}
              <div style={{ fontSize: 13, color: "#ef4444", fontWeight: 600, margin: "14px 0 8px" }}>🏛️ Permit Items</div>
              {(bidData.permitItems || []).map((n, i) => (
                <div key={i} style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4, paddingLeft: 12, borderLeft: "2px solid #ef4444" }}>{n}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Materials Tab ── */}
      {activeTab === "materials" && (
        <div className="bp-card" style={{ overflowX: "auto" }}>
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", marginBottom: 16 }}>Material Schedule</h3>
          {(bidData.materials || []).length === 0 ? (
            <div style={{ color: "#64748b", textAlign: "center", padding: "20px" }}>No materials data available</div>
          ) : (
            (bidData.materials || []).map(cat => {
              const catItems = (cat.items || []).filter(item => item.name && item.qty > 0);
              if (catItems.length === 0) return null;
              return (
                <div key={cat.category} style={{ marginBottom: 20 }}>
                  <div style={{ background: "linear-gradient(90deg,#f59e0b22,transparent)", borderLeft: "3px solid #f59e0b", padding: "6px 12px", borderRadius: "0 8px 8px 0", fontSize: 13, fontWeight: 700, color: "#f59e0b", marginBottom: 8 }}>
                    {cat.category}
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ color: "#64748b" }}>
                        {["Item", "Size", "Material", "Qty", "Unit", "Unit $", "Total", "Notes"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #1e293b", fontWeight: 500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {catItems.map((item, i) => (
                        <tr key={i} className="mat-row" style={{ background: i % 2 === 0 ? "#0a0f1a" : "transparent" }}>
                          <td style={{ padding: "7px 8px", color: "#f1f5f9", fontWeight: 500 }}>{item.name}</td>
                          <td style={{ padding: "7px 8px", color: "#94a3b8" }}>{item.size || "-"}</td>
                          <td style={{ padding: "7px 8px", color: "#94a3b8" }}>{item.material || "-"}</td>
                          <td style={{ padding: "7px 8px", color: "#f59e0b", fontWeight: 700 }}>{item.qty}</td>
                          <td style={{ padding: "7px 8px", color: "#64748b" }}>{item.unit}</td>
                          <td style={{ padding: "7px 8px", color: "#94a3b8" }}>{formatCurrency(item.unitCost)}</td>
                          <td style={{ padding: "7px 8px", color: "#10b981", fontWeight: 700 }}>{formatCurrency(item.totalCost)}</td>
                          <td style={{ padding: "7px 8px", color: "#475569", fontSize: 11 }}>{item.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, padding: "12px 8px", borderTop: "2px solid #f59e0b33" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#10b981" }}>Material Subtotal: {formatCurrency(fin.materialSubtotal)}</div>
          </div>
        </div>
      )}

      {/* ── Labor Tab ── */}
      {activeTab === "labor" && (
        <div className="bp-card">
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", marginBottom: 16 }}>Labor Breakdown</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {(bidData.laborBreakdown || []).map((lb, i) => (
              <div key={i} style={{ background: "#0a0f1a", borderRadius: 12, padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 8, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{lb.phase}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{lb.trade}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Hours</div>
                  <div style={{ fontWeight: 700, color: "#f59e0b" }}>{lb.hours}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Rate</div>
                  <div style={{ fontWeight: 700, color: "#3b82f6" }}>${lb.rate}/hr</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Assigned</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{lb.assignedTo}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Total</div>
                  <div style={{ fontWeight: 700, color: "#10b981", fontSize: 15 }}>{formatCurrency(lb.total)}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, padding: "12px 8px", borderTop: "2px solid #3b82f633" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#10b981" }}>Labor Subtotal: {formatCurrency(fin.laborSubtotal)}</div>
          </div>
        </div>
      )}

      {/* ── Timeline Tab ── */}
      {activeTab === "timeline" && (
        <div className="bp-card">
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", marginBottom: 16 }}>Build Timeline</h3>
          <div style={{ display: "grid", gap: 12 }}>
            {(bidData.timeline || []).map((day, i) => (
              <div key={i} style={{ display: "flex", gap: 8 }}>
                <div style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 12, background: "linear-gradient(135deg,#f59e0b22,#ef444422)", border: "2px solid #f59e0b44", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 10, color: "#64748b" }}>DAY</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#f59e0b" }}>{day.day}</div>
                </div>
                <div style={{ flex: 1, background: "#0a0f1a", borderRadius: 12, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, color: "#f1f5f9" }}>{day.phase}</div>
                    <div style={{ fontSize: 12, color: "#3b82f6" }}>{day.hoursPerWorker}hrs/worker</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                    {(day.crew || []).map((c, j) => (
                      <span key={j} style={{ background: "#1e293b", borderRadius: 20, padding: "2px 10px", fontSize: 11, color: "#94a3b8" }}>{c}</span>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                    {(day.tasks || []).map((t, j) => (
                      <div key={j} style={{ fontSize: 12, color: "#64748b" }}>• {t}</div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Financials Tab ── */}
      {activeTab === "financials" && (
        <div className="bp-card">
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", marginBottom: 16 }}>Financial Summary</h3>
          <div style={{ maxWidth: 480 }}>
            {[
              { label: "Materials Subtotal", value: fin.materialSubtotal, color: "#f59e0b" },
              { label: "Labor Subtotal", value: fin.laborSubtotal, color: "#3b82f6" },
              { label: "Project Subtotal", value: fin.subtotal, color: "#f1f5f9", bold: true },
              { label: `Markup (${markup}%)`, value: fin.markup, color: "#a855f7" },
              { label: `Contingency (${contingency}%)`, value: fin.contingency, color: "#ef4444" },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #1e293b" }}>
                <span style={{ fontSize: 14, color: "#94a3b8" }}>{row.label}</span>
                <span style={{ fontSize: 15, fontWeight: row.bold ? 700 : 600, color: row.color }}>{formatCurrency(row.value)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0", borderTop: "2px solid #10b981" }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#10b981" }}>TOTAL BID</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#10b981" }}>{formatCurrency(fin.total)}</span>
            </div>
            <div style={{ padding: "12px 0", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "#64748b" }}>Cost per Square Foot</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#a855f7" }}>{formatCurrency(fin.perSqFt)}/sqft</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Full Bid Tab ── */}
      {activeTab === "bid" && (
        <div className="bp-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif" }}>Complete Bid Document</h3>
            <button className="bp-btn-secondary" style={{ fontSize: 13 }} onClick={() => window.print()}>🖨️ Print / Export PDF</button>
          </div>
          <div style={{ background: "#fff", color: "#111", borderRadius: 12, padding: 32, fontFamily: "Georgia, serif" }}>
            <div style={{ borderBottom: "3px solid #1e293b", paddingBottom: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>CONSTRUCTION BID PROPOSAL</div>
              <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>{settings.company_name || "Smart Bid Wizard"} — AI-Generated Estimate</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12, fontSize: 13 }}>
                <div><strong>Project:</strong> {bidData.projectTitle}</div>
                <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                <div><strong>Dimensions:</strong> {measurements.width}' × {measurements.depth}'</div>
                <div><strong>Square Footage:</strong> {struct.squareFootage} sqft</div>
              </div>
            </div>
            <div style={{ fontSize: 14, marginBottom: 20, lineHeight: 1.6, color: "#333" }}>{bidData.projectDescription}</div>

            {subcontractors.filter(s => selectedSubs.includes(s.id)).length > 0 && (
              <>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, borderLeft: "4px solid #f59e0b", paddingLeft: 10 }}>ASSIGNED CREW</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 24 }}>
                  <thead><tr style={{ background: "#f5f5f5" }}>{["Name", "Trade", "Rate", "Hours", "Total"].map(h => <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {subcontractors.filter(s => selectedSubs.includes(s.id)).map(sub => {
                      const rate = sub.default_pay_rate || sub.hourly_rate || 50;
                      return (
                        <tr key={sub.id} style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "6px 10px" }}>{sub.name}</td>
                          <td style={{ padding: "6px 10px", color: "#666" }}>{sub.specialty || "General"}</td>
                          <td style={{ padding: "6px 10px" }}>${rate}/hr</td>
                          <td style={{ padding: "6px 10px" }}>{subHours[sub.id] || 8}</td>
                          <td style={{ padding: "6px 10px", fontWeight: 700 }}>{formatCurrency(rate * (subHours[sub.id] || 8))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}

            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, borderLeft: "4px solid #3b82f6", paddingLeft: 10 }}>COST SUMMARY</div>
            <table style={{ width: "100%", fontSize: 14, marginBottom: 20 }}>
              <tbody>
                {[
                  ["Materials", fin.materialSubtotal],
                  ["Labor", fin.laborSubtotal],
                  ["Subtotal", fin.subtotal],
                  [`Markup (${markup}%)`, fin.markup],
                  [`Contingency (${contingency}%)`, fin.contingency],
                ].map(([l, v]) => (
                  <tr key={l} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "6px 0", color: "#555" }}>{l}</td>
                    <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 600 }}>{formatCurrency(v)}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: "12px 0", fontWeight: 800, fontSize: 18 }}>TOTAL BID AMOUNT</td>
                  <td style={{ padding: "12px 0", textAlign: "right", fontWeight: 800, fontSize: 20, color: "#16a34a" }}>{formatCurrency(fin.total)}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid #ddd", fontSize: 11, color: "#999" }}>
              This bid was generated by Smart Bid Wizard AI. Prices are estimates based on current market rates and photo analysis. Final costs may vary. Contractor signature required for binding agreement.
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <button className="bp-btn-secondary" onClick={onNewBid}>+ New Bid</button>
        <button className="bp-btn-secondary" onClick={onEditCrew}>← Edit Crew</button>
        <button className="bp-btn-secondary" onClick={onRecalculate}>↻ Recalculate</button>
        <button className="bp-btn-primary" style={{ marginLeft: "auto" }} onClick={() => window.print()}>
          🖨️ Print / Export PDF
        </button>
      </div>
    </div>
  );
}