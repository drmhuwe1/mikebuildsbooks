import React, { useState, useRef, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Camera, FileUp, Wand2, Mail, RefreshCw,
  CheckCircle2, Users, Package, Clock, DollarSign,
  Printer, ArrowRight, Building2, Ruler, Loader2
} from "lucide-react";

const fmt = (n) => "$" + Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

function Stars({ v = 0 }) {
  const r = Math.round(v);
  return <span style={{ color: "#f59e0b", fontSize: 11 }}>{"★".repeat(r)}{"☆".repeat(5 - r)}</span>;
}

function AnalyzingSpinner({ mode }) {
  const steps = mode === "blueprint"
    ? ["Reading blueprint dimensions…", "Extracting material specs…", "Calculating quantities…", "Building cost estimate…", "Finalizing bid package…"]
    : ["Analyzing photo structure…", "Detecting materials & framing…", "Generating material schedule…", "Estimating costs…", "Building bid package…"];
  const [idx, setIdx] = useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setIdx(p => (p < steps.length - 1 ? p + 1 : p)), 2100);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ textAlign: "center", padding: "28px 20px" }}>
      <Loader2 style={{ width: 42, height: 42, margin: "0 auto 14px", color: "#6366f1", animation: "spin 0.9s linear infinite" }} />
      <p style={{ fontWeight: 700, color: "#1e293b", marginBottom: 6, fontSize: 14 }}>
        AI Analyzing Your {mode === "blueprint" ? "Blueprint" : "Photo"}…
      </p>
      <p style={{ fontSize: 13, color: "#6366f1", minHeight: 20 }}>{steps[idx]}</p>
      <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 14 }}>
        {steps.map((_, i) => (
          <div key={i} style={{ width: i <= idx ? 16 : 7, height: 7, borderRadius: 4, background: i <= idx ? "#6366f1" : "#e2e8f0", transition: "all 0.35s" }} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function PhotoBidGenerator({ settings = {}, onLineItemsGenerated, onAIDataGenerated }) {
  const { toast } = useToast();
  const photoRef = useRef();
  const blueprintRef = useRef();

  const { data: dbSubs = [] } = useQuery({
    queryKey: ["subcontractors"],
    queryFn: () => base44.entities.Subcontractor.list("-created_date", 100),
    retry: false,
  });

  // ── State ──────────────────────────────────────────────────────────────────
  const [inputMode, setInputMode] = useState("photo");
  const [photoFile, setPhotoFile]   = useState(null);
  const [photoURL, setPhotoURL]     = useState(null);
  const [bpFile, setBpFile]         = useState(null);
  const [bpName, setBpName]         = useState("");
  const [dragging, setDragging]     = useState(false);

  const [dims, setDims] = useState({ width: "", depth: "", height: "", notes: "" });
  const [markup, setMarkup]           = useState(settings.default_profit_margin ?? 20);
  const [contingency, setContingency] = useState(settings.default_contingency_percent ?? 10);

  const [selSubs, setSelSubs] = useState([]);
  const [subHrs, setSubHrs]   = useState({});

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult]       = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [synced, setSynced]       = useState(false);
  const [emailDlg, setEmailDlg]   = useState(false);
  const [emailTo, setEmailTo]     = useState("");

  // ── File handlers ──────────────────────────────────────────────────────────
  const setPhoto = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setPhotoFile(file);
    setPhotoURL(URL.createObjectURL(file));
    setResult(null); setSynced(false);
  }, []);

  const setBlueprint = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast({ title: "Please upload a PDF or image.", variant: "destructive" }); return;
    }
    setBpFile(file); setBpName(file.name);
    setResult(null); setSynced(false);
  }, [toast]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    inputMode === "photo" ? setPhoto(e.dataTransfer.files[0]) : setBlueprint(e.dataTransfer.files[0]);
  }, [inputMode, setPhoto, setBlueprint]);

  const toggleSub = (id) => {
    setSelSubs(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    if (!subHrs[id]) setSubHrs(p => ({ ...p, [id]: 8 }));
  };

  // ── AI Analysis via InvokeLLM ──────────────────────────────────────────────
  const analyze = async () => {
    const hasInput = inputMode === "photo" ? !!photoFile : !!bpFile;
    if (!hasInput) {
      toast({ title: `Upload a ${inputMode === "photo" ? "photo" : "blueprint"} first.`, variant: "destructive" });
      return;
    }
    setAnalyzing(true); setResult(null); setSynced(false);

    // Upload the file first to get a URL
    const fileToUpload = inputMode === "photo" ? photoFile : bpFile;
    const { file_url } = await base44.integrations.Core.UploadFile({ file: fileToUpload });

    const crew = dbSubs
      .filter(s => selSubs.includes(s.id))
      .map(s => `${s.name} (${s.specialty || "General"}) $${s.default_pay_rate || s.hourly_rate || 55}/hr × ${subHrs[s.id] || 8}hrs`);

    const dimText = [
      dims.width  && `Width: ${dims.width}'`,
      dims.depth  && `Depth: ${dims.depth}'`,
      dims.height && `Height: ${dims.height}'`,
    ].filter(Boolean).join(", ");

    const prompt = `You are an expert construction estimator. ${inputMode === "blueprint" ? `Analyze this blueprint (${bpName})` : "Analyze this project photo"} and generate a complete itemized contractor bid.

${dimText ? `Dimensions provided: ${dimText}` : "Estimate dimensions from the image."}
${dims.notes ? `Notes: ${dims.notes}` : ""}
Crew assigned: ${crew.length ? crew.join(", ") : "none — estimate labor generically"}
Markup: ${markup}% | Contingency: ${contingency}%

Use realistic 2025 US market prices. Material categories: Foundation, Framing, Decking, Roofing, Railing & Stairs, Hardware, Finishing.`;

    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [file_url],
      model: "claude_sonnet_4_6",
      response_json_schema: {
        type: "object",
        properties: {
          projectTitle:       { type: "string" },
          projectDescription: { type: "string" },
          structuralSummary:  { type: "object", properties: { footprint: { type: "string" }, squareFootage: { type: "number" }, deckHeight: { type: "string" }, roofType: { type: "string" }, roofPitch: { type: "string" }, totalHeight: { type: "string" }, estimatedDuration: { type: "string" } } },
          materials: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, size: { type: "string" }, material: { type: "string" }, qty: { type: "number" }, unit: { type: "string" }, unitCost: { type: "number" }, totalCost: { type: "number" }, notes: { type: "string" } } } }
              }
            }
          },
          laborBreakdown: {
            type: "array",
            items: { type: "object", properties: { phase: { type: "string" }, trade: { type: "string" }, hours: { type: "number" }, rate: { type: "number" }, total: { type: "number" }, assignedTo: { type: "string" } } }
          },
          timeline: {
            type: "array",
            items: { type: "object", properties: { day: { type: "number" }, phase: { type: "string" }, crew: { type: "array", items: { type: "string" } }, tasks: { type: "array", items: { type: "string" } }, hoursPerWorker: { type: "number" } } }
          },
          financials: { type: "object", properties: { materialSubtotal: { type: "number" }, laborSubtotal: { type: "number" }, subtotal: { type: "number" }, total: { type: "number" }, perSqFt: { type: "number" } } },
          buildNotes:  { type: "array", items: { type: "string" } },
          permitItems: { type: "array", items: { type: "string" } },
          riskFlags:   { type: "array", items: { type: "string" } },
          blueprintSpecs: { type: "object" },
        }
      }
    });

    // Recalculate financials with user markup/contingency
    const ms  = aiResult.financials?.materialSubtotal || 0;
    const ls  = aiResult.financials?.laborSubtotal    || 0;
    const sub = ms + ls;
    const mkA = Math.round(sub * markup / 100);
    const ctA = Math.round(sub * contingency / 100);
    aiResult.financials = { materialSubtotal: ms, laborSubtotal: ls, subtotal: sub, markupPct: markup, markupAmount: mkA, contingencyPct: contingency, contingencyAmount: ctA, total: sub + mkA + ctA, perSqFt: Math.round((sub + mkA + ctA) / (aiResult.structuralSummary?.squareFootage || 80)) };

    setResult(aiResult);
    setActiveTab("overview");
    setAnalyzing(false);
    toast({ title: "✅ Bid generated!", description: `${fmt(aiResult.financials.total)} total estimate ready.` });
  };

  // ── Sync to SmartBidBuilder ────────────────────────────────────────────────
  const syncToBid = () => {
    if (!result) return;
    const lineItems = [];
    (result.materials || []).forEach(cat =>
      (cat.items || []).forEach(item => lineItems.push({
        description: `${item.name}${item.size ? " — " + item.size : ""}`,
        category: "materials", estimatedCost: item.totalCost || 0,
      }))
    );
    (result.laborBreakdown || []).forEach(lb => lineItems.push({
      description: `${lb.phase} — ${lb.trade}${lb.assignedTo ? " (" + lb.assignedTo + ")" : ""}`,
      category: "labor", estimatedCost: lb.total || 0,
    }));

    onLineItemsGenerated?.(lineItems);
    onAIDataGenerated?.({
      projectDescription: result.projectDescription,
      estimatedDuration:  result.structuralSummary?.estimatedDuration,
      riskFlags:          result.riskFlags || [],
      blueprintSpecs:     result.blueprintSpecs,
      structuralSummary:  result.structuralSummary,
      timeline:           result.timeline,
      permitItems:        result.permitItems,
    });
    setSynced(true);
    toast({ title: "✅ Synced to bid!", description: "Line items added — review in Manual Builder tab." });
  };

  // ── Print ──────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    if (!result) return;
    const win = window.open("", "_blank");
    win.document.write(buildPrintHTML(result, dims, dbSubs, selSubs, subHrs, markup, contingency));
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 600);
  };

  // ── Email ──────────────────────────────────────────────────────────────────
  const sendEmail = () => {
    const f = result.financials;
    const body = encodeURIComponent(
      `PROJECT BID PROPOSAL\n${"=".repeat(40)}\n` +
      `Project: ${result.projectTitle}\n${result.projectDescription}\n\n` +
      `Materials: ${fmt(f.materialSubtotal)}\nLabor: ${fmt(f.laborSubtotal)}\nSubtotal: ${fmt(f.subtotal)}\n` +
      `Markup (${f.markupPct}%): ${fmt(f.markupAmount)}\nContingency (${f.contingencyPct}%): ${fmt(f.contingencyAmount)}\n` +
      `${"─".repeat(30)}\nTOTAL BID: ${fmt(f.total)}\nPer Sq Ft: ${fmt(f.perSqFt)}\n\n` +
      `Duration: ${result.structuralSummary?.estimatedDuration || "TBD"}\n\n` +
      `Build Notes:\n${(result.buildNotes || []).map(n => `• ${n}`).join("\n")}\n\n` +
      `Generated by Smart Bid Wizard · ${new Date().toLocaleDateString()}`
    );
    window.open(`mailto:${emailTo}?subject=${encodeURIComponent("Bid Proposal: " + result.projectTitle)}&body=${body}`);
    setEmailDlg(false);
  };

  const hasFile = inputMode === "photo" ? !!photoFile : !!bpFile;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 8 }}>
        {[{ id: "photo", icon: <Camera className="w-4 h-4" />, label: "Photo to Bid" }, { id: "blueprint", icon: <Building2 className="w-4 h-4" />, label: "Blueprint Upload" }].map(m => (
          <button key={m.id} onClick={() => { setInputMode(m.id); setResult(null); setSynced(false); }}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "8px 14px", borderRadius: 8, border: `2px solid ${inputMode === m.id ? "#6366f1" : "#e2e8f0"}`, background: inputMode === m.id ? "#eef2ff" : "#fff", color: inputMode === m.id ? "#4f46e5" : "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputMode === "photo" ? photoRef.current?.click() : blueprintRef.current?.click()}
        style={{ border: `2px dashed ${dragging ? "#6366f1" : hasFile ? "#10b981" : "#cbd5e1"}`, borderRadius: 12, padding: "24px 16px", textAlign: "center", cursor: "pointer", background: dragging ? "#eef2ff" : hasFile ? "#f0fdf4" : "#f8fafc", transition: "all 0.2s", minHeight: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        {inputMode === "photo" && photoURL ? (
          <><img src={photoURL} alt="Project" style={{ maxHeight: 180, maxWidth: "100%", borderRadius: 8, objectFit: "contain" }} /><p style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>✅ Photo ready · click to change</p></>
        ) : inputMode === "blueprint" && bpName ? (
          <><Building2 style={{ width: 34, height: 34, color: "#10b981" }} /><p style={{ fontWeight: 600, color: "#16a34a" }}>{bpName}</p><p style={{ fontSize: 12, color: "#64748b" }}>Click to change</p></>
        ) : (
          <>{inputMode === "photo" ? <Camera style={{ width: 32, height: 32, color: "#94a3b8" }} /> : <FileUp style={{ width: 32, height: 32, color: "#94a3b8" }} />}<p style={{ fontWeight: 600, color: "#475569" }}>{inputMode === "photo" ? "Drop project photo here" : "Drop blueprint (PDF or image)"}</p><p style={{ fontSize: 11, color: "#94a3b8" }}>{inputMode === "photo" ? "JPG · PNG · WEBP" : "PDF · JPG · PNG"}</p></>
        )}
      </div>
      <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => setPhoto(e.target.files[0])} />
      <input ref={blueprintRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={e => setBlueprint(e.target.files[0])} />

      {/* Dimensions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[["width","Width (ft)"],["depth","Depth (ft)"],["height","Height (ft)"]].map(([k,l]) => (
          <div key={k}><Label className="text-xs mb-1 block">{l}</Label><Input type="number" placeholder="—" value={dims[k]} onChange={e => setDims(p => ({...p,[k]:e.target.value}))} className="h-8 text-sm" /></div>
        ))}
      </div>
      <div>
        <Label className="text-xs mb-1 block">Notes / Special Requirements</Label>
        <Input placeholder="e.g. cedar decking, match existing roofline, fan rough-in…" value={dims.notes} onChange={e => setDims(p => ({...p,notes:e.target.value}))} className="h-8 text-sm" />
      </div>

      {/* Markup / Contingency */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[["markup","Markup %",markup,setMarkup,50,"#6366f1"],["contingency","Contingency %",contingency,setContingency,30,"#f59e0b"]].map(([id,label,val,set,max,color]) => (
          <div key={id}>
            <Label className="text-xs mb-1 block">{label} ({val}%)</Label>
            <input type="range" min={0} max={max} value={val} onChange={e => set(+e.target.value)} style={{ width: "100%", accentColor: color }} />
          </div>
        ))}
      </div>

      {/* Crew selector — only shown if there are subs */}
      {dbSubs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Assign Crew (optional)
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8 }}>
            {dbSubs.map(sub => {
              const sel = selSubs.includes(sub.id);
              const rate = sub.default_pay_rate || sub.hourly_rate || 55;
              return (
                <div key={sub.id} onClick={() => toggleSub(sub.id)}
                  style={{ border: `2px solid ${sel ? "#6366f1" : "#e2e8f0"}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer", background: sel ? "#eef2ff" : "#fff", transition: "all 0.18s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 13, color: sel ? "#4f46e5" : "#1e293b" }}>{sub.name}</p>
                      <p style={{ fontSize: 11, color: "#64748b" }}>{sub.specialty || "General"}</p>
                    </div>
                    {sel && <CheckCircle2 style={{ width: 14, height: 14, color: "#6366f1", flexShrink: 0 }} />}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>${rate}/hr</span>
                  </div>
                  {sel && (
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }} onClick={e => e.stopPropagation()}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>Hours:</span>
                      <input type="number" min={1} max={999} value={subHrs[sub.id] || 8}
                        onChange={e => setSubHrs(p => ({...p,[sub.id]:+e.target.value}))}
                        style={{ width: 52, border: "1px solid #6366f1", borderRadius: 6, padding: "2px 6px", fontSize: 12, fontWeight: 700, color: "#4f46e5", textAlign: "center" }} />
                      <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>{fmt(rate * (subHrs[sub.id] || 8))}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Generate */}
      <Button className="w-full gap-2" onClick={analyze} disabled={analyzing || !hasFile}
        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", height: 44, fontSize: 15, fontWeight: 700 }}>
        {analyzing
          ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing…</>
          : <><Wand2 className="w-4 h-4" /> Generate Full Bid from {inputMode === "photo" ? "Photo" : "Blueprint"}</>}
      </Button>

      {analyzing && <AnalyzingSpinner mode={inputMode} />}

      {/* ── Results ───────────────────────────────────────────────────────── */}
      {result && !analyzing && (
        <div style={{ borderTop: "2px solid #e2e8f0", paddingTop: 18 }}>

          {/* KPI strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(95px,1fr))", gap: 8, marginBottom: 12 }}>
            {[
              { icon: <Package className="w-4 h-4" />,    label: "Materials",  value: fmt(result.financials.materialSubtotal), color: "#f59e0b" },
              { icon: <Users className="w-4 h-4" />,      label: "Labor",      value: fmt(result.financials.laborSubtotal),    color: "#6366f1" },
              { icon: <DollarSign className="w-4 h-4" />, label: "Total Bid",  value: fmt(result.financials.total),            color: "#16a34a" },
              { icon: <Clock className="w-4 h-4" />,      label: "Duration",   value: result.structuralSummary?.estimatedDuration || "TBD", color: "#0ea5e9" },
              { icon: <Ruler className="w-4 h-4" />,      label: "Per Sq Ft", value: fmt(result.financials.perSqFt),          color: "#a855f7" },
            ].map(c => (
              <div key={c.label} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "9px 6px", textAlign: "center" }}>
                <div style={{ color: c.color, display: "flex", justifyContent: "center", marginBottom: 3 }}>{c.icon}</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>{c.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <Button onClick={syncToBid} disabled={synced} className="gap-1.5 flex-1"
              style={{ background: synced ? "#10b981" : "linear-gradient(135deg,#6366f1,#4f46e5)", minWidth: 150 }}>
              {synced ? <><CheckCircle2 className="w-4 h-4" /> Synced to Bid</> : <><ArrowRight className="w-4 h-4" /> Sync to Bid Estimate</>}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}><Printer className="w-3.5 h-3.5" /> Print / PDF</Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEmailDlg(true)}><Mail className="w-3.5 h-3.5" /> Email</Button>
          </div>

          {/* Detail tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full mb-3">
              {[["overview","Overview"],["materials","Materials"],["labor","Labor"],["timeline","Timeline"],["specs","Specs"]].map(([id,l]) => (
                <TabsTrigger key={id} value={id} className="text-xs">{l}</TabsTrigger>
              ))}
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview">
              <div className="space-y-3">
                <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.65 }}>{result.projectDescription}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", marginBottom: 8 }}>📐 Structure</p>
                    {Object.entries(result.structuralSummary || {}).map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", borderBottom: "1px solid #e2e8f0" }}>
                        <span style={{ color: "#64748b", textTransform: "capitalize" }}>{k.replace(/([A-Z])/g," $1")}</span>
                        <span style={{ fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#10b981", marginBottom: 6 }}>📋 Build Notes</p>
                    {(result.buildNotes || []).map((n, i) => <p key={i} style={{ fontSize: 11, color: "#475569", marginBottom: 4, paddingLeft: 8, borderLeft: "2px solid #10b981" }}>{n}</p>)}
                    {(result.permitItems || []).length > 0 && <>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", margin: "10px 0 6px" }}>🏛️ Permits</p>
                      {result.permitItems.map((n, i) => <p key={i} style={{ fontSize: 11, color: "#475569", marginBottom: 4, paddingLeft: 8, borderLeft: "2px solid #ef4444" }}>{n}</p>)}
                    </>}
                  </div>
                </div>
                {/* Financial summary */}
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", marginBottom: 8 }}>💰 Financial Breakdown</p>
                  {[["Materials", result.financials.materialSubtotal, "#f59e0b"],["Labor", result.financials.laborSubtotal, "#6366f1"],["Subtotal", result.financials.subtotal, "#475569"],[`Markup (${result.financials.markupPct}%)`, result.financials.markupAmount, "#a855f7"],[`Contingency (${result.financials.contingencyPct}%)`, result.financials.contingencyAmount, "#ef4444"]].map(([l,v,c]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: "1px solid #e2e8f0" }}>
                      <span style={{ color: "#64748b" }}>{l}</span><span style={{ fontWeight: 600, color: c }}>{fmt(v)}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, padding: "8px 0", fontWeight: 800 }}>
                    <span>TOTAL BID</span><span style={{ color: "#16a34a" }}>{fmt(result.financials.total)}</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Materials */}
            <TabsContent value="materials">
              <div style={{ overflowX: "auto" }}>
                {(result.materials || []).map(cat => (
                  <div key={cat.category} style={{ marginBottom: 14 }}>
                    <div style={{ background: "#fef9c3", borderLeft: "3px solid #f59e0b", padding: "4px 10px", borderRadius: "0 6px 6px 0", fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 5 }}>{cat.category}</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                      <thead><tr style={{ background: "#f8fafc" }}>{["Item","Size","Qty","Unit","Unit $","Total","Notes"].map(h => <th key={h} style={{ padding: "5px 7px", textAlign: "left", color: "#64748b", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {(cat.items || []).map((item, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "5px 7px", fontWeight: 500 }}>{item.name}</td>
                            <td style={{ padding: "5px 7px", color: "#64748b" }}>{item.size}</td>
                            <td style={{ padding: "5px 7px", color: "#f59e0b", fontWeight: 700 }}>{item.qty}</td>
                            <td style={{ padding: "5px 7px", color: "#94a3b8" }}>{item.unit}</td>
                            <td style={{ padding: "5px 7px" }}>{fmt(item.unitCost)}</td>
                            <td style={{ padding: "5px 7px", fontWeight: 700, color: "#16a34a" }}>{fmt(item.totalCost)}</td>
                            <td style={{ padding: "5px 7px", color: "#94a3b8", fontSize: 10 }}>{item.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
                <div style={{ textAlign: "right", fontWeight: 700, fontSize: 13, color: "#16a34a", padding: "6px 0", borderTop: "2px solid #fef08a" }}>Material Total: {fmt(result.financials.materialSubtotal)}</div>
              </div>
            </TabsContent>

            {/* Labor */}
            <TabsContent value="labor">
              <div className="space-y-2">
                {(result.laborBreakdown || []).map((lb, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 6, background: "#f8fafc", borderRadius: 8, padding: "9px 12px", alignItems: "center" }}>
                    <div><p style={{ fontWeight: 600, fontSize: 12 }}>{lb.phase}</p><p style={{ fontSize: 11, color: "#64748b" }}>{lb.trade}</p></div>
                    <div style={{ textAlign: "center" }}><p style={{ fontSize: 10, color: "#94a3b8" }}>Hrs</p><p style={{ fontWeight: 700, color: "#f59e0b", fontSize: 13 }}>{lb.hours}</p></div>
                    <div style={{ textAlign: "center" }}><p style={{ fontSize: 10, color: "#94a3b8" }}>Rate</p><p style={{ fontWeight: 600, color: "#6366f1", fontSize: 12 }}>${lb.rate}/hr</p></div>
                    <div style={{ textAlign: "center" }}><p style={{ fontSize: 10, color: "#94a3b8" }}>Assigned</p><p style={{ fontSize: 11, color: "#475569" }}>{lb.assignedTo}</p></div>
                    <div style={{ textAlign: "right" }}><p style={{ fontWeight: 700, color: "#16a34a", fontSize: 13 }}>{fmt(lb.total)}</p></div>
                  </div>
                ))}
                <div style={{ textAlign: "right", fontWeight: 700, fontSize: 13, color: "#16a34a", padding: "6px 0", borderTop: "2px solid #eef2ff" }}>Labor Total: {fmt(result.financials.laborSubtotal)}</div>
              </div>
            </TabsContent>

            {/* Timeline */}
            <TabsContent value="timeline">
              <div className="space-y-3">
                {(result.timeline || []).map((day, i) => (
                  <div key={i} style={{ display: "flex", gap: 10 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: "#eef2ff", border: "2px solid #6366f1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 9, color: "#6366f1" }}>DAY</span>
                      <span style={{ fontSize: 17, fontWeight: 800, color: "#4f46e5", lineHeight: 1 }}>{day.day}</span>
                    </div>
                    <div style={{ flex: 1, background: "#f8fafc", borderRadius: 10, padding: "9px 12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <p style={{ fontWeight: 600, fontSize: 12 }}>{day.phase}</p>
                        <span style={{ fontSize: 11, color: "#6366f1" }}>{day.hoursPerWorker}h/worker</span>
                      </div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 5 }}>
                        {(day.crew || []).map((c, j) => <span key={j} style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 600 }}>{c}</span>)}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                        {(day.tasks || []).map((t, j) => <p key={j} style={{ fontSize: 11, color: "#64748b" }}>• {t}</p>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Specs */}
            <TabsContent value="specs">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {Object.entries(result.blueprintSpecs || {}).map(([k, v]) => (
                  <div key={k} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px" }}>
                    <p style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, marginBottom: 3 }}>{k.replace(/([A-Z])/g," $1").replace(/spec/i,"").trim()}</p>
                    <p style={{ fontSize: 13, color: "#1e293b", fontWeight: 600 }}>{v}</p>
                  </div>
                ))}
              </div>
              {(result.riskFlags || []).length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>⚠️ Risk Flags</p>
                  {result.riskFlags.map((f, i) => (
                    <div key={i} style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 6, padding: "6px 10px", marginBottom: 4, fontSize: 12, color: "#9a3412" }}>{f}</div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Email dialog */}
      <Dialog open={emailDlg} onOpenChange={setEmailDlg}>
        <DialogContent>
          <DialogHeader><DialogTitle>Share Bid via Email</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label className="text-sm">Recipient Email</Label>
            <Input type="email" placeholder="client@example.com" value={emailTo} onChange={e => setEmailTo(e.target.value)} />
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, fontSize: 12, color: "#475569" }}>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>Email will include:</p>
              {["Full bid summary with financial breakdown","Material list and labor schedule","Build timeline","Risk flags and build notes"].map(l => <p key={l}>• {l}</p>)}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDlg(false)}>Cancel</Button>
            <Button onClick={sendEmail} disabled={!emailTo} className="gap-1.5"><Mail className="w-4 h-4" /> Open Email Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Print HTML ───────────────────────────────────────────────────────────────
function buildPrintHTML(result, dims, subs, selSubs, subHrs, markup, contingency) {
  const f = result.financials;
  const $ = n => "$" + Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

  const crewRows = subs.filter(s => selSubs.includes(s.id)).map(s => {
    const rate = s.default_pay_rate || s.hourly_rate || 55;
    return `<tr><td>${s.name}</td><td>${s.specialty||"General"}</td><td>$${rate}/hr</td><td>${subHrs[s.id]||8} hrs</td><td><strong>${$(rate*(subHrs[s.id]||8))}</strong></td></tr>`;
  }).join("") || `<tr><td colspan="5" style="color:#94a3b8;font-style:italic">No crew assigned — see labor breakdown</td></tr>`;

  const matSection = (result.materials||[]).map(cat =>
    `<tr><td colspan="7" style="background:#fef9c3;font-weight:700;padding:5px 8px;color:#92400e">${cat.category}</td></tr>` +
    (cat.items||[]).map((item,i)=>`<tr style="background:${i%2===0?"#fff":"#f9fafb"}"><td>${item.name}</td><td>${item.size||""}</td><td>${item.material||""}</td><td>${item.qty}</td><td>${item.unit}</td><td>${$(item.unitCost)}</td><td><strong>${$(item.totalCost)}</strong></td></tr>`).join("")
  ).join("");

  const laborRows = (result.laborBreakdown||[]).map(lb=>
    `<tr><td>${lb.phase}</td><td>${lb.trade}</td><td>${lb.assignedTo}</td><td>${lb.hours} hrs</td><td>$${lb.rate}/hr</td><td><strong>${$(lb.total)}</strong></td></tr>`
  ).join("");

  const tlRows = (result.timeline||[]).map(d=>
    `<tr><td style="text-align:center;font-weight:700">Day ${d.day}</td><td>${d.phase}</td><td>${(d.crew||[]).join(", ")}</td><td>${(d.tasks||[]).join("; ")}</td><td style="text-align:center">${d.hoursPerWorker}h</td></tr>`
  ).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Bid Package — ${result.projectTitle}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1e293b;padding:28px}h1{font-size:22px;font-weight:800;margin-bottom:3px}h2{font-size:13px;font-weight:700;margin:18px 0 7px;padding:4px 10px;background:#f1f5f9;border-left:3px solid #6366f1;border-radius:0 4px 4px 0}.header{border-bottom:3px solid #1e293b;padding-bottom:14px;margin-bottom:16px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:8px;font-size:12px}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}.kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px;text-align:center}.kpi .lbl{font-size:10px;color:#64748b}.kpi .val{font-size:16px;font-weight:800;margin-top:2px}table{width:100%;border-collapse:collapse;margin-bottom:10px;font-size:11px}th{background:#f1f5f9;padding:5px 8px;text-align:left;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0}td{padding:4px 8px;border-bottom:1px solid #f1f5f9}.fr{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f1f5f9;font-size:13px}.ft{display:flex;justify-content:space-between;padding:9px 0;font-size:16px;font-weight:800;border-top:2px solid #16a34a;color:#16a34a;margin-top:3px}.notes{font-size:11px;color:#64748b;margin-top:20px;padding-top:12px;border-top:1px solid #e2e8f0}@media print{body{padding:14px}}</style></head><body>
<div class="header"><h1>CONSTRUCTION BID PACKAGE</h1><div style="font-size:12px;color:#64748b">Smart Bid Wizard · AI-Generated Estimate</div>
<div class="meta"><div><span style="color:#64748b">Project: </span><strong>${result.projectTitle}</strong></div><div><span style="color:#64748b">Date: </span><strong>${new Date().toLocaleDateString()}</strong></div><div><span style="color:#64748b">Dimensions: </span><strong>${dims.width?dims.width+"' × "+dims.depth+"'":result.structuralSummary?.footprint||"See specs"}</strong></div><div><span style="color:#64748b">Duration: </span><strong>${result.structuralSummary?.estimatedDuration||"TBD"}</strong></div></div>
<p style="margin-top:10px;font-size:12px;color:#475569;line-height:1.6">${result.projectDescription}</p></div>
<div class="kpis"><div class="kpi"><div class="lbl">Materials</div><div class="val" style="color:#f59e0b">${$(f.materialSubtotal)}</div></div><div class="kpi"><div class="lbl">Labor</div><div class="val" style="color:#6366f1">${$(f.laborSubtotal)}</div></div><div class="kpi"><div class="lbl">TOTAL BID</div><div class="val" style="color:#16a34a">${$(f.total)}</div></div><div class="kpi"><div class="lbl">Per Sq Ft</div><div class="val" style="color:#a855f7">${$(f.perSqFt)}</div></div></div>
<h2>ASSIGNED CREW</h2><table><thead><tr><th>Name</th><th>Trade</th><th>Rate</th><th>Hours</th><th>Total</th></tr></thead><tbody>${crewRows}</tbody></table>
<h2>MATERIAL SCHEDULE</h2><table><thead><tr><th>Item</th><th>Size</th><th>Material</th><th>Qty</th><th>Unit</th><th>Unit Cost</th><th>Total</th></tr></thead><tbody>${matSection}</tbody></table>
<h2>LABOR BREAKDOWN</h2><table><thead><tr><th>Phase</th><th>Trade</th><th>Assigned To</th><th>Hours</th><th>Rate</th><th>Total</th></tr></thead><tbody>${laborRows}</tbody></table>
<h2>BUILD TIMELINE</h2><table><thead><tr><th style="width:60px">Day</th><th>Phase</th><th>Crew</th><th>Tasks</th><th>Hrs/Worker</th></tr></thead><tbody>${tlRows}</tbody></table>
<h2>FINANCIAL SUMMARY</h2><div style="max-width:380px">${[["Materials",f.materialSubtotal],["Labor",f.laborSubtotal],["Subtotal",f.subtotal],[`Markup (${f.markupPct}%)`,f.markupAmount],[`Contingency (${f.contingencyPct}%)`,f.contingencyAmount]].map(([l,v])=>`<div class="fr"><span>${l}</span><span>${$(v)}</span></div>`).join("")}<div class="ft"><span>TOTAL BID AMOUNT</span><span>${$(f.total)}</span></div></div>
${(result.buildNotes||[]).length?`<h2>BUILD NOTES</h2><ul style="padding-left:18px">${result.buildNotes.map(n=>`<li style="margin-bottom:4px;color:#475569;font-size:12px">${n}</li>`).join("")}</ul>`:""}
${(result.permitItems||[]).length?`<h2>PERMIT REQUIREMENTS</h2><ul style="padding-left:18px">${result.permitItems.map(n=>`<li style="margin-bottom:4px;color:#dc2626;font-size:12px">${n}</li>`).join("")}</ul>`:""}
${(result.riskFlags||[]).length?`<h2>RISK FLAGS</h2><ul style="padding-left:18px">${result.riskFlags.map(n=>`<li style="margin-bottom:4px;color:#ea580c;font-size:12px">⚠ ${n}</li>`).join("")}</ul>`:""}
<div class="notes">AI-generated estimate. Not a binding contract until signed. · ${new Date().toLocaleDateString()}</div>
</body></html>`;
}