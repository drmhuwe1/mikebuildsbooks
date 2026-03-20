import React, { useState, useMemo } from "react";
import SubscriptionGate from "@/components/subscription/SubscriptionGate";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import { formatCurrency } from "@/lib/formatters";
import { Download, FileText, FileSpreadsheet, Printer } from "lucide-react";
import jsPDF from "jspdf";

// Build list of available years
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

// Schedule C category mapping
const SCHEDULE_C_CATS = [
  { key: "revenue",       label: "Gross Revenue (Line 1)",          color: "text-green-600" },
  { key: "materials",     label: "Materials & Supplies (Line 22)",  color: "text-red-600" },
  { key: "labor",         label: "Labor / Wages (Line 26)",         color: "text-red-600" },
  { key: "subcontractor", label: "Contract Labor / 1099 (Line 11)", color: "text-red-600" },
  { key: "equipment",     label: "Equipment & Rental (Line 20a)",   color: "text-red-600" },
  { key: "permits",       label: "Permits & Licenses (Line 23)",    color: "text-red-600" },
  { key: "insurance",     label: "Insurance (Line 15)",             color: "text-red-600" },
  { key: "vehicle",       label: "Vehicle & Fuel (Line 9)",         color: "text-red-600" },
  { key: "office",        label: "Office Expenses (Line 18)",       color: "text-red-600" },
  { key: "software",      label: "Software / Subscriptions (Line 22b)", color: "text-red-600" },
  { key: "overhead",      label: "Overhead / Utilities (Line 25)",  color: "text-red-600" },
  { key: "other",         label: "Other Expenses (Line 48)",        color: "text-red-600" },
  { key: "net_profit",    label: "Net Profit / Loss (Line 31)",     color: "text-blue-600", bold: true },
];

