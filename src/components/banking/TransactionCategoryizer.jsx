import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/formatters";

const CATEGORIES = [
  "deposit", "payment", "transfer", "payroll", "materials", "subcontractor",
  "overhead", "tax", "owner_draw", "fuel", "insurance", "tools_equipment",
  "software", "utilities", "permit_fees", "groceries", "housing",
  "transportation", "debt_payments", "entertainment", "healthcare",
  "savings_transfer", "personal_bills", "other"
];

export default function TransactionCategoryizer({
  open,
  transaction,
  onClose,
  onSave,
}) {
  const [category, setCategory] = useState(transaction?.category || "other");
  const [notes, setNotes] = useState(transaction?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      ...transaction,
      category,
      notes,
      is_categorized: true,
    });
    setSaving(false);
    onClose();
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Categorize Transaction</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">Transaction</p>
            <p className="font-semibold text-sm">{transaction.description}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(transaction.date)} · {formatCurrency(transaction.amount)}
            </p>
          </div>

          <div>
            <Label>Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>
                    {c.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes about this transaction..."
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Category"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}