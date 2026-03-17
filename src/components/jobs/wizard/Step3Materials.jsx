import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Upload } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { base44 } from "@/api/base44Client";

const emptyRow = { name: "", vendor: "", qty: 1, unit_cost: 0, total: 0 };

export default function Step3Materials({ data, onChange }) {
  const items = data.material_items || [];
  const [uploading, setUploading] = React.useState(false); // eslint-disable-line

  const update = (idx, field, val) => {
    const updated = items.map((item, i) => {
      if (i !== idx) return item;
      const newItem = { ...item, [field]: val };
      if (field === "qty" || field === "unit_cost") {
        newItem.total = (parseFloat(field === "qty" ? val : newItem.qty) || 0) * (parseFloat(field === "unit_cost" ? val : newItem.unit_cost) || 0);
      }
      return newItem;
    });
    onChange({ ...data, material_items: updated });
  };

  const addRow = () => onChange({ ...data, material_items: [...items, { ...emptyRow }] });

  const removeRow = (idx) => onChange({ ...data, material_items: items.filter((_, i) => i !== idx) });

  const subtotal = items.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange({ ...data, quote_file_url: file_url });
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Add all materials needed for this job. You can add more later.</p>

      {items.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-1">
            <span className="col-span-4">Material</span>
            <span className="col-span-3">Supplier/Vendor</span>
            <span className="col-span-1 text-right">Qty</span>
            <span className="col-span-2 text-right">Unit Cost</span>
            <span className="col-span-1 text-right">Total</span>
            <span className="col-span-1" />
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <Input className="col-span-4 h-8 text-sm" placeholder="Material name" value={item.name} onChange={e => update(idx, "name", e.target.value)} />
              <Input className="col-span-3 h-8 text-sm" placeholder="Vendor" value={item.vendor} onChange={e => update(idx, "vendor", e.target.value)} />
              <Input className="col-span-1 h-8 text-sm text-right" type="number" min="0" value={item.qty} onChange={e => update(idx, "qty", e.target.value)} />
              <Input className="col-span-2 h-8 text-sm text-right" type="number" min="0" step="0.01" value={item.unit_cost} onChange={e => update(idx, "unit_cost", e.target.value)} />
              <span className="col-span-1 text-xs font-medium text-right">{formatCurrency(item.total)}</span>
              <button onClick={() => removeRow(idx)} className="col-span-1 flex justify-end text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5">
        <Plus className="w-3.5 h-3.5" /> Add Material
      </Button>

      {items.length > 0 && (
        <div className="flex justify-end pt-2 border-t">
          <div className="text-sm font-semibold">
            Material Subtotal: <span className="text-primary">{formatCurrency(subtotal)}</span>
          </div>
        </div>
      )}

      <div className="pt-2 border-t">
        <Label className="mb-2 block">Upload Supplier Quote / Invoice <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input type="file" className="hidden" accept=".pdf,.jpg,.png,.xlsx,.csv" onChange={handleUpload} />
          <Button variant="outline" size="sm" asChild>
            <span className="gap-1.5 flex items-center">
              <Upload className="w-3.5 h-3.5" />
              {uploading ? "Uploading..." : data.quote_file_url ? "Replace File" : "Upload File"}
            </span>
          </Button>
          {data.quote_file_url && <span className="text-xs text-green-600 font-medium">✓ File uploaded</span>}
        </label>
      </div>
    </div>
  );
}