import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function Step8Payment({ data, onChange, bidAmount }) {
  const set = (k, v) => onChange({ ...data, [k]: v });

  const deposit = parseFloat(data.deposit_amount) || 0;
  const progress = parseFloat(data.progress_payment) || 0;
  const final = parseFloat(data.final_payment) || 0;
  const scheduled = deposit + progress + final;
  const remaining = bidAmount - scheduled;

  const autoGenerate = () => {
    const dep = Math.round(bidAmount * 0.30);
    const prog = Math.round(bidAmount * 0.40);
    const fin = bidAmount - dep - prog;
    onChange({
      ...data,
      deposit_amount: dep,
      progress_payment: prog,
      final_payment: fin,
      payment_schedule_notes: `30% deposit due before work begins.\n40% progress payment at midpoint.\n${formatCurrency(fin)} final payment upon completion.`,
    });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">Define the payment schedule for this project. Total bid amount: <strong>{formatCurrency(bidAmount)}</strong></p>

      <Button variant="outline" size="sm" onClick={autoGenerate} className="gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-primary" /> Auto-Generate Schedule (30/40/30)
      </Button>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Deposit Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input type="number" min="0" className="pl-6" value={data.deposit_amount || ""} onChange={e => set("deposit_amount", e.target.value)} placeholder="0.00" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{bidAmount > 0 ? `${((deposit / bidAmount) * 100).toFixed(0)}% of total` : ""}</p>
        </div>
        <div>
          <Label>Progress Payment</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input type="number" min="0" className="pl-6" value={data.progress_payment || ""} onChange={e => set("progress_payment", e.target.value)} placeholder="0.00" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{bidAmount > 0 ? `${((progress / bidAmount) * 100).toFixed(0)}% of total` : ""}</p>
        </div>
        <div>
          <Label>Final Payment</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input type="number" min="0" className="pl-6" value={data.final_payment || ""} onChange={e => set("final_payment", e.target.value)} placeholder="0.00" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{bidAmount > 0 ? `${((final / bidAmount) * 100).toFixed(0)}% of total` : ""}</p>
        </div>
      </div>

      {bidAmount > 0 && (
        <div className={`flex justify-between items-center p-3 rounded-lg border text-sm ${Math.abs(remaining) < 1 ? "bg-green-50 border-green-200 text-green-700" : "bg-yellow-50 border-yellow-200 text-yellow-700"}`}>
          <span>{Math.abs(remaining) < 1 ? "✓ Payment schedule balances perfectly" : `Unscheduled: ${formatCurrency(remaining)}`}</span>
          <span className="font-semibold">{formatCurrency(scheduled)} / {formatCurrency(bidAmount)}</span>
        </div>
      )}

      <div>
        <Label>Payment Schedule Notes</Label>
        <Textarea value={data.payment_schedule_notes || ""} onChange={e => set("payment_schedule_notes", e.target.value)} rows={3} placeholder="Additional payment terms, due dates, or conditions..." />
      </div>
    </div>
  );
}