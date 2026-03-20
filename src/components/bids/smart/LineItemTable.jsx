import React, { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";

const CATEGORIES = [
  { id: "materials",     label: "Materials",       color: "border-l-blue-400",   bg: "bg-blue-50"   },
  { id: "labor",         label: "Labor",            color: "border-l-green-400",  bg: "bg-green-50"  },
  { id: "subcontractor", label: "Subcontractors",   color: "border-l-purple-400", bg: "bg-purple-50" },
  { id: "permit",        label: "Permits",          color: "border-l-orange-400", bg: "bg-orange-50" },
  { id: "equipment",     label: "Equipment",        color: "border-l-yellow-400", bg: "bg-yellow-50" },
  { id: "overhead",      label: "Overhead",         color: "border-l-gray-400",   bg: "bg-gray-50"   },
  { id: "contingency",   label: "Contingency",      color: "border-l-red-400",    bg: "bg-red-50"    },
];

function EditableCell({ value, onChange, type = "text", className = "" }) {
  return (
    <Input
      type={type}
      value={value}
      onChange={e => onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
      className={`h-7 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-border px-1 ${className}`}
    />
  );
}

export default function LineItemTable({ lineItems, onChange }) {
  const [collapsed, setCollapsed] = useState({});

  const toggleCollapse = (catId) => setCollapsed(c => ({ ...c, [catId]: !c[catId] }));

  const addRow = (category) => {
    onChange([...lineItems, { id: Date.now(), category, description: "", estimatedCost: 0 }]);
  };

  const updateRow = (id, field, value) => {
    onChange(lineItems.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const deleteRow = (id) => {
    onChange(lineItems.filter(r => r.id !== id));
  };

  const total = lineItems.reduce((s, r) => s + (r.estimatedCost || 0), 0);

  return (
    <div className="space-y-2">
      {CATEGORIES.map(cat => {
        const rows = lineItems.filter(r => r.category === cat.id);
        const catTotal = rows.reduce((s, r) => s + (r.estimatedCost || 0), 0);
        const isCollapsed = collapsed[cat.id];

        return (
          <div key={cat.id} className={`border rounded-lg border-l-4 ${cat.color} overflow-hidden`}>
            {/* Category Header */}
            <div
              className={`flex items-center justify-between px-3 py-2 cursor-pointer ${cat.bg}`}
              onClick={() => toggleCollapse(cat.id)}
            >
              <div className="flex items-center gap-2">
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">{cat.label}</span>
                <span className="text-xs text-muted-foreground">({rows.length})</span>
              </div>
              <span className="text-xs font-bold">{formatCurrency(catTotal)}</span>
            </div>

            {!isCollapsed && (
              <div className="bg-card">
                {/* Column Headers */}
                {rows.length > 0 && (
                  <div className="grid grid-cols-[1fr_80px] gap-2 px-3 py-1 border-b text-xs text-muted-foreground font-medium">
                    <span>Description</span>
                    <span className="text-right">Cost</span>
                  </div>
                )}

                {/* Rows */}
                {rows.map(row => (
                  <div key={row.id} className="grid grid-cols-[1fr_80px_32px] gap-1 px-2 py-0.5 border-b border-border/50 items-center hover:bg-muted/30">
                    <EditableCell
                      value={row.description}
                      onChange={v => updateRow(row.id, "description", v)}
                    />
                    <EditableCell
                      value={row.estimatedCost}
                      onChange={v => updateRow(row.id, "estimatedCost", v)}
                      type="number"
                      className="text-right"
                    />
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Add Row */}
                <div className="px-3 py-1.5">
                  <button
                    onClick={() => addRow(cat.id)}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add {cat.label} row
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Running Total */}
      <div className="flex items-center justify-between bg-foreground text-background rounded-lg px-4 py-3 mt-2">
        <span className="text-sm font-semibold">Total Estimated Cost</span>
        <span className="text-lg font-bold">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}