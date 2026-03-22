import React from "react";
import { Link } from "react-router-dom";

const sections = [
  {
    title: "Main",
    links: [
      { label: "Home / Landing", to: "/Landing" },
      { label: "Dashboard", to: "/Dashboard" },
    ],
  },
  {
    title: "Project Management",
    links: [
      { label: "Jobs", to: "/Jobs" },
      { label: "Clients", to: "/Clients" },
      { label: "Contracts", to: "/Contracts" },
      { label: "Change Orders", to: "/ChangeOrders" },
      { label: "Invoicing", to: "/Invoicing" },
      { label: "Job Calendar", to: "/JobCalendar" },
      { label: "Job Timeline", to: "/JobTimeline" },
      { label: "Documents", to: "/Documents" },
      { label: "Daily Assistant", to: "/DailyAssistant" },
    ],
  },
  {
    title: "Estimating & Bids",
    links: [
      { label: "Bid Builder", to: "/BidBuilder" },
      { label: "Smart Bid Builder", to: "/SmartBidBuilder" },
      { label: "Quick Bid", to: "/QuickBid" },
      { label: "AI Estimate Builder", to: "/AIEstimateBuilder" },
      { label: "Bid Package Wizard", to: "/BidPackageWizard" },
    ],
  },
  {
    title: "Financials",
    links: [
      { label: "Business Financials", to: "/BusinessFinancials" },
      { label: "Personal Financials", to: "/PersonalFinancials" },
      { label: "Financial Snapshot", to: "/FinancialSnapshot" },
      { label: "Financial Goals", to: "/FinancialGoals" },
      { label: "Financial Scenario Simulator", to: "/FinancialScenarioSimulator" },
      { label: "Financial Alerts", to: "/FinancialAlerts" },
      { label: "Payout Engine", to: "/PayoutEngine" },
      { label: "Banking", to: "/Banking" },
      { label: "Expenses", to: "/Expenses" },
      { label: "Tax Export", to: "/TaxExport" },
      { label: "Bills Calendar", to: "/BillsCalendarUnified" },
      { label: "Personal Bills Calendar", to: "/PersonalBillsCalendar" },
    ],
  },
  {
    title: "Subcontractors & Permits",
    links: [
      { label: "Subcontractors", to: "/Subcontractors" },
      { label: "Permit Drawing Wizard", to: "/PermitDrawingWizard" },
      { label: "Unified Design Workflow", to: "/UnifiedDesignWorkflow" },
    ],
  },
  {
    title: "Settings & Admin",
    links: [
      { label: "Settings", to: "/Settings" },
      { label: "Admin Panel", to: "/AdminPanel" },
      { label: "Operations Command Center", to: "/OperationsCommandCenter" },
      { label: "Help Guide", to: "/HelpGuide" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "FAQ", to: "/FAQ" },
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Terms of Service", to: "/terms" },
    ],
  },
];

export default function Sitemap() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Sitemap</h1>
        <p className="text-muted-foreground mb-10">A complete index of all pages in MikeBuildsBooks.</p>

        <div className="grid sm:grid-cols-2 gap-8">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">
                {section.title}
              </h2>
              <ul className="space-y-1.5">
                {section.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/Landing" className="text-primary hover:underline">Home</Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/about" className="text-primary hover:underline">About</Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/contact" className="text-primary hover:underline">Contact</Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}