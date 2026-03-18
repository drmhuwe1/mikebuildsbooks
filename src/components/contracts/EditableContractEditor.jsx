import React, { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Edit2, Save, Copy, Download } from "lucide-react";
import { PRINT_CSS } from "@/lib/docStyles";

export default function EditableContractEditor({ contract, company, onSave, onClose }) {
  const [editMode, setEditMode] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editState, setEditState] = useState({
    companyName: company?.company_name || "",
    companyAddress: company?.company_address || "",
    companyPhone: company?.company_phone || "",
    companyEmail: company?.company_email || "",
    companyEin: company?.company_ein || "",
    logoUrl: company?.company_logo_url || "",
    logoHeight: 45,
    contractorName: company?.owner_name || "",
    clientName: contract?.client_name || "",
    clientLastName: "",
    scopeSummary: contract?.scope_summary || "",
    contractAmount: contract?.contract_amount || 0,
    depositAmount: contract?.deposit_amount || 0,
    finalPayment: contract?.contract_amount - (contract?.deposit_amount || 0),
    additionalNotes: contract?.notes || "",
    });

  const frameRef = useRef(null);

  const openEditField = (field, value) => {
    setEditingField(field);
    setEditValue(value);
  };

  const saveEditField = () => {
    setEditState(prev => ({ ...prev, [editingField]: editValue }));
    setEditingField(null);
  };

  const handlePrint = () => {
    if (frameRef.current) {
      frameRef.current.contentWindow.print();
    }
  };

  const handleDownload = () => {
    const element = frameRef.current?.contentDocument?.documentElement;
    if (element) {
      const html = element.outerHTML;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contract?.title || 'contract'}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${contract?.title}</title>
<style>
${PRINT_CSS}
.doc-edit-field { cursor: pointer; padding: 2px 4px; border-radius: 2px; }
.doc-edit-field:hover { background: rgba(255,255,0,0.1); }
.editable-text { user-select: all; }
</style>
</head>
<body>
<div class="doc-page">
  <div class="doc-header">
    <div class="doc-header-content">
      <div class="doc-header-logo-section">
        ${editState.logoUrl ? `<div class="doc-header-logo" style="cursor: pointer;" onclick="alert('Click Edit Mode to resize logo')">
          <img src="${editState.logoUrl}" alt="Company Logo" style="max-height: ${editState.logoHeight}px; width: auto; object-fit: contain;" />
        </div>` : ""}
        <div class="doc-header-company">
          <div class="company-name doc-edit-field">${editState.companyName}</div>
          <div class="company-meta doc-edit-field">
            ${editState.companyAddress}<br/>
            ${editState.companyPhone}${editState.companyEmail ? ` | ${editState.companyEmail}` : ""}
            ${editState.companyEin ? `<br/>${editState.companyEin}` : ""}
          </div>
        </div>
      </div>
      <div class="doc-header-right">
        <div class="doc-title">Construction Contract</div>
        <div class="doc-meta">
          Contract #: ${contract?.id?.slice(-6) || "000000"}<br/>
          Date: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
    </div>
  </div>

  <div style="margin-top: 24px;">
    <div class="info-grid">
      <div class="info-item"><label>Client / Owner</label><span class="doc-edit-field">${editState.clientName}</span></div>
      <div class="info-item"><label>Contractor</label><span class="doc-edit-field">${editState.companyName}</span></div>
      <div class="info-item"><label>Contract Amount</label><span class="doc-edit-field"><strong>\$${parseFloat(editState.contractAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span></div>
      <div class="info-item"><label>Deposit Required</label><span class="doc-edit-field">\$${parseFloat(editState.depositAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
    </div>

    <div class="section-title" style="margin-top: 28px;">Scope of Work</div>
    <div class="highlight-box doc-edit-field">${editState.scopeSummary.replace(/\n/g, '<br/>')}</div>

    <div class="section-title">Contract Amount & Payment Schedule</div>
    <div class="highlight-box">
      <p><strong>\$${parseFloat(editState.depositAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Deposit (Due upon acceptance)</strong></p>
      <p style="margin-left: 16px; margin-top: 6px;"><strong>\$${parseFloat(editState.finalPayment).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Final Payment (Due upon completion)</strong></p>
    </div>

    <div class="section-title">Terms & Conditions</div>
    <div class="highlight-box">
      <p>All work shall be performed in a professional and workmanlike manner in compliance with applicable building codes and regulations.</p>
    </div>

    <div class="signature-block">
      <div class="sig-title">Authorized Signatures</div>
      <div class="sig-grid">
        <div class="sig-column">
          <div class="sig-label">Contractor</div>
          <div class="sig-line"></div>
          <div class="sig-name">Signature & Date</div>
          <div class="sig-printed-name">${editState.contractorName}</div>
        </div>
        <div class="sig-column">
          <div class="sig-label">Client / Owner</div>
          <div class="sig-line"></div>
          <div class="sig-name">Signature & Date</div>
          <div class="sig-printed-name">${editState.clientName}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="doc-footer">
    <div class="doc-footer-content">
      <img src="https://media.base44.com/images/public/69b9774720c1d890b1162f57/77973bc53_MikeBuildsBooksLogo.png" alt="MikeBuildsBooks" class="doc-footer-mbb-logo" />
      <div class="doc-footer-slogan">Strong Builds. Stronger Books.</div>
    </div>
    <div class="doc-footer-meta">
      <span>${editState.companyName} | ${editState.companyAddress}</span>
      <span>Generated ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
    </div>
  </div>
</div>
</body>
</html>`;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant={editMode ? "default" : "outline"}
          onClick={() => setEditMode(!editMode)}
          className="gap-1.5"
        >
          <Edit2 className="w-3.5 h-3.5" />
          {editMode ? "Viewing" : "Edit Mode"}
        </Button>
        {editMode && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSave?.(editState)}
            className="gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save Changes
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5">
          🖨️ Print
        </Button>
        <Button size="sm" variant="outline" onClick={handleDownload} className="gap-1.5">
          <Download className="w-3.5 h-3.5" />
          Download
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose} className="ml-auto">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Edit Panel */}
      {editMode && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h4 className="font-semibold text-sm mb-3">Quick Edit Fields</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Company Name</Label>
              <Input
                size="sm"
                value={editState.companyName}
                onChange={e => setEditState(prev => ({ ...prev, companyName: e.target.value }))}
                className="text-xs h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Contractor Name (Signature)</Label>
              <Input
                size="sm"
                value={editState.contractorName}
                onChange={e => setEditState(prev => ({ ...prev, contractorName: e.target.value }))}
                className="text-xs h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Client Name</Label>
              <Input
                size="sm"
                value={editState.clientName}
                onChange={e => setEditState(prev => ({ ...prev, clientName: e.target.value }))}
                className="text-xs h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Contract Amount</Label>
              <Input
                size="sm"
                type="number"
                value={editState.contractAmount}
                onChange={e => setEditState(prev => ({ ...prev, contractAmount: parseFloat(e.target.value) || 0 }))}
                className="text-xs h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Deposit Amount</Label>
              <Input
                size="sm"
                type="number"
                value={editState.depositAmount}
                onChange={e => setEditState(prev => ({ ...prev, depositAmount: parseFloat(e.target.value) || 0 }))}
                className="text-xs h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Logo Height (px)</Label>
              <Input
                size="sm"
                type="number"
                value={editState.logoHeight}
                onChange={e => setEditState(prev => ({ ...prev, logoHeight: parseInt(e.target.value) || 45 }))}
                min="20"
                max="80"
                className="text-xs h-8"
              />
            </div>
          </div>
          <div className="mt-3">
            <Label className="text-xs">Scope of Work</Label>
            <Textarea
              value={editState.scopeSummary}
              onChange={e => setEditState(prev => ({ ...prev, scopeSummary: e.target.value }))}
              rows={3}
              className="text-xs"
            />
          </div>
          <div className="mt-3">
            <Label className="text-xs">Additional Notes</Label>
            <Textarea
              value={editState.additionalNotes}
              onChange={e => setEditState(prev => ({ ...prev, additionalNotes: e.target.value }))}
              rows={2}
              placeholder="Any additional notes or special information..."
              className="text-xs"
            />
          </div>
          </Card>
          )}

      {/* Contract Preview */}
      <div className="border rounded-lg overflow-hidden bg-gray-100 flex justify-center">
        <iframe
          ref={frameRef}
          srcDoc={htmlContent}
          className="w-full max-w-3xl"
          style={{ height: "700px", border: "none" }}
          title="Contract Preview"
        />
      </div>
    </div>
  );
}