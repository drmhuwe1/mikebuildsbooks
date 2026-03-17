import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export default function CloseoutStep1Completion({ closeoutData, update }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Step 1 — Verify Project Completion</h2>
        <p className="text-sm text-muted-foreground mt-1">Confirm the job is physically complete before proceeding with financial closeout.</p>
      </div>

      <div>
        <Label>Actual Completion Date</Label>
        <Input
          type="date"
          value={closeoutData.actual_completion}
          onChange={e => update({ actual_completion: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-between py-3 px-4 rounded-lg border bg-muted/30">
        <div>
          <p className="text-sm font-medium">Final Inspection Passed</p>
          <p className="text-xs text-muted-foreground">All inspections cleared by local authority</p>
        </div>
        <Switch
          checked={closeoutData.inspection_passed}
          onCheckedChange={v => update({ inspection_passed: v })}
        />
      </div>

      <div className="flex items-center justify-between py-3 px-4 rounded-lg border bg-muted/30">
        <div>
          <p className="text-sm font-medium">Customer Sign-Off Received</p>
          <p className="text-xs text-muted-foreground">Client has signed off on completed work</p>
        </div>
        <Switch
          checked={closeoutData.customer_signoff}
          onCheckedChange={v => update({ customer_signoff: v })}
        />
      </div>

      <div>
        <Label>Completion Notes</Label>
        <Textarea
          value={closeoutData.completion_notes}
          onChange={e => update({ completion_notes: e.target.value })}
          placeholder="Any notes about project completion, punch list items, warranties, etc."
          rows={4}
        />
      </div>
    </div>
  );
}