import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, DollarSign, ChevronRight, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/formatters";

export default function FieldPayments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [paymentType, setPaymentType] = useState("custom");
  const [customAmount, setCustomAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorDialog, setErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list("-created_date", 500) });
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 500) });
  const { data: contracts = [] } = useQuery({ queryKey: ["contracts"], queryFn: () => base44.entities.Contract.list("-created_date", 500) });

  const getPaymentAmount = () => {
    if (paymentType === "custom") return parseFloat(customAmount) || 0;
    if (!selectedTarget?.contract) return 0;
    const c = selectedTarget.contract;
    const remaining = Math.max(0, c.contract_amount - (c.client_paid_amount || 0));
    if (paymentType === "deposit") return c.deposit_amount || 0;
    if (paymentType === "progress_payment") return remaining / 2;
    if (paymentType === "final_payment") return remaining;
    return 0;
  };

  const filteredResults = searchQuery.length > 2 
    ? [
        ...clients
          .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(c => ({ type: "client", data: c })),
        ...jobs
          .filter(j => j.title.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(j => ({ type: "job", data: j })),
        ...contracts
          .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(c => ({ type: "contract", data: c }))
      ]
    : [];

  const handleSelectResult = (result) => {
    let contract = null;
    let client = null;
    let job = null;

    if (result.type === "client") {
      client = result.data;
      const clientContracts = contracts.filter(c => c.client_id === client.id);
      contract = clientContracts[0];
      job = jobs.find(j => j.client_id === client.id);
    } else if (result.type === "job") {
      job = result.data;
      client = clients.find(c => c.id === job.client_id);
      contract = contracts.find(c => c.job_id === job.id);
    } else if (result.type === "contract") {
      contract = result.data;
      client = clients.find(c => c.id === contract.client_id);
      job = jobs.find(j => j.id === contract.job_id);
    }

    setSelectedTarget({ client, job, contract });
    setSearchQuery("");
    setPaymentType("custom");
    setCustomAmount("");
  };

  const handleCollectPayment = async () => {
    const amount = getPaymentAmount();
    if (!amount || amount <= 0) {
      setErrorMessage("Invalid amount. Please enter a valid amount.");
      setErrorDialog(true);
      return;
    }

    setProcessing(true);
    try {
      const response = await base44.functions.invoke("collectFieldPayment", {
        client_id: selectedTarget.client.id,
        client_name: selectedTarget.client.name,
        job_id: selectedTarget.job?.id,
        job_title: selectedTarget.job?.title,
        contract_id: selectedTarget.contract?.id,
        contract_title: selectedTarget.contract?.title,
        amount,
        payment_type: paymentType,
        source: "tap_to_pay"
      });

      setSuccessData(response.data);
      setSuccessDialog(true);
      setSelectedTarget(null);
      setPaymentType("custom");
      setCustomAmount("");
    } catch (err) {
      setErrorMessage(err.message || "Payment failed. Please try again.");
      setErrorDialog(true);
    } finally {
      setProcessing(false);
    }
  };

  const amountDue = selectedTarget?.contract 
    ? Math.max(0, selectedTarget.contract.contract_amount - (selectedTarget.contract.client_paid_amount || 0))
    : 0;

  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-br from-primary/5 to-background p-4 pb-20" tabIndex={-1}>
      {/* Header */}
      <div className="max-w-md mx-auto mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <DollarSign className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Collect Payment</h1>
        </div>
        <p className="text-sm text-muted-foreground text-center">Search for a client, job, or contract</p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Client, job, or contract..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
      </div>

      {/* Search Results */}
      {filteredResults.length > 0 && (
        <div className="max-w-md mx-auto mb-6 space-y-2">
          {filteredResults.slice(0, 5).map((result, i) => (
            <button
              key={i}
              onClick={() => handleSelectResult(result)}
              className="w-full text-left p-4 rounded-lg border border-border bg-card hover:bg-accent transition flex items-center justify-between group"
            >
              <div>
                <p className="font-semibold text-sm text-foreground">{result.data.name || result.data.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {result.type === "client" && "Client"}
                  {result.type === "job" && "Job"}
                  {result.type === "contract" && "Contract"}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            </button>
          ))}
        </div>
      )}

      {/* Payment Form */}
      {selectedTarget && (
        <div className="max-w-md mx-auto space-y-4">
          <Card className="p-4 border-primary/30 bg-primary/5">
            <p className="text-xs text-muted-foreground mb-1">Client</p>
            <p className="font-semibold text-sm text-foreground mb-3">{selectedTarget.client.name}</p>
            
            {selectedTarget.job && (
              <>
                <p className="text-xs text-muted-foreground mb-1">Job</p>
                <p className="font-semibold text-sm text-foreground mb-3">{selectedTarget.job.title}</p>
              </>
            )}

            {selectedTarget.contract && (
              <>
                <p className="text-xs text-muted-foreground mb-1">Amount Due</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(amountDue)}</p>
              </>
            )}
          </Card>

          {/* Payment Type Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Payment Type</label>
            <div className="grid grid-cols-2 gap-2">
              {["deposit", "progress_payment", "final_payment", "custom"].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setPaymentType(type);
                    if (type !== "custom") setCustomAmount("");
                  }}
                  className={`p-3 rounded-lg border text-xs font-medium transition ${
                    paymentType === type
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:border-primary/50"
                  }`}
                >
                  {type === "deposit" && "Deposit"}
                  {type === "progress_payment" && "Progress"}
                  {type === "final_payment" && "Final"}
                  {type === "custom" && "Custom"}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          {paymentType === "custom" && (
            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block">Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                step="0.01"
                min="0"
                className="h-12 text-lg"
              />
            </div>
          )}

          {/* Amount Display */}
          <Card className="p-4 bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Payment Amount</p>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(getPaymentAmount())}</p>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4">
            <Button
              onClick={() => setConfirmDialog(true)}
              disabled={getPaymentAmount() <= 0 || processing}
              className="w-full h-12 text-base font-bold"
            >
              {processing ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Collect Payment
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                setSelectedTarget(null);
                setPaymentType("custom");
                setCustomAmount("");
              }}
              variant="outline"
              className="w-full h-12"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Please verify the payment details before proceeding.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-semibold">{selectedTarget?.client.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(getPaymentAmount())}</p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                After confirming, the customer will be prompted to tap their card.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCollectPayment}
                disabled={processing}
                className="flex-1"
              >
                {processing ? "Processing..." : "Proceed"}
              </Button>
              <Button
                onClick={() => setConfirmDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Payment Received
            </DialogTitle>
          </DialogHeader>
          {successData && (
            <div className="space-y-4">
              <Card className="p-4 bg-green-50 border-green-200">
                <p className="text-3xl font-bold text-green-600">{formatCurrency(successData.amount)}</p>
                <p className="text-sm text-green-700 mt-1">Payment confirmed</p>
              </Card>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Client</p>
                  <p className="font-semibold">{successData.client_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Receipt #</p>
                  <p className="font-mono text-xs">{successData.stripe_payment_id?.slice(0, 8) || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time</p>
                  <p className="text-sm">{formatDate(successData.payment_date)}</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setSuccessDialog(false);
                  setSelectedTarget(null);
                }}
                className="w-full"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={errorDialog} onOpenChange={setErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Payment Failed
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-foreground">{errorMessage}</p>
            <Button onClick={() => setErrorDialog(false)} className="w-full">
              Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}