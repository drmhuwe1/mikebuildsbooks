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
      label: "Client / Owner Name",
      value: `${contract?.client_name || ""} ${contract?.client_last_name || ""}`.trim(),
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
            <div className="flex justify-center overflow-y-auto">
              <iframe
                ref={frameRef}
                srcDoc={html}
                className="border rounded shadow-sm"
                style={{ width: "8.5in", height: "auto", minHeight: "11in" }}
                onLoad={(e) => {
                  const frame = e.target;
                  setTimeout(() => {
                    frame.style.height = (frame.contentDocument?.documentElement.scrollHeight || 0) + "px";
                  }, 100);
                }}
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
  
  const headerHTML = headerSection ? `
    <div style="margin-bottom: 24px; border-bottom: 3px solid #0a1f3d; padding-bottom: 15px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 20px;">
        ${headerSection.logoUrl ? `<img src="${headerSection.logoUrl}" style="max-height: ${headerSection.logoHeight}px; object-fit: contain;" />` : ""}
        <div style="flex: 1;">
          <div style="font-size: 18pt; font-weight: bold; color: #0a1f3d; margin-bottom: 8px;">${headerSection.companyName}</div>
          <div style="font-size: 10pt; color: #555; line-height: 1.7; font-weight: 500;">
            ${headerSection.companyAddress ? headerSection.companyAddress + '<br/>' : ""}
            ${headerSection.companyPhone ? headerSection.companyPhone : ""}${headerSection.companyEmail ? ` | ${headerSection.companyEmail}` : ""}
          </div>
        </div>
      </div>
    </div>
  ` : "";

  const contentHTML = contentSections.map(s => {
    if (s.type === "info") {
      return `<div style="margin-bottom: 20px; display: flex; justify-content: space-between; border-bottom: 1px solid #ddd; padding-bottom: 12px;">
        <div style="font-size: 10pt; font-weight: bold; text-transform: uppercase; color: #0a1f3d; letter-spacing: 0.05em;">${s.label}</div>
        <div style="font-size: 12pt; color: #111; font-weight: 600;">${s.value.replace(/\n/g, "<br/>")}</div>
      </div>`;
    }
    if (s.type === "text") {
      const lines = s.content.split('\n').filter(l => l.trim());
      let bulletItems = [];
      let paragraphs = [];
      let currentParagraph = [];
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.match(/^[-•*]/)) {
          if (currentParagraph.length > 0) {
            paragraphs.push(currentParagraph.join(' '));
            currentParagraph = [];
          }
          bulletItems.push(trimmed.replace(/^[-•*]\s*/, ''));
        } else if (trimmed.length > 0) {
          currentParagraph.push(trimmed);
        }
      });
      
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(' '));
      }
      
      let html = `<div style="margin-top: 28px; margin-bottom: 24px;">
        <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase; color: #0a1f3d; border-bottom: 2px solid #0a1f3d; padding-bottom: 10px; margin-bottom: 16px; letter-spacing: 0.05em;">${s.title}</div>
        <div style="background: #f8f9fb; border-left: 5px solid #0a1f3d; padding: 18px 20px; margin-bottom: 16px;">`;
      
      if (bulletItems.length > 0) {
        bulletItems.forEach(item => {
          html += `<div style="font-size: 11pt; line-height: 1.9; color: #333; margin-bottom: 10px; display: flex; gap: 10px;">
            <span style="flex-shrink: 0; margin-top: 2px;">•</span>
            <span>${item}</span>
          </div>`;
        });
      }
      
      paragraphs.forEach(para => {
        html += `<div style="font-size: 11pt; line-height: 1.8; color: #333; margin-bottom: 14px; text-align: justify;">${para}</div>`;
      });
      
      html += `</div></div>`;
      return html;
    }
    return "";
  }).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; margin: 0; padding: 0; }
    body { 
      font-family: 'Times New Roman', Times, serif; 
      font-size: 12pt; 
      color: #111; 
      background: #f5f5f5; 
      -webkit-print-color-adjust: exact; 
      print-color-adjust: exact;
      line-height: 1.6;
    }
    @page { 
      size: 8.5in 11in; 
      margin: 0; 
      padding: 0;
    }
    .doc-page { 
      width: 8.5in;
      padding: 0.7in 0.75in;
      margin: 10px auto;
      background: white;
      box-shadow: 0 0 8px rgba(0,0,0,0.1);
      min-height: 100%;
    }
    p, div { orphans: 3; widows: 3; }
    @media print {
      body { margin: 0; padding: 0; background: white; }
      .doc-page { 
        margin: 0; 
        box-shadow: none;
        page-break-inside: avoid;
        width: 100%;
        padding: 0.7in 0.75in;
      }
    }
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