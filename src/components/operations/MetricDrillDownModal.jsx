import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";

export default function MetricDrillDownModal({ open, onClose, title, items, total, emptyMessage = "No items found." }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{emptyMessage}</p>
        ) : (
          <div className="space-y-2 mt-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-start justify-between p-3 border rounded-lg gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.label}</p>
                  {item.sublabel && <p className="text-xs text-muted-foreground mt-0.5">{item.sublabel}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${item.amountColor || ""}`}>{formatCurrency(item.amount)}</p>
                  {item.badge && <Badge variant="outline" className="text-xs mt-0.5">{item.badge}</Badge>}
                </div>
              </div>
            ))}

            {/* Total row */}
            <div className="flex justify-between items-center pt-3 border-t mt-2">
              <p className="font-semibold text-sm">Total</p>
              <p className="font-bold text-base">{formatCurrency(total)}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}