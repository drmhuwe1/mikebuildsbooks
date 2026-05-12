import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentLedgerView() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: payments = [] } = useQuery({
    queryKey: ["paymentLedger"],
    queryFn: () => base44.entities.PaymentLedger.list("-payment_date", 500)
  });

  const filtered = payments.filter(p =>
    p.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.contract_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCollected = filtered.reduce((sum, p) => sum + (p.amount || 0), 0);

  const exportCSV = () => {
    let csv = "Date,Client,Job,Contract,Amount,Type,Source,Status,Collected By\n";
    filtered.forEach(p => {
      csv += `"${formatDate(p.payment_date)}","${p.client_name}","${p.job_title}","${p.contract_title}","${p.amount}","${p.payment_type}","${p.source}","${p.status}","${p.collected_by_email}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-ledger-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">Payment Ledger</h3>
        <Button type="button" onClick={exportCSV} variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by client, job, or contract..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      <Card className="p-4 bg-primary/5 border-primary/30">
        <p className="text-xs text-muted-foreground">Total Collected (Filtered)</p>
        <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(totalCollected)}</p>
        <p className="text-xs text-muted-foreground mt-1">{filtered.length} payments</p>
      </Card>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No payments found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <Card key={p.id} className="p-3 border-l-4 border-l-primary">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{p.client_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.job_title && `Job: ${p.job_title}`}
                  </p>
                  <div className="flex gap-1 mt-2">
                    <Badge variant="outline" className="text-xs">{p.payment_type?.replace(/_/g, " ")}</Badge>
                    <Badge variant="outline" className="text-xs">{p.source?.replace(/_/g, " ")}</Badge>
                    <Badge variant={p.status === "completed" ? "default" : "secondary"} className="text-xs">
                      {p.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{formatCurrency(p.amount)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(p.payment_date)}</p>
                  <p className="text-xs text-muted-foreground">By: {p.collected_by_email?.split("@")[0]}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}