export default function TaxExport() {
  const [year, setYear] = useState(String(currentYear));
  const [tab, setTab] = useState("summary");

  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 500) });
  const { data: bills = [] } = useQuery({ queryKey: ["bills"], queryFn: () => base44.entities.Bill.list("-due_date", 1000) });
  const { data: subPayments = [] } = useQuery({ queryKey: ["subPayments"], queryFn: () => base44.entities.SubcontractorPayment.list("-created_date", 1000) });
  const { data: ledgerPayments = [] } = useQuery({ queryKey: ["ledgerPayments"], queryFn: () => base44.entities.SubcontractorLedgerPayment.list("-created_date", 1000) });
  const { data: managerPayments = [] } = useQuery({ queryKey: ["managerPayments"], queryFn: () => base44.entities.ManagerPayment.list("-payment_date", 500) });
  const { data: subs = [] } = useQuery({ queryKey: ["subcontractors"], queryFn: () => base44.entities.Subcontractor.list() });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });
  const company = settings[0] || {};

  // Filter records for selected year
  const yearJobs = useMemo(() => jobs.filter(j => {
    const d = j.actual_completion || j.start_date || j.created_date || "";
    return d.startsWith(year);
  }), [jobs, year]);

  const yearBills = useMemo(() => bills.filter(b => (b.paid_date || b.due_date || "").startsWith(year) && b.status === "paid"), [bills, year]);
  const yearSubPay = useMemo(() => subPayments.filter(p => (p.payment_date || p.created_date || "").startsWith(year) && p.status === "paid"), [subPayments, year]);
  const yearLedgerPay = useMemo(() => ledgerPayments.filter(p => (p.payment_date || "").startsWith(year) && p.is_paid), [ledgerPayments, year]);
  const yearManagerPay = useMemo(() => managerPayments.filter(p => (p.payment_date || "").startsWith(year)), [managerPayments, year]);

  // Aggregate Schedule C numbers
  const totals = useMemo(() => {
    const revenue = yearJobs.reduce((s, j) => s + (j.contract_amount || 0) + (j.change_orders_total || 0), 0);
    const materials = yearJobs.reduce((s, j) => s + (j.material_costs || 0), 0)
      + yearBills.filter(b => b.category === "vendor").reduce((s, b) => s + (b.amount || 0), 0);
    const labor = yearJobs.reduce((s, j) => s + (j.labor_costs || 0), 0);
    const subcontractor = yearJobs.reduce((s, j) => s + (j.subcontractor_costs || 0), 0)
      + yearBills.filter(b => b.category === "subcontractor").reduce((s, b) => s + (b.amount || 0), 0);
    const equipment = yearJobs.reduce((s, j) => s + (j.equipment_costs || 0), 0)
      + yearBills.filter(b => b.category === "equipment").reduce((s, b) => s + (b.amount || 0), 0);
    const permits = yearJobs.reduce((s, j) => s + (j.permit_costs || 0), 0);
    const insurance = yearBills.filter(b => b.category === "insurance").reduce((s, b) => s + (b.amount || 0), 0);
    const vehicle = yearBills.filter(b => b.category === "utilities" && b.title?.toLowerCase().includes("fuel")).reduce((s, b) => s + (b.amount || 0), 0);
    const office = yearBills.filter(b => b.category === "rent").reduce((s, b) => s + (b.amount || 0), 0);
    const software = yearBills.filter(b => b.category === "software").reduce((s, b) => s + (b.amount || 0), 0);
    const overhead = yearJobs.reduce((s, j) => s + (j.overhead_costs || 0), 0)
      + yearBills.filter(b => b.category === "utilities").reduce((s, b) => s + (b.amount || 0), 0);
    const other = yearJobs.reduce((s, j) => s + (j.other_costs || 0), 0)
      + yearBills.filter(b => b.category === "other" || b.category === "tax").reduce((s, b) => s + (b.amount || 0), 0);
    const totalExpenses = materials + labor + subcontractor + equipment + permits + insurance + vehicle + office + software + overhead + other;
    const net_profit = revenue - totalExpenses;
    return { revenue, materials, labor, subcontractor, equipment, permits, insurance, vehicle, office, software, overhead, other, net_profit };
  }, [yearJobs, yearBills]);

  // Per-subcontractor 1099 totals — merge legacy + ledger payments
  const subTotals = useMemo(() => {
    const map = {};
    // Legacy SubcontractorPayment records
    yearSubPay.forEach(p => {
      if (!map[p.subcontractor_id]) {
        const sub = subs.find(s => s.id === p.subcontractor_id);
        map[p.subcontractor_id] = { name: p.subcontractor_name || "Unknown", company: sub?.company || "", specialty: sub?.specialty || "", ein: sub?.ssn_or_ein || "", address: sub?.address || "", total: 0, payments: [], ledgerPayments: [], sub };
      }
      map[p.subcontractor_id].total += p.amount || 0;
      map[p.subcontractor_id].payments.push(p);
    });
    // New SubcontractorLedgerPayment records
    yearLedgerPay.forEach(p => {
      if (!map[p.subcontractor_id]) {
        const sub = subs.find(s => s.id === p.subcontractor_id);
        map[p.subcontractor_id] = { name: p.subcontractor_name || "Unknown", company: sub?.company || "", specialty: sub?.specialty || "", ein: sub?.ssn_or_ein || "", address: sub?.address || "", total: 0, payments: [], ledgerPayments: [], sub };
      }
      map[p.subcontractor_id].total += p.amount_paid || 0;
      map[p.subcontractor_id].ledgerPayments.push(p);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [yearSubPay, yearLedgerPay, subs]);

  // CSV export — QuickBooks 1099 compatible format
  const exportCSV = () => {
    const rows = [
      ["MikeBuildsBooks — Tax Year " + year + " Summary"],
      ["Schedule C Category", "Amount"],
      ...SCHEDULE_C_CATS.map(c => [c.label, totals[c.key] || 0]),
      [],
      ["1099-NEC Subcontractor Payments (QuickBooks Import Format)"],
      ["Vendor Name", "Company", "Address", "EIN/SSN", "Specialty", "Total NEC Compensation", "1099 Required", "Legacy Payments", "Ledger Payments"],
      ...subTotals.map(s => [
        s.name, s.company, s.address, s.ein, s.specialty,
        s.total,
        s.total >= 600 ? "YES" : "NO",
        s.payments.length,
        s.ledgerPayments.length,
      ]),
      [],
      ["Detailed Ledger Payment History"],
      ["Date", "Sub Name", "Job", "Method", "Check#", "Amount Due", "Amount Paid"],
      ...subTotals.flatMap(s => s.ledgerPayments.map(p => [
        p.payment_date, s.name, p.job_title, p.payment_method, p.check_number || "", p.total_amount_due, p.amount_paid
      ])),
    ];
    const csv = rows.map(r => r.map(v => `"${v ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `1099_TaxExport_${year}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // PDF export
  const exportPDF = () => {
    const doc = new jsPDF();
    const companyName = company.company_name || "MikeBuildsBooks";
    doc.setFontSize(16); doc.text(`${companyName} — Tax Year ${year}`, 14, 20);
    doc.setFontSize(11); doc.text("Schedule C Summary", 14, 30);
    let y = 40;
    doc.setFontSize(9);
    SCHEDULE_C_CATS.forEach(cat => {
      const amt = totals[cat.key] || 0;
      doc.text(cat.label, 14, y);
      doc.text(formatCurrency(amt), 160, y, { align: "right" });
      y += 7;
    });
    y += 5;
    doc.setFontSize(11); doc.text("1099 Subcontractor Payments", 14, y); y += 8;
    doc.setFontSize(9);
    subTotals.forEach(s => {
      doc.text(`${s.name}${s.company ? " (" + s.company + ")" : ""}`, 14, y);
      doc.text(formatCurrency(s.total), 160, y, { align: "right" });
      y += 6;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    doc.save(`TaxExport_${year}.pdf`);
  };

  return (
    <SubscriptionGate feature="taxexport">
    <div>
      <PageHeader title="Year-End Tax Export" description="Schedule C summary and 1099 subcontractor report">
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
          <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
        </Button>
        <Button variant="outline" size="sm" onClick={exportPDF} className="gap-1.5">
          <FileText className="w-3.5 h-3.5" /> PDF
        </Button>
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="summary">Schedule C Summary</TabsTrigger>
          <TabsTrigger value="1099">1099 Subcontractor Report</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "summary" && (
        <Card className="overflow-hidden">
          <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
            <p className="text-sm font-semibold">Tax Year {year} — Schedule C Categories</p>
            <span className="text-xs text-muted-foreground">{company.company_name || "Your Business"}</span>
          </div>
          <div className="divide-y">
            {SCHEDULE_C_CATS.map(cat => {
              const amt = totals[cat.key] || 0;
              const isRevenue = cat.key === "revenue";
              const isProfit = cat.key === "net_profit";
              return (
                <div key={cat.key} className={`flex items-center justify-between px-5 py-3 ${isProfit ? "bg-primary/5 font-bold" : isRevenue ? "bg-green-50" : ""}`}>
                  <span className={`text-sm ${cat.color} ${cat.bold ? "font-bold" : ""}`}>{cat.label}</span>
                  <span className={`text-sm font-semibold tabular-nums ${cat.color}`}>
                    {isRevenue ? "" : isProfit ? "" : "− "}{formatCurrency(Math.abs(amt))}
                    {isProfit && amt < 0 ? " (LOSS)" : ""}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3 border-t bg-muted/20">
            <p className="text-xs text-muted-foreground">
              ⚠ This is a management summary. Please consult your tax professional. Categories align with IRS Schedule C for sole proprietors.
            </p>
          </div>
        </Card>
      )}

      {tab === "1099" && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
              <p className="text-sm font-semibold">1099-NEC Subcontractor Payments — {year}</p>
              <span className="text-xs text-muted-foreground">{subTotals.length} contractor(s)</span>
            </div>
            {subTotals.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No subcontractor payments recorded for {year}.</div>
            ) : (
              <div className="divide-y">
                {subTotals.map((s, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between">
                    <div>
                       <p className="text-sm font-semibold">{s.name}</p>
                       <p className="text-xs text-muted-foreground">{s.company || s.specialty || "Independent Contractor"}</p>
                       {s.address && <p className="text-xs text-muted-foreground">{s.address}</p>}
                       {s.ein && <p className="text-xs text-muted-foreground">EIN/SSN: {s.ein}</p>}
                     </div>
                     <div className="text-right">
                       <p className="text-sm font-bold">{formatCurrency(s.total)}</p>
                       <p className="text-xs text-muted-foreground">{s.payments.length + s.ledgerPayments.length} payment(s)</p>
                       {s.total >= 600 ? (
                         <span className="text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">🔴 1099 Required</span>
                       ) : s.total >= 500 ? (
                         <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">🟡 Approaching $600</span>
                       ) : (
                         <span className="text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">🟢 Under $600</span>
                       )}
                     </div>
                    </div>
                ))}
              </div>
            )}
            <div className="px-5 py-3 border-t bg-muted/20 flex justify-between">
              <span className="text-sm font-semibold">Total 1099 Payments</span>
              <span className="text-sm font-bold">{formatCurrency(subTotals.reduce((s, c) => s + c.total, 0))}</span>
            </div>
          </Card>
          <p className="text-xs text-muted-foreground px-1">
            Contractors paid $600 or more in a calendar year require a 1099-NEC filing. Ensure W-9 forms are on file for all contractors above this threshold.
          </p>
        </div>
      )}
    </div>
    </SubscriptionGate>
  );
}