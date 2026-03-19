import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff } from "lucide-react";

const STEPS = ["Legal Info", "Tax Classification", "Address", "Sign & Confirm"];

export default function W9Wizard({ contractor, onClose, onComplete }) {
  const canvasRef = useRef(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    w9_full_name: contractor.name || "",
    w9_business_name: contractor.company || "",
    w9_federal_classification: contractor.entity_type || "individual",
    address: contractor.address || "",
    city: "",
    state: "",
    zip: "",
    ssn_or_ein: contractor.ssn_or_ein || "",
    certification: false,
    signature: null,
    signatureData: null,
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [showSsn, setShowSsn] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Fix canvas coordinate scaling: CSS size != pixel size
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasMouseDown = (e) => {
    if (!canvasRef.current) return;
    setIsDrawing(true);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a1a1a";
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      set("signatureData", canvasRef.current.toDataURL());
    }
  };

  const clearSignature = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      set("signatureData", null);
    }
  };

  const handleComplete = () => {
    if (form.signatureData && form.w9_full_name && form.w9_federal_classification && form.address && form.certification) {
      onComplete(form);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return form.w9_full_name && form.w9_federal_classification;
      case 1: return form.w9_federal_classification;
      case 2: return form.address && form.city && form.state && form.zip;
      case 3: return form.signatureData && form.certification;
      default: return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">W-9 Form Collection</h2>
          <p className="text-xs font-semibold text-muted-foreground uppercase">Step {step + 1} of {STEPS.length}</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1 p-4 bg-muted">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <button
                onClick={() => setStep(i)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-green-600 text-white" : "bg-secondary text-secondary-foreground"
                }`}
              >
                {i < step ? <Check className="w-3 h-3 inline mr-1" /> : null}{s}
              </button>
              {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
            </React.Fragment>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {/* Step 0: Legal Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label>Legal Name (as shown on tax return) *</Label>
                <Input value={form.w9_full_name} onChange={e => set("w9_full_name", e.target.value)} placeholder="Full legal name" />
              </div>
              <div>
                <Label>Business Name (DBA if applicable)</Label>
                <Input value={form.w9_business_name} onChange={e => set("w9_business_name", e.target.value)} placeholder="Optional business name" />
              </div>
              <div>
                <Label>SSN or EIN *</Label>
                <div className="relative">
                  <Input
                    type={showSsn ? "text" : "password"}
                    value={form.ssn_or_ein}
                    onChange={e => set("ssn_or_ein", e.target.value)}
                    placeholder="SSN (XXX-XX-XXXX) or EIN"
                    className="pr-10"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSsn(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showSsn ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">This information is sensitive and protected.</p>
              </div>
            </div>
          )}

          {/* Step 1: Tax Classification */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Federal Tax Classification *</Label>
                <Select value={form.w9_federal_classification} onValueChange={v => set("w9_federal_classification", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual/Sole Proprietor</SelectItem>
                    <SelectItem value="llc">LLC</SelectItem>
                    <SelectItem value="s_corp">S Corporation</SelectItem>
                    <SelectItem value="c_corp">C Corporation</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">This determines your tax reporting category on the W-9.</p>
            </div>
          )}

          {/* Step 2: Address */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Street Address *</Label>
                <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Street address" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>City *</Label>
                  <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="City" />
                </div>
                <div>
                  <Label>State *</Label>
                  <Input value={form.state} onChange={e => set("state", e.target.value)} placeholder="State" maxLength="2" />
                </div>
                <div>
                  <Label>ZIP Code *</Label>
                  <Input value={form.zip} onChange={e => set("zip", e.target.value)} placeholder="ZIP" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Signature */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Digital Signature *</Label>
                <p className="text-xs text-muted-foreground mb-2">Sign your name in the box below using your mouse or trackpad</p>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={100}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  className="border-2 border-dashed border-border rounded-lg bg-white cursor-crosshair w-full"
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={clearSignature}>
                    Clear Signature
                  </Button>
                  {form.signatureData && <span className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Signature captured</span>}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-900 font-semibold mb-2">Certification Statement</p>
                <p className="text-xs text-yellow-800 mb-3">
                  I certify that the number shown on this form is my correct taxpayer identification number, and I am not subject to backup withholding. I certify that I am a U.S. person (including a U.S. resident alien), and I authorize this entity to file and/or send Form(s) 1099 reporting payments made to me to the IRS.
                </p>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.certification} onChange={e => set("certification", e.target.checked)} className="mt-1" />
                  <span className="text-xs text-yellow-900">I certify the above under penalty of perjury *</span>
                </label>
              </div>
            </div>
          )}

          {/* Summary Review */}
          {step === STEPS.length - 1 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2 text-sm">
              <p className="font-semibold text-blue-900">W-9 Information Summary</p>
              <div className="space-y-1 text-xs text-blue-800">
                <p><strong>Legal Name:</strong> {form.w9_full_name}</p>
                {form.w9_business_name && <p><strong>Business Name:</strong> {form.w9_business_name}</p>}
                <p><strong>Tax Classification:</strong> {form.w9_federal_classification}</p>
                <p><strong>Address:</strong> {form.address}, {form.city}, {form.state} {form.zip}</p>
                <p><strong>Signature:</strong> {form.signatureData ? "✓ Signed" : "✗ Not signed"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-2 p-6 border-t justify-between">
          <Button
            variant="outline"
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />{step > 0 ? "Back" : "Cancel"}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={!canProceed()} className="bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4 mr-1" /> Complete & Save W-9
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}