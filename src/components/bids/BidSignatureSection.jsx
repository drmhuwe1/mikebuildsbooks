import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/formatters";

export default function BidSignatureSection({ bid, onSignaturesChange, isLocked = false }) {
  const [contractorSigned, setContractorSigned] = useState(bid?.contractor_signature_name ? true : false);
  const [contractorName, setContractorName] = useState(bid?.contractor_signature_name || "");
  const [contractorDate, setContractorDate] = useState(bid?.contractor_signature_date || "");

  const [customerSigned, setCustomerSigned] = useState(bid?.customer_signature_name ? true : false);
  const [customerName, setCustomerName] = useState(bid?.customer_signature_name || "");
  const [customerDate, setCustomerDate] = useState(bid?.customer_signature_date || "");

  const handleContractorSign = () => {
    const today = new Date().toISOString().split("T")[0];
    setContractorSigned(true);
    setContractorDate(today);
    onSignaturesChange?.({
      contractor_signature_name: contractorName,
      contractor_signature_date: today,
      customer_signature_name: customerName,
      customer_signature_date: customerDate,
      customer_signed: customerSigned,
      contractor_signed: true
    });
  };

  const handleCustomerSign = () => {
    const today = new Date().toISOString().split("T")[0];
    setCustomerSigned(true);
    setCustomerDate(today);
    onSignaturesChange?.({
      contractor_signature_name: contractorName,
      contractor_signature_date: contractorDate,
      customer_signature_name: customerName,
      customer_signature_date: today,
      contractor_signed: contractorSigned,
      customer_signed: true
    });
  };

  return (
    <Card className="p-5 border-2 border-primary/20">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        Legal Signatures Required
        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Required</span>
      </h3>

      <div className="space-y-6">
        {/* Contractor Signature */}
        <div className="border-t pt-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Contractor / Business Owner
          </h4>
          
          {!contractorSigned ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="contractor_name" className="text-xs">
                  Full Name & Title *
                </Label>
                <Input
                  id="contractor_name"
                  placeholder="e.g., John Smith, Owner"
                  value={contractorName}
                  onChange={e => setContractorName(e.target.value)}
                  disabled={isLocked}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleContractorSign}
                disabled={!contractorName || isLocked}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Sign as Contractor
              </Button>
            </div>
          ) : (
            <div className="bg-green-50 rounded p-3 border border-green-200">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-700">{contractorName}</p>
                  <p className="text-xs text-green-600">Signed on {formatDate(contractorDate)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Customer Signature */}
        <div className="border-t pt-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Customer / Client
          </h4>
          
          {!customerSigned ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="customer_name" className="text-xs">
                  Full Name *
                </Label>
                <Input
                  id="customer_name"
                  placeholder="e.g., Jane Johnson"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  disabled={isLocked}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleCustomerSign}
                disabled={!customerName || isLocked}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Sign as Customer
              </Button>
            </div>
          ) : (
            <div className="bg-blue-50 rounded p-3 border border-blue-200">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-700">{customerName}</p>
                  <p className="text-xs text-blue-600">Signed on {formatDate(customerDate)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        {contractorSigned && customerSigned && (
          <div className="bg-green-50 rounded p-3 border border-green-200 flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-700">✓ Bid is legally signed by all parties</p>
              <p className="text-xs text-green-600">This contract is now binding.</p>
            </div>
          </div>
        )}

        {contractorSigned && !customerSigned && (
          <div className="bg-yellow-50 rounded p-3 border border-yellow-200 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700">Awaiting customer signature to finalize contract.</p>
          </div>
        )}
      </div>
    </Card>
  );
}