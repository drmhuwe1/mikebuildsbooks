import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/shared/PageHeader";
import { Download, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function YearEndFinancials() {
  const selectedYear = 2026;

  const { data: transactions = [] } = useQuery({
    queryKey: ["bankTransactions"],
    queryFn: () => base44.entities.BankTransaction.list("-date", 1000),
  });

  const { data: subPayments = [] } = useQuery({
    queryKey: ["subPayments"],
    queryFn: () => base44.entities.SubcontractorLedgerPayment.list("-payment_date", 1000),
  });

  const { data: managerPayments = [] } = useQuery({
    queryKey: ["managerPayments"],
    queryFn: () => base44.entities.ManagerPayment.list("-payment_date", 1000),
  });

  const { data: jobReceipts = [] } = useQuery({
    queryKey: ["jobReceipts"],
    queryFn: () => base44.entities.JobReceipt.list("-date", 1000),
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => base44.entities.Contract.list("-created_date", 1000),
  });

  const { data: ownerPayments = [] } = useQuery({
    queryKey: ["ownerPayments"],
    queryFn: () => base44.entities.OwnerPayment.list("-payment_date", 1000),
  });

  const [selectedDetail, setSelectedDetail] = useState(null);

  // Filter to selected year (2026 only)
  const yearTransactions = transactions.filter(t => {
    const txYear = t.date ? new Date(t.date).getFullYear() : null;
    return txYear === 2026;
  });

  const yearSubPayments = subPayments.filter(p => {
    const pYear = p.payment_date ? new Date(p.payment_date).getFullYear() : null;
    return pYear === 2026 && p.is_paid;
  });

  const yearManagerPayments = managerPayments.filter(p => {
    const pYear = p.payment_date ? new Date(p.payment_date).getFullYear() : null;
    return pYear === 2026;
  });

  const yearJobReceipts = jobReceipts.filter(r => {
    const rYear = r.date ? new Date(r.date).getFullYear() : null;
    return rYear === 2026;
  });

  const yearContracts = contracts.filter(c => {
    const cYear = c.created_date ? new Date(c.created_date).getFullYear() : null;
    return cYear === 2026;
  });

  const yearOwnerPayments = ownerPayments.filter(p => {
    const pYear = p.payment_date ? new Date(p.payment_date).getFullYear() : null;
    return pYear === 2026 && p.amount_paid > 0;
  });

  // Calculate actual collected income from contracts
  const totalCollected = yearContracts.reduce((sum, c) => sum + (c.client_paid_amount || 0), 0);
  const totalOwnerPayouts = yearOwnerPayments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);

  // Separate inflows and outflows
  const inflows = yearTransactions.filter(t => t.type === "inflow");
  const outflows = yearTransactions.filter(t => t.type === "outflow");

  // Group by category
  const inflowsByCategory = {};
  const outflowsByCategory = {};

  inflows.forEach(t => {
    const cat = t.category || "other";
    inflowsByCategory[cat] = (inflowsByCategory[cat] || 0) + (t.amount || 0);
  });

  outflows.forEach(t => {
    const cat = t.category || "other";
    outflowsByCategory[cat] = (outflowsByCategory[cat] || 0) + (t.amount || 0);
  });

  const totalInflows = Math.max(totalCollected, inflows.reduce((sum, t) => sum + (t.amount || 0), 0));
  const totalOutflows = outflows.reduce((sum, t) => sum + (t.amount || 0), 0);

  // Calculate expense totals
  const totalSubPayouts = yearSubPayments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
  const totalManagerPay = yearManagerPayments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
  const totalMaterialCosts = yearJobReceipts.filter(r => r.category === "materials").reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalOtherExpenses = yearJobReceipts.filter(r => r.category !== "materials").reduce((sum, r) => sum + (r.amount || 0), 0);

  const totalExpenses = totalOutflows + totalSubPayouts + totalManagerPay + totalMaterialCosts + totalOtherExpenses;
  const netIncome = totalInflows - totalExpenses;

  // Group by month for monthly breakdown
  const monthlyData = {};
  yearTransactions.forEach(t => {
    if (!t.date) return;
    const month = new Date(t.date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    if (!monthlyData[month]) {
      monthlyData[month] = { inflow: 0, outflow: 0 };
    }
    if (t.type === "inflow") {
      monthlyData[month].inflow += t.amount || 0;
    } else {
      monthlyData[month].outflow += t.amount || 0;
    }
  });

  // Export to CSV
  const exportToCSV = () => {
    let csv = `Year End Financial Report - ${selectedYear}\n\n`;
    csv += `INCOME BY CATEGORY\n`;
    csv += `Category,Amount\n`;
    Object.entries(inflowsByCategory).forEach(([cat, amt]) => {
      csv += `${cat},"${formatCurrency(amt)}"\n`;
    });
    csv += `Total Income,"${formatCurrency(totalInflows)}"\n\n`;

    csv += `OUTFLOWS BY CATEGORY\n`;
    csv += `Category,Amount\n`;
    Object.entries(outflowsByCategory).forEach(([cat, amt]) => {
      csv += `${cat},"${formatCurrency(amt)}"\n`;
    });
    csv += `Total Outflows,"${formatCurrency(totalOutflows)}"\n\n`;

    csv += `MONTHLY BREAKDOWN\n`;
    csv += `Month,Inflows,Outflows,Net\n`;
    Object.entries(monthlyData).forEach(([month, data]) => {
      csv += `${month},"${formatCurrency(data.inflow)}","${formatCurrency(data.outflow)}","${formatCurrency(data.inflow - data.outflow)}"\n`;
    });

    csv += `\nSUMMARY\n`;
    csv += `Total Income,"${formatCurrency(totalInflows)}"\n`;
    csv += `Total Outflows,"${formatCurrency(totalOutflows)}"\n`;
    csv += `Net Income,"${formatCurrency(netIncome)}"\n`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Year_End_Financials_${selectedYear}.csv`;
    a.click();
  };

  return (
    <div>
      <PageHeader title={`Year End Financials - ${selectedYear}`} description="Complete inflow and outflow tracking for tax preparation">
        <Button onClick={exportToCSV} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </PageHeader>

      {/* Summary - All Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 border-green-200 bg-green-50 cursor-pointer hover:shadow-md transition" onClick={() => setSelectedDetail({ type: "income", data: yearContracts.length > 0 ? yearContracts : inflows })}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-green-700">Total Income</p>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-700">{formatCurrency(totalInflows)}</p>
          <p className="text-xs text-green-600 mt-1 cursor-pointer">Click to verify</p>
        </Card>

        <Card className="p-4 border-red-200 bg-red-50 cursor-pointer hover:shadow-md transition" onClick={() => setSelectedDetail({ type: "outflows", data: outflows })}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-red-700">Bank Expenses</p>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-700">{formatCurrency(totalOutflows)}</p>
          <p className="text-xs text-red-600 mt-1 cursor-pointer">Click to verify</p>
        </Card>

        <Card className="p-4 border-orange-200 bg-orange-50 cursor-pointer hover:shadow-md transition" onClick={() => setSelectedDetail({ type: "materials", data: yearJobReceipts.filter(r => r.category === "materials") })}>
          <p className="text-sm font-semibold text-orange-700">Materials</p>
          <p className="text-3xl font-bold text-orange-700">{formatCurrency(totalMaterialCosts)}</p>
          <p className="text-xs text-orange-600 mt-1 cursor-pointer">Click to verify</p>
        </Card>

        <Card className="p-4 border-purple-200 bg-purple-50 cursor-pointer hover:shadow-md transition" onClick={() => setSelectedDetail({ type: "expenses", data: yearJobReceipts.filter(r => r.category !== "materials") })}>
          <p className="text-sm font-semibold text-purple-700">Other Expenses</p>
          <p className="text-3xl font-bold text-purple-700">{formatCurrency(totalOtherExpenses)}</p>
          <p className="text-xs text-purple-600 mt-1 cursor-pointer">Click to verify</p>
        </Card>
      </div>

      {/* Payouts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 border-indigo-200 bg-indigo-50 cursor-pointer hover:shadow-md transition" onClick={() => setSelectedDetail({ type: "subPayouts", data: yearSubPayments })}>
          <p className="text-sm font-semibold text-indigo-700">Subcontractor Payouts</p>
          <p className="text-3xl font-bold text-indigo-700">{formatCurrency(totalSubPayouts)}</p>
          <p className="text-xs text-indigo-600 mt-1 cursor-pointer">Click to verify</p>
        </Card>

        <Card className="p-4 border-pink-200 bg-pink-50 cursor-pointer hover:shadow-md transition" onClick={() => setSelectedDetail({ type: "managerPay", data: yearManagerPayments })}>
          <p className="text-sm font-semibold text-pink-700">Manager Payouts</p>
          <p className="text-3xl font-bold text-pink-700">{formatCurrency(totalManagerPay)}</p>
          <p className="text-xs text-pink-600 mt-1 cursor-pointer">Click to verify</p>
        </Card>

        <Card className="p-4 border-teal-200 bg-teal-50 cursor-pointer hover:shadow-md transition" onClick={() => setSelectedDetail({ type: "ownerPayouts", data: yearOwnerPayments })}>
          <p className="text-sm font-semibold text-teal-700">Owner Payouts</p>
          <p className="text-3xl font-bold text-teal-700">{formatCurrency(totalOwnerPayouts)}</p>
          <p className="text-xs text-teal-600 mt-1 cursor-pointer">Click to verify</p>
        </Card>

        <Card className={`p-4 ${netIncome >= 0 ? "border-blue-200 bg-blue-50" : "border-orange-200 bg-orange-50"}`}>
          <p className={`text-sm font-semibold ${netIncome >= 0 ? "text-blue-700" : "text-orange-700"}`}>Net Profit</p>
          <p className={`text-3xl font-bold ${netIncome >= 0 ? "text-blue-700" : "text-orange-700"}`}>{formatCurrency(netIncome)}</p>
          <p className={`text-xs mt-1 ${netIncome >= 0 ? "text-blue-600" : "text-orange-600"}`}>{selectedYear} totals</p>
        </Card>
      </div>

      {/* Inflows Section */}
      <h3 className="text-lg font-semibold mb-4 mt-8">Income by Category</h3>
      <Card className="p-6 mb-6 border-green-200">
        {Object.keys(inflowsByCategory).length === 0 ? (
          <p className="text-sm text-muted-foreground">No inflow transactions recorded.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(inflowsByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => (
                <div key={category} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs capitalize">{category}</Badge>
                    <p className="text-sm text-muted-foreground">
                      {inflows.filter(t => (t.category || "other") === category).length} transactions
                    </p>
                  </div>
                  <p className="font-semibold text-green-600">{formatCurrency(amount)}</p>
                </div>
              ))}
            <div className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-200 font-semibold mt-4">
              <span>Total Income</span>
              <span className="text-green-700">{formatCurrency(totalInflows)}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Outflows Section */}
      <h3 className="text-lg font-semibold mb-4">Outflows by Category</h3>
      <Card className="p-6 mb-6 border-red-200">
        {Object.keys(outflowsByCategory).length === 0 ? (
          <p className="text-sm text-muted-foreground">No outflow transactions recorded.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(outflowsByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => (
                <div key={category} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs capitalize">{category}</Badge>
                    <p className="text-sm text-muted-foreground">
                      {outflows.filter(t => (t.category || "other") === category).length} transactions
                    </p>
                  </div>
                  <p className="font-semibold text-red-600">{formatCurrency(amount)}</p>
                </div>
              ))}
            <div className="flex justify-between items-center p-3 bg-red-50 rounded border border-red-200 font-semibold mt-4">
              <span>Total Outflows</span>
              <span className="text-red-700">{formatCurrency(totalOutflows)}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Monthly Breakdown */}
      <h3 className="text-lg font-semibold mb-4">Monthly Breakdown</h3>
      <Card className="p-6 border-blue-200">
        {Object.keys(monthlyData).length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions recorded.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(monthlyData)
              .reverse()
              .map(([month, data]) => (
                <div key={month} className="grid grid-cols-4 gap-4 p-3 bg-muted/50 rounded items-center">
                  <div className="font-semibold">{month}</div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Inflows</p>
                    <p className="font-semibold text-green-600">{formatCurrency(data.inflow)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Outflows</p>
                    <p className="font-semibold text-red-600">{formatCurrency(data.outflow)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Net</p>
                    <p className={`font-semibold ${data.inflow - data.outflow >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                      {formatCurrency(data.inflow - data.outflow)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedDetail} onOpenChange={() => setSelectedDetail(null)}>
       <DialogContent className="max-h-[80vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>
             {selectedDetail?.type === "income" && "Income Breakdown"}
             {selectedDetail?.type === "outflows" && "Bank Expenses Breakdown"}
             {selectedDetail?.type === "materials" && "Materials Breakdown"}
             {selectedDetail?.type === "expenses" && "Other Expenses Breakdown"}
             {selectedDetail?.type === "subPayouts" && "Subcontractor Payouts"}
             {selectedDetail?.type === "managerPay" && "Manager Payouts"}
             {selectedDetail?.type === "ownerPayouts" && "Owner Payouts"}
           </DialogTitle>
         </DialogHeader>

         <div className="space-y-2 text-sm">
           {selectedDetail?.type === "income" && (
             yearContracts.length > 0 ? (
               yearContracts.map(c => (
                 c.client_paid_amount > 0 && (
                   <div key={c.id} className="flex justify-between p-2 bg-muted rounded">
                     <div>
                       <p className="font-semibold">{c.title}</p>
                       <p className="text-xs text-muted-foreground">{c.client_name}</p>
                     </div>
                     <p className="font-semibold text-green-600">{formatCurrency(c.client_paid_amount || 0)}</p>
                   </div>
                 )
               ))
             ) : (
               selectedDetail.data.map(t => (
                 <div key={t.id} className="flex justify-between p-2 bg-muted rounded">
                   <div>
                     <p className="font-semibold capitalize">{t.category}</p>
                     <p className="text-xs text-muted-foreground">{t.description}</p>
                   </div>
                   <p className="font-semibold text-green-600">{formatCurrency(t.amount)}</p>
                 </div>
               ))
             )
           )}
           {selectedDetail?.type === "outflows" && selectedDetail.data.map(t => (
             <div key={t.id} className="flex justify-between p-2 bg-muted rounded">
               <div>
                 <p className="font-semibold capitalize">{t.category}</p>
                 <p className="text-xs text-muted-foreground">{t.description}</p>
               </div>
               <p className="font-semibold text-red-600">{formatCurrency(t.amount)}</p>
             </div>
           ))}
           {(selectedDetail?.type === "materials" || selectedDetail?.type === "expenses") && selectedDetail.data.map(r => (
             <div key={r.id} className="flex justify-between p-2 bg-muted rounded">
               <div>
                 <p className="font-semibold">{r.vendor || r.description}</p>
                 <p className="text-xs text-muted-foreground">{r.date}</p>
               </div>
               <p className="font-semibold">{formatCurrency(r.amount)}</p>
             </div>
           ))}
           {selectedDetail?.type === "subPayouts" && selectedDetail.data.map(p => (
             <div key={p.id} className="flex justify-between p-2 bg-muted rounded">
               <div>
                 <p className="font-semibold">{p.subcontractor_name}</p>
                 <p className="text-xs text-muted-foreground">{p.job_title} • {p.payment_date}</p>
               </div>
               <p className="font-semibold text-indigo-600">{formatCurrency(p.amount_paid)}</p>
             </div>
           ))}
           {selectedDetail?.type === "managerPay" && selectedDetail.data.map(p => (
             <div key={p.id} className="flex justify-between p-2 bg-muted rounded">
               <div>
                 <p className="font-semibold">Manager Payment</p>
                 <p className="text-xs text-muted-foreground">{p.payment_date} • {p.payment_method}</p>
               </div>
               <p className="font-semibold text-pink-600">{formatCurrency(p.amount_paid)}</p>
             </div>
           ))}
           {selectedDetail?.type === "ownerPayouts" && selectedDetail.data.map(p => (
             <div key={p.id} className="flex justify-between p-2 bg-muted rounded">
               <div>
                 <p className="font-semibold">Owner Payout</p>
                 <p className="text-xs text-muted-foreground">{p.payment_date} • {p.payment_method}</p>
               </div>
               <p className="font-semibold text-teal-600">{formatCurrency(p.amount_paid)}</p>
             </div>
           ))}

           <div className="pt-3 border-t mt-4 font-semibold flex justify-between">
             <span>Total</span>
             <span>
               {selectedDetail?.type === "income" && (yearContracts.length > 0 ? formatCurrency(yearContracts.filter(c => c.client_paid_amount > 0).reduce((s, c) => s + (c.client_paid_amount || 0), 0)) : formatCurrency(selectedDetail.data.reduce((s, t) => s + (t.amount || 0), 0)))}
               {selectedDetail?.type === "outflows" && formatCurrency(selectedDetail.data.reduce((s, t) => s + (t.amount || 0), 0))}
               {selectedDetail?.type === "materials" && formatCurrency(selectedDetail.data.reduce((s, r) => s + (r.amount || 0), 0))}
               {selectedDetail?.type === "expenses" && formatCurrency(selectedDetail.data.reduce((s, r) => s + (r.amount || 0), 0))}
               {selectedDetail?.type === "subPayouts" && formatCurrency(selectedDetail.data.reduce((s, p) => s + (p.amount_paid || 0), 0))}
               {selectedDetail?.type === "managerPay" && formatCurrency(selectedDetail.data.reduce((s, p) => s + (p.amount_paid || 0), 0))}
               {selectedDetail?.type === "ownerPayouts" && formatCurrency(selectedDetail.data.reduce((s, p) => s + (p.amount_paid || 0), 0))}
             </span>
           </div>
         </div>
       </DialogContent>
      </Dialog>
      </div>
      );
      }