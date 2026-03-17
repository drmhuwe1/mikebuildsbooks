import React, { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Edit2, Save, Copy, Download, Plus, Trash2, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { PRINT_CSS } from "@/lib/docStyles";
import { useToast } from "@/components/ui/use-toast";

export default function AdvancedContractEditor({ contract, company, onClose, onSave }) {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [templateData, setTemplateData] = useState({
    sections: [
      {
        id: "header",
        type: "header",
        content: {
          companyName: company?.company_name || "Company Name",
          companyAddress: company?.company_address || "",
          companyPhone: company?.company_phone || "",
          companyEmail: company?.company_email || "",
          companyEin: company?.company_ein || "",
          logoUrl: company?.company_logo_url || "",
          logoHeight: 45,
        },
      },
      {
        id: "info-grid",
        type: "info-grid",
        content: [
          { label: "Client / Owner", value: contract?.client_name || "" },
          { label: "Contractor", value: company?.company_name || "" },
          { label: "Contract Amount", value: `$${contract?.contract_amount || 0}` },
          { label: "Deposit Required", value: `$${contract?.deposit_amount || 0}` },
        ],
      },
      {
        id: "scope",
        type: "section",
        title: "Scope of Work",
        content: contract?.scope_summary || "Describe scope of work here...",
      },
      {
        id: "payment",
        type: "section",
        title: "Contract Amount & Payment Schedule",
        content: `${contract?.deposit_amount || 0} Deposit (Due upon acceptance)\n${(contract?.contract_amount || 0) - (contract?.deposit_amount || 0)} Final Payment (Due upon completion)`,
      },
    ],
  });
  const frameRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    updateSection(selectedElement, "logoUrl", file_url);
  };

  const updateSection = (sectionId, field, value) => {
    setTemplateData(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId
          ? field.includes(".")
            ? { ...s, content: { ...s.content, [field.split(".")[1]]: value } }
            : { ...s, [field]: value, content: { ...s.content, [field]: value } }
          : s
      ),
    }));
  };

  const addTextField = () => {
    const newId = `text-${Date.now()}`;
    setTemplateData(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: newId,
          type: "text",
          content: "New text field — click to edit",
        },
      ],
    }));
    setSelectedElement(newId);
  };

  const removeSection = (sectionId) => {
    setTemplateData(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId),
    }));
    setSelectedElement(null);
  };

  const saveTemplate = async () => {
    setSaving(true);
    try {
      await base44.entities.ContractTemplate.create({
        name: `${contract?.title} - Custom Template`,
        description: `Custom template for ${contract?.client_name}`,
        template_data: templateData,
        is_default: false,
      });
      toast({ title: "Template saved successfully" });
      onSave?.(templateData);
    } catch (err) {
      toast({ title: "Failed to save template", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const renderSection = (section) => {
    const isSelected = selectedElement === section.id;
    const baseClass = `${isSelected ? "border-2 border-primary bg-primary/5" : "border border-gray-200"} p-4 rounded cursor-pointer transition-all`;

    if (section.type === "header") {
      return (
        <div
          key={section.id}
          className={baseClass}
          onClick={() => setSelectedElement(section.id)}
        >
          <div className="flex gap-4">
            {section.content.logoUrl && (
              <div className="flex-shrink-0">
                <img
                  src={section.content.logoUrl}
                  alt="Logo"
                  style={{ maxHeight: `${section.content.logoHeight}px` }}
                  className="max-w-[150px]"
                />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold">{section.content.companyName}</h2>
              <p className="text-xs">{section.content.companyAddress}</p>
              <p className="text-xs">{section.content.companyPhone}</p>
              {section.content.companyEmail && <p className="text-xs">{section.content.companyEmail}</p>}
            </div>
          </div>
        </div>
      );
    }

    if (section.type === "info-grid") {
      return (
        <div
          key={section.id}
          className={baseClass}
          onClick={() => setSelectedElement(section.id)}
        >
          <div className="grid grid-cols-2 gap-4">
            {section.content.map((item, idx) => (
              <div key={idx}>
                <p className="text-xs font-semibold text-gray-600">{item.label}</p>
                <p className="font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (section.type === "text" || section.type === "section") {
      return (
        <div
          key={section.id}
          className={baseClass}
          onClick={() => setSelectedElement(section.id)}
        >
          {section.title && <h3 className="font-bold mb-2 text-sm">{section.title}</h3>}
          <p className="text-sm whitespace-pre-wrap">{section.content}</p>
        </div>
      );
    }

    return null;
  };

  const selectedData = templateData.sections.find(s => s.id === selectedElement);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant={editMode ? "default" : "outline"}
          onClick={() => setEditMode(!editMode)}
        >
          <Edit2 className="w-3.5 h-3.5 mr-1" />
          {editMode ? "View" : "Edit"}
        </Button>

        {editMode && (
          <>
            <Button size="sm" variant="outline" onClick={addTextField} className="gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Text
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => selectedElement && removeSection(selectedElement)}
              disabled={!selectedElement}
              className="gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
            <Button
              size="sm"
              onClick={saveTemplate}
              disabled={saving}
              className="gap-1"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save Template"}
            </Button>
          </>
        )}

        <Button size="sm" variant="outline" onClick={() => frameRef.current?.contentWindow.print()} className="gap-1">
          🖨️ Print
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose} className="ml-auto">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Editor Canvas */}
        <div className="col-span-2 space-y-3">
          {editMode ? (
            <>
              {templateData.sections.map(renderSection)}
            </>
          ) : (
            <iframe
              ref={frameRef}
              srcDoc={generatePreviewHTML(templateData, company)}
              className="w-full border rounded"
              style={{ height: "700px" }}
              title="Preview"
            />
          )}
        </div>

        {/* Properties Panel */}
        {editMode && selectedData && (
          <Card className="p-4 h-fit sticky top-4">
            <h3 className="font-semibold text-sm mb-4">Edit Element</h3>
            <div className="space-y-3">
              {selectedData.type === "header" && (
                <>
                  <div>
                    <Label className="text-xs">Company Name</Label>
                    <Input
                      size="sm"
                      value={selectedData.content.companyName}
                      onChange={e => updateSection(selectedElement, "content.companyName", e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Company Address</Label>
                    <Input
                      size="sm"
                      value={selectedData.content.companyAddress}
                      onChange={e => updateSection(selectedElement, "content.companyAddress", e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Company Phone</Label>
                    <Input
                      size="sm"
                      value={selectedData.content.companyPhone}
                      onChange={e => updateSection(selectedElement, "content.companyPhone", e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Company Email</Label>
                    <Input
                      size="sm"
                      value={selectedData.content.companyEmail}
                      onChange={e => updateSection(selectedElement, "content.companyEmail", e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Logo Height (px)</Label>
                    <Input
                      size="sm"
                      type="number"
                      value={selectedData.content.logoHeight}
                      onChange={e => updateSection(selectedElement, "content.logoHeight", parseInt(e.target.value))}
                      min="20"
                      max="100"
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Logo URL</Label>
                    <Input
                      size="sm"
                      value={selectedData.content.logoUrl}
                      onChange={e => updateSection(selectedElement, "content.logoUrl", e.target.value)}
                      placeholder="Paste image URL..."
                      className="text-xs h-8"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="mt-2 text-xs file:text-xs file:px-2 file:py-1 file:rounded file:border file:border-gray-300"
                    />
                  </div>
                </>
              )}

              {selectedData.type === "text" && (
                <div>
                  <Label className="text-xs">Text Content</Label>
                  <Textarea
                    value={selectedData.content}
                    onChange={e => updateSection(selectedElement, "content", e.target.value)}
                    rows={6}
                    className="text-xs"
                  />
                </div>
              )}

              {selectedData.type === "section" && (
                <>
                  <div>
                    <Label className="text-xs">Section Title</Label>
                    <Input
                      size="sm"
                      value={selectedData.title}
                      onChange={e => updateSection(selectedElement, "title", e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Content</Label>
                    <Textarea
                      value={selectedData.content}
                      onChange={e => updateSection(selectedElement, "content", e.target.value)}
                      rows={5}
                      className="text-xs"
                    />
                  </div>
                </>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function generatePreviewHTML(templateData, company) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
${PRINT_CSS}
</style>
</head>
<body>
<div class="doc-page">
  ${templateData.sections.map(section => {
    if (section.type === "header") {
      return `
        <div class="doc-header">
          <div class="doc-header-content">
            ${section.content.logoUrl ? `
            <div class="doc-header-logo">
              <img src="${section.content.logoUrl}" style="max-height: ${section.content.logoHeight}px;" alt="Logo" />
            </div>
            ` : ""}
            <div class="doc-header-company">
              <div class="company-name">${section.content.companyName}</div>
              <div class="company-meta">
                ${section.content.companyAddress}<br/>
                ${section.content.companyPhone}${section.content.companyEmail ? ` | ${section.content.companyEmail}` : ""}
              </div>
            </div>
          </div>
        </div>
      `;
    }
    if (section.type === "info-grid") {
      return `
        <div class="info-grid">
          ${section.content.map(item => `
            <div class="info-item">
              <label>${item.label}</label>
              <span>${item.value}</span>
            </div>
          `).join("")}
        </div>
      `;
    }
    if (section.type === "section" || section.type === "text") {
      return `
        ${section.title ? `<div class="section-title">${section.title}</div>` : ""}
        <div class="highlight-box"><p>${section.content.replace(/\n/g, "<br/>")}</p></div>
      `;
    }
    return "";
  }).join("")}
</div>
</body>
</html>`;
}