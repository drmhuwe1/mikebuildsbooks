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
      logoHeight: 70,
    },
    {
      id: "client-info",
      type: "info",
      label: "Client / Owner",
      value: contract?.client_name || "",
    },
    {
      id: "client-last-name",
      type: "info",
      label: "Client Last Name",
      value: contract?.client_last_name || "",
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
      <Card className="p-3 bg-blue-50 text-sm">
        <h4 className="font-semibold text-xs mb-2">Edit: {selected.title || selected.label || selected.type}</h4>
        <div className="space-y-2">
          {selected.type === "header" && (
            <>
              <div>
                <Label className="text-xs">Company Name</Label>
                <Input value={selected.companyName} onChange={e => updateSection(selectedId, "companyName", e.target.value)} className="text-xs h-7" />
              </div>
              <div>
                <Label className="text-xs">Address</Label>
                <Input value={selected.companyAddress} onChange={e => updateSection(selectedId, "companyAddress", e.target.value)} className="text-xs h-7" />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input value={selected.companyPhone} onChange={e => updateSection(selectedId, "companyPhone", e.target.value)} className="text-xs h-7" />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input value={selected.companyEmail} onChange={e => updateSection(selectedId, "companyEmail", e.target.value)} className="text-xs h-7" />
              </div>
              <div>
                <Label className="text-xs">Logo Height (px)</Label>
                <Input type="number" value={selected.logoHeight} onChange={e => updateSection(selectedId, "logoHeight", parseInt(e.target.value))} className="text-xs h-7" />
              </div>
              <div>
                <Label className="text-xs">Logo URL</Label>
                <Input value={selected.logoUrl} onChange={e => updateSection(selectedId, "logoUrl", e.target.value)} placeholder="Paste URL..." className="text-xs h-7" />
              </div>
            </>
          )}
          {selected.type === "info" && (
            <>
              <div>
                <Label className="text-xs">Label</Label>
                <Input value={selected.label} onChange={e => updateSection(selectedId, "label", e.target.value)} className="text-xs h-7" />
              </div>
              <div>
                <Label className="text-xs">Value</Label>
                <Input value={selected.value} onChange={e => updateSection(selectedId, "value", e.target.value)} className="text-xs h-7" />
              </div>
            </>
          )}
          {selected.type === "text" && (
            <>
              <div>
                <Label className="text-xs">Section Title</Label>
                <Input value={selected.title} onChange={e => updateSection(selectedId, "title", e.target.value)} className="text-xs h-7" />
              </div>
              <div>
                <Label className="text-xs">Content</Label>
                <Textarea value={selected.content} onChange={e => updateSection(selectedId, "content", e.target.value)} rows={3} className="text-xs" />
              </div>
            </>
          )}
        </div>
      </Card>
    );
  };

  const html = generateHTML(sections);

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col">
      <div className="flex gap-2 flex-wrap p-4 border-b bg-white">
        <Button
          size="sm"
          variant={editMode ? "default" : "outline"}
          onClick={() => setEditMode(!editMode)}
        >
          <Edit2 className="w-3.5 h-3.5 mr-1" />
          {editMode ? "Preview" : "Edit"}
        </Button>
        {editMode && (
          <>
            <Button size="sm" variant="outline" onClick={addSection}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Section
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => selectedId && deleteSection(selectedId)}
              disabled={!selectedId}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
            <Button size="sm" onClick={saveTemplate} disabled={saving}>
              <Save className="w-3.5 h-3.5 mr-1" /> {saving ? "Saving..." : "Save"}
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

      <div className="flex flex-1 overflow-hidden gap-4">
        <div className="flex-1 overflow-y-auto p-4">
          {editMode ? (
            <div className="space-y-2">
              {sections.map(section => (
                <Card
                  key={section.id}
                  className={`p-3 cursor-pointer transition text-sm ${selectedId === section.id ? "border-2 border-primary bg-primary/5" : "border border-gray-200"}`}
                  onClick={() => setSelectedId(section.id)}
                >
                  {section.type === "header" && <p className="font-bold">{section.companyName}</p>}
                  {section.type === "info" && <p>{section.label}: <strong>{section.value}</strong></p>}
                  {section.type === "text" && <p className="font-bold">{section.title}</p>}
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex justify-center">
              <iframe
                ref={frameRef}
                srcDoc={html}
                className="border rounded shadow-sm"
                style={{ width: "8.5in", height: "100%", minHeight: "100vh" }}
                title="Contract Preview"
              />
            </div>
          )}
        </div>
        {editMode && (
          <div className="w-80 border-l overflow-y-auto p-4 bg-gray-50">
            {renderEditPanel()}
          </div>
        )}
      </div>
    </div>
  );
}

function generateHTML(sections) {
  const headerSection = sections.find(s => s.type === "header");
  const contentSections = sections.filter(s => s.type !== "header");
  
  const headerHTML = headerSection
    ? `<div class="doc-header"><div class="doc-header-content">${headerSection.logoUrl ? `<div class="doc-header-logo"><img src="${headerSection.logoUrl}" style="max-height:${headerSection.logoHeight}px;" /></div>` : ""}<div class="doc-header-company"><div class="company-name">${headerSection.companyName}</div><div class="company-meta">${headerSection.companyAddress}<br/>${headerSection.companyPhone}${headerSection.companyEmail ? ` | ${headerSection.companyEmail}` : ""}</div></div></div></div>`
    : "";

  const contentHTML = contentSections.map(s => {
    if (s.type === "info") {
      const lines = s.value.split('\n').filter(l => l.trim());
      if (lines.length > 1) {
        return `<div class="info-item"><label>${s.label}</label><div class="info-list">${lines.map(l => `<p>${l.trim()}</p>`).join('')}</div></div>`;
      }
      return `<div class="info-item"><label>${s.label}</label><p>${s.value}</p></div>`;
    }
    if (s.type === "text") {
      const lines = s.content.split('\n').filter(l => l.trim());
      const listItems = lines.filter(l => l.match(/^[-•*]/));
      const paragraphs = lines.filter(l => !l.match(/^[-•*]/));
      let content = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
      if (listItems.length > 0) {
        content += `<ul>${listItems.map(li => `<li>${li.replace(/^[-•*]\s*/, '')}</li>`).join('')}</ul>`;
      }
      return `<div class="section-title">${s.title}</div><div class="highlight-box">${content || `<p>${s.content.replace(/\n/g, "<br/>")}</p>`}</div>`;
    }
    return "";
  }).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${PRINT_CSS}
    @page { size: 8.5in 11in; margin: 0; }
    body { margin: 0; padding: 0; }
    .doc-page { page-break-after: always; width: 8.5in; height: 11in; padding: 0.75in; box-sizing: border-box; page-break-inside: avoid; display: flex; flex-direction: column; }
    .doc-page:last-child { page-break-after: avoid; }
    .info-item { margin-bottom: 16px; }
    .info-item label { font-size: 10pt; font-weight: bold; text-transform: uppercase; color: #0a1f3d; display: block; margin-bottom: 6px; }
    .info-item p { font-size: 11pt; margin: 4px 0; color: #333; }
    .info-list { display: flex; flex-direction: column; gap: 4px; }
  </style>
</head>
<body>
  <div class="doc-page">
    ${headerHTML}
    ${contentHTML}
  </div>
</body>
</html>`;
}