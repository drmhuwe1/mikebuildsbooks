import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import { Download, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function YearEndFinancials() {
  const [selectedYear] = useState(new Date().getFullYear());

  const { data: transactions = [] } = useQuery({
    queryKey: ["bankTransactions"],
    queryFn: () => base44.entities.BankTransaction.list("-date", 1000),
  });

  // Filter to selected year
  const yearTransactions = transactions.filter(t => {
    const txYear = t.date ? new Date(t.date).getFullYear() : null;
    return txYear === selectedYear;
  });

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

  const totalInflows = inflows.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalOutflows = outflows.reduce((sum, t) => sum + (t.amount || 0), 0);
  const netIncome = totalInflows - totalOutflows;

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

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-green-700">Total Income</p>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-700">{formatCurrency(totalInflows)}</p>
          <p className="text-xs text-green-600 mt-1">{inflows.length} transactions</p>
        </Card>

        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-red-700">Total Outflows</p>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-700">{formatCurrency(totalOutflows)}</p>
          <p className="text-xs text-red-600 mt-1">{outflows.length} transactions</p>
        </Card>

        <Card className={`p-4 ${netIncome >= 0 ? "border-blue-200 bg-blue-50" : "border-orange-200 bg-orange-50"}`}>
          <p className={`text-sm font-semibold ${netIncome >= 0 ? "text-blue-700" : "text-orange-700"}`}>Net Income</p>
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
    </div>
  );
}