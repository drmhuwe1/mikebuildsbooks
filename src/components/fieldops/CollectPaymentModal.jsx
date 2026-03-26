import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Search, CheckCircle } from "lucide-react";

export default function CollectPaymentModal({ onClose }) {
  const qc = useQueryClient();
  const [step, setStep] = useState("search"); // search -> confirm -> success
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContract, setSelectedContract] = useState(null);
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState("custom");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useState(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => base44.entities.Contract.list("-created_date", 100)
  });

  const filteredContracts = contracts.filter(c =>
    searchQuery === "" || 
    c.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const collectMutation = useMutation({
    mutationFn: async () => {
      const paymentLedger = await base44.entities.PaymentLedger.create({
        client_id: selectedContract.client_id,
        client_name: selectedContract.client_name,
        job_id: selectedContract.job_id,
        contract_id: selectedContract.id,
        amount: parseFloat(amount),
        payment_type: paymentType,
        source: "field_operations",
        payment_date: new Date().toISOString(),
        status: "completed",
        collected_by_email: user?.email,
        collected_by_user_id: user?.id
      });

      // Log activity
      await base44.entities.FieldActivityLog.create({
        item_type: "payment_collected",
        client_id: selectedContract.client_id,
        client_name: selectedContract.client_name,
        job_id: selectedContract.job_id,
        contract_id: selectedContract.id,
        amount: parseFloat(amount),
        uploaded_by_email: user?.email,
        uploaded_by_name: user?.full_name,
        timestamp: new Date().toISOString(),
        status: "submitted"
      });

      return paymentLedger;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["paymentLedger"] });
      qc.invalidateQueries({ queryKey: ["fieldActivityLogs"] });
      setStep("success");
      setTimeout(onClose, 2000);
    }
  });

  if (step === "success") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-96 p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">Payment Collected</h2>
          <p className="text-sm text-muted-foreground">${amount} from {selectedContract.client_name}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md rounded-t-lg sm:rounded-lg">
        <div className="p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Collect Payment</h2>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === "search" && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-2">Search Contract</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Client name or contract..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {filteredContracts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No contracts found</p>
                ) : (
                  filteredContracts.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedContract(c);
                        setStep("confirm");
                      }}
                      className="w-full text-left p-3 border rounded-lg hover:bg-muted transition"
                    >
                      <p className="font-semibold text-sm">{c.client_name}</p>
                      <p className="text-xs text-muted-foreground">{c.title}</p>
                      <p className="text-xs font-mono mt-1">${c.contract_amount}</p>
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          {step === "confirm" && selectedContract && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-xs text-blue-700 font-semibold">{selectedContract.client_name}</p>
                <p className="text-sm font-bold text-blue-900">{selectedContract.title}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Payment Type</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full h-10 border border-input rounded-md px-3 text-sm"
                >
                  <option value="custom">Custom</option>
                  <option value="deposit">Deposit</option>
                  <option value="progress_payment">Progress Payment</option>
                  <option value="final_payment">Final Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Amount</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg font-bold"
                  step="0.01"
                />
              </div>

              <Button
                onClick={() => collectMutation.mutate()}
                disabled={!amount || collectMutation.isPending}
                className="w-full"
              >
                {collectMutation.isPending ? "Processing..." : "Confirm Payment"}
              </Button>
              <Button
                onClick={() => setStep("search")}
                variant="outline"
                className="w-full"
              >
                Back
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}