import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

const REASON_LABELS = {
  client_request: "Client Request",
  unforeseen_condition: "Unforeseen Condition",
  design_change: "Design Change",
  material_substitution: "Material Substitution",
  other: "Other",
};

export default function ChangeOrderApproval() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const coId = params.get("id");

  const [co, setCo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState("view"); // view | signing | declining | done_approve | done_decline
  const [signature, setSignature] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token || !coId) { setError("Invalid approval link."); setLoading(false); return; }
    base44.entities.ChangeOrder.filter({ id: coId }).then(results => {
      const found = results[0];
      if (!found) { setError("Change order not found."); setLoading(false); return; }
      if (found.approval_token !== token) { setError("This approval link is invalid or expired."); setLoading(false); return; }
      if (found.status === "approved") { setStep("done_approve"); }
      if (found.status === "declined") { setStep("done_decline"); }
      setCo(found);
      setLoading(false);
    }).catch(() => { setError("Failed to load change order."); setLoading(false); });
  }, [token, coId]);

  const handleApprove = async () => {
    if (!signature.trim()) return;
    setSubmitting(true);
    try {
      await base44.entities.ChangeOrder.update(coId, {
        status: "approved",
        client_signature: signature,
        client_signed_at: new Date().toISOString(),
      });
      // Update job financials
      if (co.job_id) {
        const jobs = await base44.entities.Job.filter({ id: co.job_id });
        const job = jobs[0];
        if (job) {
          await base44.entities.Job.update(co.job_id, {
            change_orders_total: (job.change_orders_total || 0) + (co.total_amount || 0),
            contract_amount: (job.contract_amount || 0) + (co.total_amount || 0),
          });
        }
      }
      // Send confirmation emails
      await base44.functions.invoke("sendChangeOrderApprovalNotification", {
        coId,
        action: "approved",
        clientName: co.client_name,
        clientEmail: co.client_email,
        jobTitle: co.job_title,
        coNumber: co.change_order_number,
        coTitle: co.title,
        totalAmount: co.total_amount,
      });
      setStep("done_approve");
    } catch (e) {
      setError("Failed to submit approval. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setSubmitting(true);
    try {
      await base44.entities.ChangeOrder.update(coId, {
        status: "declined",
        decline_reason: declineReason,
      });
      await base44.functions.invoke("sendChangeOrderApprovalNotification", {
        coId,
        action: "declined",
        clientName: co.client_name,
        clientEmail: co.client_email,
        jobTitle: co.job_title,
        coNumber: co.change_order_number,
        coTitle: co.title,
        totalAmount: co.total_amount,
        declineReason,
      });
      setStep("done_decline");
    } catch (e) {
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <main id="main-content" className="min-h-screen flex items-center justify-center" tabIndex={-1}>
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </main>
  );

  if (error) return (
    <main id="main-content" className="min-h-screen flex items-center justify-center p-6" tabIndex={-1}>
      <div className="max-w-md text-center space-y-3">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
        <h2 className="text-lg font-bold">Unable to Load</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    </main>
  );

  if (step === "done_approve") return (
    <main id="main-content" className="min-h-screen flex items-center justify-center p-6 bg-green-50" tabIndex={-1}>
      <div className="max-w-md text-center space-y-4">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
        <h2 className="text-2xl font-bold text-green-900">Change Order Approved</h2>
        <p className="text-green-700">Thank you! Your contractor has been notified and will proceed with the work.</p>
        {co && <p className="text-sm text-muted-foreground">Change Order: {co.change_order_number} — {co.title}</p>}
      </div>
    </main>
  );

  if (step === "done_decline") return (
    <main id="main-content" className="min-h-screen flex items-center justify-center p-6 bg-red-50" tabIndex={-1}>
      <div className="max-w-md text-center space-y-4">
        <XCircle className="w-16 h-16 text-red-500 mx-auto" />
        <h2 className="text-2xl font-bold text-red-900">Change Order Declined</h2>
        <p className="text-red-700">Your contractor has been notified.</p>
      </div>
    </main>
  );

  return (
    <main id="main-content" className="min-h-screen bg-gray-50 py-8 px-4" tabIndex={-1}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Change Order</p>
              <h1 className="text-xl font-bold">{co.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{co.change_order_number} · {co.job_title}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className={`text-2xl font-bold ${(co.total_amount || 0) < 0 ? "text-red-600" : "text-green-700"}`}>
                {(co.total_amount || 0) >= 0 ? "+" : ""}{formatCurrency(co.total_amount)}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        {co.description && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-sm mb-2">Description of Change</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{co.description}</p>
            {co.reason && <p className="text-xs mt-3 text-muted-foreground">Reason: <span className="font-medium text-foreground">{REASON_LABELS[co.reason] || co.reason}</span></p>}
          </div>
        )}

        {/* Line Items */}
        {co.line_items?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-sm mb-3">Line Items</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left pb-2">Description</th>
                  <th className="text-right pb-2">Qty</th>
                  <th className="text-right pb-2">Unit Cost</th>
                  <th className="text-right pb-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {co.line_items.map((item, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-right">{item.quantity} {item.unit}</td>
                    <td className="py-2 text-right">{formatCurrency(item.unit_cost)}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(item.total_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Contract Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-semibold text-sm mb-3">Contract Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Original Contract</span><span>{formatCurrency(co.original_contract_amount)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">This Change Order</span><span className={`font-semibold ${(co.total_amount || 0) < 0 ? "text-red-600" : "text-green-700"}`}>{(co.total_amount || 0) >= 0 ? "+" : ""}{formatCurrency(co.total_amount)}</span></div>
            <div className="flex justify-between text-base font-bold border-t pt-2"><span>Revised Contract Total</span><span>{formatCurrency(co.revised_contract_amount)}</span></div>
          </div>
        </div>

        {/* Action */}
        {step === "view" && co.status === "sent" && (
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <h2 className="font-semibold">Your Response</h2>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => setStep("signing")} className="bg-green-600 hover:bg-green-700 gap-2">
                <CheckCircle className="w-4 h-4" /> Approve Change Order
              </Button>
              <Button variant="outline" onClick={() => setStep("declining")} className="gap-2 text-red-600 border-red-300 hover:bg-red-50">
                <XCircle className="w-4 h-4" /> Decline
              </Button>
            </div>
          </div>
        )}

        {step === "signing" && (
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <h2 className="font-semibold text-green-900">Approve Change Order</h2>
            <p className="text-sm text-muted-foreground">By typing your name below and clicking Approve, you agree to this change order and authorize the work to proceed.</p>
            <div>
              <Label>Type your full name as your digital signature *</Label>
              <Input value={signature} onChange={e => setSignature(e.target.value)} placeholder="Your full legal name" className="mt-1.5" />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleApprove} disabled={!signature.trim() || submitting} className="bg-green-600 hover:bg-green-700 gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirm Approval
              </Button>
              <Button variant="ghost" onClick={() => setStep("view")}>Cancel</Button>
            </div>
          </div>
        )}

        {step === "declining" && (
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <h2 className="font-semibold text-red-900">Decline Change Order</h2>
            <div>
              <Label>Reason (optional)</Label>
              <Textarea value={declineReason} onChange={e => setDeclineReason(e.target.value)} rows={3} placeholder="Briefly explain why..." className="mt-1.5" />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleDecline} disabled={submitting} variant="destructive" className="gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Confirm Decline
              </Button>
              <Button variant="ghost" onClick={() => setStep("view")}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}