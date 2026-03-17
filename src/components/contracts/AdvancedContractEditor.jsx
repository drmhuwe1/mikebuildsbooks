import React, { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Edit2, Save, Plus, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { PRINT_CSS } from "@/lib/docStyles";
import { useToast } from "@/components/ui/use-toast";

export default function AdvancedContractEditor({ contract, company, onClose, onSave }) {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const frameRef = useRef(null);
  const [saving, setSaving] = useState(false);
  
  const [sections, setSections] = useState([
    {
      id: "header",
      type: "header",
      companyName: company?.company_name || "",
      companyAddress: company?.company_address || "",
      companyPhone: company?.company_phone || "",
      companyEmail: company?.company_email || "",
      logoUrl: company?.company_logo_url || "",
      logoHeight: 45,
    },
    {
      id: "client-info",
      type: "info",
      label: "Client / Owner",
      value: contract?.client_name || "",
    },
    {
      id: "amount-info",
      type: "info",
      label: "Contract Amount",
      value: `$${contract?.contract_amount || 0}`,
    },
    {
      id: "scope",
      type: "text",
      title: "Scope of Work",
      content: contract?.scope_summary || "",
    },
    {
      id: "payment",
      type: "text",
      title: "Payment Schedule",
      content: contract?.payment_schedule || "",
    },
  ]);

  const updateSection = (id, field, value) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSection = () => {
    const newId = `section-${Date.now()}`;
    setSections(prev => [...prev, {
      id: newId,
      type: "text",
      title: "New Section",
      content: "Click to edit content...",
    }]);
    setSelectedId(newId);
  };

  const deleteSection = (id) => {
    setSections(prev => prev.filter(s => s.id !== id));
    setSelectedId(null);
  };

  const saveTemplate = async () => {
    setSaving(true);
    try {
      await base44.entities.ContractTemplate.create({
        name: `${contract?.title} - Custom Template`,
        description: `Custom template for ${contract?.client_name}`,
        template_data: { sections },
        is_default: false,
      });
      toast({ title: "Template saved successfully" });
      onSave?.({ sections });
    } catch (err) {
      toast({ title: "Failed to save template", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getSelectedSection = () => sections.find(s => s.id === selectedId);

  const renderEditPanel = () => {
    const selected = getSelectedSection();
    if (!selected) return null;

    return (
      <Card className="p-4 bg-blue-50">
        <h4 className="font-semibold text-sm mb-3">Editing: {selected.title || selected.label || selected.type}</h4>
        <div className="space-y-3">
          {selected.type === "header" && (
            <>
              <div>
                <Label className="text-xs">Company Name</Label>
                <Input value={selected.companyName} onChange={e => updateSection(selectedId, "companyName", e.target.value)} className="text-xs h-8" />
              </div>
              <div>
                <Label className="text-xs">Address</Label>
                <Input value={selected.companyAddress} onChange={e => updateSection(selectedId, "companyAddress", e.target.value)} className="text-xs h-8" />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input value={selected.companyPhone} onChange={e => updateSection(selectedId, "companyPhone", e.target.value)} className="text-xs h-8" />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input value={selected.companyEmail} onChange={e => updateSection(selectedId, "companyEmail", e.target.value)} className="text-xs h-8" />
              </div>
              <div>
                <Label className="text-xs">Logo Height (px)</Label>
                <Input type="number" value={selected.logoHeight} onChange={e => updateSection(selectedId, "logoHeight", parseInt(e.target.value))} className="text-xs h-8" />
              </div>
              <div>
                <Label className="text-xs">Logo URL</Label>
                <Input value={selected.logoUrl} onChange={e => updateSection(selectedId, "logoUrl", e.target.value)} placeholder="Paste URL..." className="text-xs h-8" />
              </div>
            </>
          )}
          {selected.type === "info" && (
            <>
              <div>
                <Label className="text-xs">Label</Label>
                <Input value={selected.label} onChange={e => updateSection(selectedId, "label", e.target.value)} className="text-xs h-8" />
              </div>
              <div>
                <Label className="text-xs">Value</Label>
                <Input value={selected.value} onChange={e => updateSection(selectedId, "value", e.target.value)} className="text-xs h-8" />
              </div>
            </>
          )}
          {selected.type === "text" && (
            <>
              <div>
                <Label className="text-xs">Section Title</Label>
                <Input value={selected.title} onChange={e => updateSection(selectedId, "title", e.target.value)} className="text-xs h-8" />
              </div>
              <div>
                <Label className="text-xs">Content</Label>
                <Textarea value={selected.content} onChange={e => updateSection(selectedId, "content", e.target.value)} rows={4} className="text-xs" />
              </div>
            </>
          )}
        </div>
      </Card>
    );
  };

  const html = generateHTML(sections, company);

  return (
    <div className="space-y-4">
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
            <Button size="sm" variant="outline" onClick={addSection} className="gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Section
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => selectedId && deleteSection(selectedId)}
              disabled={!selectedId}
              className="gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
            <Button size="sm" onClick={saveTemplate} disabled={saving} className="gap-1">
              <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save Template"}
            </Button>
          </>
        )}
        <Button size="sm" variant="outline" onClick={() => frameRef.current?.contentWindow.print()}>
          🖨️ Print
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose} className="ml-auto">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          {editMode ? (
            <div className="space-y-3">
              {sections.map(section => (
                <Card
                  key={section.id}
                  className={`p-4 cursor-pointer transition ${selectedId === section.id ? "border-2 border-primary bg-primary/5" : "border border-gray-200"}`}
                  onClick={() => setSelectedId(section.id)}
                >
                  {section.type === "header" && (
                    <div>
                      <h3 className="font-bold">{section.companyName}</h3>
                      <p className="text-xs text-muted-foreground">{section.companyAddress}</p>
                    </div>
                  )}
                  {section.type === "info" && <p className="font-medium">{section.label}: {section.value}</p>}
                  {section.type === "text" && <p className="font-bold">{section.title}</p>}
                </Card>
              ))}
            </div>
          ) : (
            <iframe
              ref={frameRef}
              srcDoc={html}
              className="w-full border rounded"
              style={{ height: "700px" }}
              title="Preview"
            />
          )}
        </div>
        <div>{editMode && renderEditPanel()}</div>
      </div>
    </div>
  );
}

function generateHTML(sections, company) {
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
  ${sections.map(s => {
    if (s.type === "header") {
      return `
        <div class="doc-header">
          <div class="doc-header-content">
            ${s.logoUrl ? `<div class="doc-header-logo"><img src="${s.logoUrl}" style="max-height:${s.logoHeight}px;" /></div>` : ""}
            <div class="doc-header-company">
              <div class="company-name">${s.companyName}</div>
              <div class="company-meta">${s.companyAddress}<br/>${s.companyPhone}${s.companyEmail ? ` | ${s.companyEmail}` : ""}</div>
            </div>
          </div>
        </div>
      `;
    }
    if (s.type === "info") {
      return `<div class="info-grid"><div class="info-item"><label>${s.label}</label><span>${s.value}</span></div></div>`;
    }
    if (s.type === "text") {
      return `<div class="section-title">${s.title}</div><div class="highlight-box"><p>${s.content.replace(/\n/g, "<br/>")}</p></div>`;
    }
    return "";
  }).join("")}
</div>
</body>
</html>`;
}