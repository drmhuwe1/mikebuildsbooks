import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FolderOpen, Search } from "lucide-react";

const FEATURE_INVENTORY = [
  { name: "Dashboard", type: "Page", route: "/Dashboard", status: "active", risk: "low", category: "Core" },
  { name: "Operations Command Center", type: "Page", route: "/OperationsCommandCenter", status: "active", risk: "medium", category: "Operations" },
  { name: "Daily Assistant", type: "Feature", route: "/DailyAssistant", status: "active", risk: "low", category: "AI" },
  { name: "Clients", type: "Page", route: "/Clients", status: "active", risk: "low", category: "Core" },
  { name: "Jobs", type: "Page", route: "/Jobs", status: "active", risk: "medium", category: "Core" },
  { name: "Job Timeline", type: "Feature", route: "/JobTimeline", status: "active", risk: "low", category: "Operations" },
  { name: "Job Calendar", type: "Feature", route: "/JobCalendar", status: "active", risk: "low", category: "Operations" },
  { name: "Smart Bid Builder", type: "Feature", route: "/SmartBidBuilder", status: "active", risk: "medium", category: "Bidding" },
  { name: "Bid Builder (Classic)", type: "Feature", route: "/BidBuilder", status: "active", risk: "low", category: "Bidding" },
  { name: "Quick Bid (AI)", type: "Feature", route: "/QuickBid", status: "active", risk: "medium", category: "Bidding" },
  { name: "Bid Package Wizard", type: "Feature", route: "/BidPackageWizard", status: "active", risk: "medium", category: "Bidding" },
  { name: "AI Estimate Builder", type: "Feature", route: "/AIEstimateBuilder", status: "active", risk: "medium", category: "Bidding" },
  { name: "Contracts", type: "Page", route: "/Contracts", status: "active", risk: "medium", category: "Documents" },
  { name: "Contract Generator", type: "Feature", route: "/ContractGenerator", status: "active", risk: "low", category: "Documents" },
  { name: "Change Orders", type: "Feature", route: "/ChangeOrders", status: "active", risk: "medium", category: "Documents" },
  { name: "Change Order Approval", type: "Feature", route: "/change-order-approval", status: "active", risk: "medium", category: "Documents" },
  { name: "Documents", type: "Page", route: "/Documents", status: "active", risk: "low", category: "Documents" },
  { name: "Doc Generator", type: "Feature", route: "/DocGenerator", status: "active", risk: "low", category: "Documents" },
  { name: "Permit Drawing Wizard", type: "Feature", route: "/PermitDrawingWizard", status: "active", risk: "medium", category: "Permits" },
  { name: "Unified Design Workflow", type: "Feature", route: "/UnifiedDesignWorkflow", status: "active", risk: "medium", category: "Permits" },
  { name: "Subcontractors", type: "Page", route: "/Subcontractors", status: "active", risk: "medium", category: "Operations" },
  { name: "Payout Engine", type: "Feature", route: "/PayoutEngine", status: "active", risk: "high", category: "Financial" },
  { name: "Banking", type: "Feature", route: "/Banking", status: "active", risk: "high", category: "Financial" },
  { name: "Bills Calendar", type: "Feature", route: "/BillsCalendarUnified", status: "active", risk: "low", category: "Financial" },
  { name: "Personal Bills Calendar", type: "Feature", route: "/PersonalBillsCalendar", status: "active", risk: "low", category: "Financial" },
  { name: "Personal Bills", type: "Page", route: "/PersonalBills", status: "active", risk: "low", category: "Financial" },
  { name: "Expenses", type: "Page", route: "/Expenses", status: "active", risk: "low", category: "Financial" },
  { name: "Business Financials", type: "Page", route: "/BusinessFinancials", status: "active", risk: "medium", category: "Financial" },
  { name: "Personal Financials", type: "Page", route: "/PersonalFinancials", status: "active", risk: "low", category: "Financial" },
  { name: "Financial Snapshot", type: "Page", route: "/FinancialSnapshot", status: "active", risk: "low", category: "Financial" },
  { name: "Financial Goals", type: "Feature", route: "/FinancialGoals", status: "active", risk: "low", category: "Financial" },
  { name: "Financial Scenario Simulator", type: "Feature", route: "/FinancialScenarioSimulator", status: "active", risk: "low", category: "Financial" },
  { name: "Financial Alerts", type: "Feature", route: "/FinancialAlerts", status: "active", risk: "low", category: "Financial" },
  { name: "Year End Financials", type: "Feature", route: "/YearEndFinancials", status: "active", risk: "low", category: "Financial" },
  { name: "Tax Export", type: "Feature", route: "/TaxExport", status: "active", risk: "low", category: "Financial" },
  { name: "Invoicing", type: "Feature", route: "/Invoicing", status: "active", risk: "medium", category: "Financial" },
  { name: "Settings", type: "Page", route: "/Settings", status: "active", risk: "low", category: "Core" },
  { name: "Customer Account", type: "Page", route: "/CustomerAccount", status: "active", risk: "low", category: "Core" },
  { name: "Admin Panel", type: "Page", route: "/AdminPanel", status: "active", risk: "high", category: "Admin" },
  { name: "Help & Guide", type: "Page", route: "/HelpGuide", status: "active", risk: "low", category: "Core" },
  { name: "Landing Page", type: "Page", route: "/Landing", status: "active", risk: "low", category: "Public" },
  { name: "About", type: "Page", route: "/about", status: "active", risk: "low", category: "Public" },
  { name: "Contact", type: "Page", route: "/contact", status: "active", risk: "low", category: "Public" },
  { name: "FAQ", type: "Page", route: "/FAQ", status: "active", risk: "low", category: "Public" },
  { name: "Sitemap", type: "Page", route: "/Sitemap", status: "active", risk: "low", category: "Public" },
  { name: "Privacy Policy", type: "Page", route: "/privacy-policy", status: "active", risk: "low", category: "Public" },
  { name: "Terms of Service", type: "Page", route: "/terms", status: "active", risk: "low", category: "Public" },
  { name: "Field Payments", type: "Page", route: "/FieldPayments", status: "active", risk: "high", category: "Field" },
  { name: "Field Operations Portal", type: "Page", route: "/FieldOperationsPortal", status: "active", risk: "medium", category: "Field" },
  { name: "App Demo", type: "Page", route: "/AppDemo", status: "active", risk: "low", category: "Public" },
  // Integrations
  { name: "Stripe Payments", type: "Integration", route: "stripeJobPayment", status: "active", risk: "high", category: "Payment" },
  { name: "Stripe Checkout", type: "Integration", route: "stripeCheckout", status: "active", risk: "high", category: "Payment" },
  { name: "Stripe Webhook", type: "Integration", route: "stripeWebhook", status: "active", risk: "high", category: "Payment" },
  { name: "Plaid Banking", type: "Integration", route: "plaidCreateLinkToken", status: "active", risk: "high", category: "Banking" },
  { name: "Email Service", type: "Integration", route: "SendEmail", status: "active", risk: "medium", category: "Email" },
  { name: "Fax Service", type: "Integration", route: "sendDocumentFax", status: "active", risk: "low", category: "Email" },
  { name: "AI Photo Analysis", type: "Integration", route: "analyzeBidPhoto", status: "active", risk: "medium", category: "AI" },
  { name: "AI Cost Estimation", type: "Integration", route: "estimateProjectCosts", status: "active", risk: "medium", category: "AI" },
  { name: "Permit Fee Intelligence", type: "Integration", route: "predictPermitFromAddress", status: "active", risk: "medium", category: "Permits" },
  { name: "Blueprint Generation", type: "Integration", route: "generateSpecDrawings", status: "active", risk: "medium", category: "Permits" },
  // Entities
  { name: "Jobs Entity", type: "Database", route: "base44/entities/Job", status: "active", risk: "high", category: "Data" },
  { name: "Clients Entity", type: "Database", route: "base44/entities/Client", status: "active", risk: "medium", category: "Data" },
  { name: "Subcontractors Entity", type: "Database", route: "base44/entities/Subcontractor", status: "active", risk: "medium", category: "Data" },
  { name: "Contracts Entity", type: "Database", route: "base44/entities/Contract", status: "active", risk: "medium", category: "Data" },
  { name: "Bids Entity", type: "Database", route: "base44/entities/Bid", status: "active", risk: "medium", category: "Data" },
  { name: "Change Orders Entity", type: "Database", route: "base44/entities/ChangeOrder", status: "active", risk: "medium", category: "Data" },
  { name: "Receipts Entity", type: "Database", route: "base44/entities/JobReceipt", status: "active", risk: "low", category: "Data" },
  { name: "Payment Ledger Entity", type: "Database", route: "base44/entities/PaymentLedger", status: "active", risk: "high", category: "Data" },
  { name: "App Settings Entity", type: "Database", route: "base44/entities/AppSettings", status: "active", risk: "high", category: "Data" },
];

const RISK_COLORS = {
  low: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  high: "bg-red-100 text-red-700 border-red-200",
};

export default function FeatureInventory() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const types = ["all", "Page", "Feature", "Integration", "Database"];
  const filtered = FEATURE_INVENTORY.filter(f => {
    const matchesSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.route.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || f.type === filterType;
    return matchesSearch && matchesType;
  });

  const byCategory = {};
  filtered.forEach(f => {
    if (!byCategory[f.category]) byCategory[f.category] = [];
    byCategory[f.category].push(f);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FolderOpen className="w-5 h-5 text-purple-500" />
        <h3 className="font-semibold">Feature Inventory</h3>
        <Badge variant="secondary" className="text-xs">{FEATURE_INVENTORY.length} items</Badge>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search features…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filterType === t ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-input hover:bg-muted"
              }`}
            >
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(byCategory).map(([cat, items]) => (
          <div key={cat}>
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">{cat} ({items.length})</p>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase text-muted-foreground border-b bg-muted/30">
                    <th className="text-left py-2 px-3 font-medium">Name</th>
                    <th className="text-left py-2 px-3 font-medium">Type</th>
                    <th className="text-left py-2 px-3 font-medium">Route / Location</th>
                    <th className="text-left py-2 px-3 font-medium">Status</th>
                    <th className="text-left py-2 px-3 font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((f, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="py-2 px-3 font-medium">{f.name}</td>
                      <td className="py-2 px-3"><Badge variant="outline" className="text-xs">{f.type}</Badge></td>
                      <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{f.route}</td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> {f.status}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${RISK_COLORS[f.risk]}`}>{f.risk}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}