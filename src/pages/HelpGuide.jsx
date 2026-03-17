import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/shared/PageHeader";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

const helpTopics = [
  {
    id: "dashboard",
    title: "Dashboard & Overview",
    description: "Your daily command center",
    sections: [
      {
        heading: "Operations Command Center",
        content: "Real-time view of active jobs, overdue payments, crew assignments, and financial health. Use this to track daily operations and identify urgent issues.",
      },
      {
        heading: "Daily Assistant",
        content: "AI-powered recommendations based on your current business state. Provides actionable insights for cash flow, job scheduling, and financial decisions.",
      },
      {
        heading: "Financial Snapshot",
        content: "Quick overview of business and personal financial health. Shows cash on hand, tax reserves, upcoming bills, and profit projections.",
      },
    ],
  },
  {
    id: "bids-contracts",
    title: "Bids & Contracts",
    description: "Create estimates and generate contracts",
    sections: [
      {
        heading: "Creating a Bid",
        content:
          "Use Bid Builder to create estimates step-by-step. Enter client details, scope, costs (materials, labor, subcontractors, equipment), overhead, and profit margins. AI assists with pricing recommendations based on historical data.",
      },
      {
        heading: "Importing Bids",
        content:
          "Upload existing bid PDFs, Word documents, or scanned images. AI automatically extracts client name, project details, costs, and payment terms. Review and edit extracted data before saving.",
      },
      {
        heading: "Bid to Contract Workflow",
        content:
          "Once a bid is approved, click 'Create Contract' to generate a professional contract with legal terms, payment schedule, and signature blocks. The contract can then be sent to the client for signing.",
      },
      {
        heading: "Supported File Formats",
        content:
          "PDF, Word (.docx, .doc), and images (JPG, PNG, GIF, TIFF). For best results with scanned documents, ensure the image is clear and readable. Word documents must be in standard format (.docx or .doc).",
      },
    ],
  },
  {
    id: "jobs",
    title: "Job & Project Management",
    description: "Track projects from start to finish",
    sections: [
      {
        heading: "Job Setup",
        content:
          "Create a job by linking it to a client and project address. Set project scope, start date, and estimated completion. Link an approved bid and contract to the job.",
      },
      {
        heading: "Job Calendar",
        content:
          "Visual monthly calendar of upcoming jobs. Shows active projects, projected revenue/costs, profit margins, and assigned crew members. Click to see details and manage timelines.",
      },
      {
        heading: "Job Timeline",
        content:
          "Gantt-style timeline view of all jobs with task breakdowns. Track individual work phases, dependencies, and crew assignments. Identify scheduling conflicts and delays.",
      },
      {
        heading: "Job Closeout",
        content:
          "Complete a project by entering final costs, material usage, labor hours, and subcontractor invoices. System automatically calculates profit, taxes, and owner payouts.",
      },
    ],
  },
  {
    id: "invoicing",
    title: "Invoicing & Payment Collection",
    description: "Send invoices and manage payments",
    sections: [
      {
        heading: "Creating Invoices",
        content:
          "Link invoices to jobs. Create deposit invoices (upfront payment), progress invoices (milestone payments), or final invoices. Set due dates and payment terms.",
      },
      {
        heading: "Sending Invoices",
        content:
          "Send invoices directly to clients via email with one click. Track when invoices are sent, viewed, and paid. Mark invoices as paid when payment is received.",
      },
      {
        heading: "Collection Requests",
        content:
          "For overdue invoices, generate professional collection requests and send via email or print as PDF. System tracks all communication for record-keeping.",
      },
      {
        heading: "Payment Tracking",
        content:
          "Dashboard shows outstanding invoices, overdue amounts, and payment history. Quickly identify which clients owe money and how long payments are outstanding.",
      },
    ],
  },
  {
    id: "financials",
    title: "Financial Management",
    description: "Track money in and out",
    sections: [
      {
        heading: "Business Financials",
        content:
          "Complete overview of company revenue, expenses, profit, and cash flow. Tracks all job income, bills, subcontractor payments, and taxes. See charts and projections.",
      },
      {
        heading: "Personal Financials",
        content:
          "Track personal bills and expenses. Monitor owner draws and personal cash flow. Separates personal from business finances for clear accounting.",
      },
      {
        heading: "Banking & Transactions",
        content:
          "Log bank deposits and payments. Categorize transactions by type (materials, labor, overhead, etc.). Track cash on hand and see where money is going.",
      },
      {
        heading: "Tax Planning",
        content:
          "System automatically calculates tax reserves based on profit. Shows estimated quarterly taxes and helps plan tax payments. Export data for accountant.",
      },
      {
        heading: "Financial Goals & Scenarios",
        content:
          "Set personal and business financial targets. Run 'what-if' scenarios to see impact of pricing changes, hiring, or new equipment purchases on profit and cash flow.",
      },
    ],
  },
  {
    id: "crew",
    title: "Subcontractors & Crew",
    description: "Manage contractors and payments",
    sections: [
      {
        heading: "Adding Subcontractors",
        content:
          "Create profiles for all subcontractors with contact info and payment terms. Track W-9 status and payment history. Set payment rules (fixed, hourly, percentage of labor, percentage of profit).",
      },
      {
        heading: "Crew Assignments",
        content:
          "Assign subcontractors to specific jobs. Track hours worked and payment amounts. View crew assignments on Job Calendar.",
      },
      {
        heading: "Payments & 1099s",
        content:
          "Log all subcontractor payments. System tracks YTD payments and automatically flags when 1099 threshold is reached ($600+). Export W-9 and payment data for tax filing.",
      },
      {
        heading: "Payout Engine",
        content:
          "Automatically calculates how much each subcontractor should be paid based on their contract terms and work completed. Generates payout summaries.",
      },
    ],
  },
  {
    id: "documents",
    title: "Documents & Reports",
    description: "Generate professional files",
    sections: [
      {
        heading: "Document Generator",
        content:
          "Create professional PDFs: bid estimates, contracts, change orders, job financial summaries, subcontractor payment reports, and more. All branded with your company logo.",
      },
      {
        heading: "Document Archive",
        content:
          "Automatically stores all generated documents by job and client. Easy to find and re-send previous bids or contracts.",
      },
      {
        heading: "Tax Export",
        content:
          "Generate comprehensive tax reports showing revenue, expenses, profit, and reserves by job. Export data for your accountant in standard format.",
      },
    ],
  },
  {
    id: "settings",
    title: "Configuration & Settings",
    description: "Customize how the app works",
    sections: [
      {
        heading: "Company Information",
        content:
          "Set company name, address, phone, email, website, EIN, and logo. This information appears on all professional documents and bids.",
      },
      {
        heading: "Financial Defaults",
        content:
          "Set default overhead percentage, contingency percentage, profit margin, and labor rate. These apply to new bids to speed up creation.",
      },
      {
        heading: "Reserve & Payout Allocation",
        content:
          "Configure percentages for tax reserves, operating reserves, subcontractor reserves, owner payouts, and retained earnings. This controls how profit is distributed.",
      },
      {
        heading: "Document Formatting",
        content:
          "Customize page margins, footers, and document formatting. Make all PDFs match your brand.",
      },
      {
        heading: "Manager (1099 Contractor)",
        content:
          "If you have a business manager as a 1099 contractor, enter their details and compensation percentage. System tracks 1099 threshold for tax reporting.",
      },
    ],
  },
];

export default function HelpGuide() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const filtered = helpTopics.filter(
    (topic) =>
      topic.title.toLowerCase().includes(search.toLowerCase()) ||
      topic.description.toLowerCase().includes(search.toLowerCase()) ||
      topic.sections.some(
        (s) =>
          s.heading.toLowerCase().includes(search.toLowerCase()) ||
          s.content.toLowerCase().includes(search.toLowerCase())
      )
  );

  return (
    <div>
      <PageHeader title="Help & Guide" description="Learn how to use all features in MikeBuildsBooks" />

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search help topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No help topics found matching your search.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((topic) => (
            <Card
              key={topic.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <button
                onClick={() =>
                  setExpandedId(expandedId === topic.id ? null : topic.id)
                }
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{topic.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {topic.sections.length} topics
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{topic.description}</p>
                </div>
                {expandedId === topic.id ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground ml-4 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground ml-4 shrink-0" />
                )}
              </button>

              {expandedId === topic.id && (
                <div className="border-t bg-card/50 p-6 space-y-6">
                  {topic.sections.map((section, idx) => (
                    <div key={idx}>
                      <h4 className="font-semibold text-sm text-foreground mb-2">
                        {section.heading}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {section.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Pro Tips</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            • Use the <strong>Daily Assistant</strong> every morning to get AI-powered recommendations.
          </li>
          <li>
            • The <strong>Payout Engine</strong> automatically calculates subcontractor and owner distributions based on profit.
          </li>
          <li>
            • <strong>Financial Scenarios</strong> let you test "what-if" decisions before committing (e.g., price increases, hiring new crew).
          </li>
          <li>
            • Set up <strong>Financial Goals</strong> to track personal savings targets and business milestones.
          </li>
          <li>
            • Generate <strong>Professional Documents</strong> (bids, contracts, reports) with one click, all branded with your logo.
          </li>
        </ul>
      </Card>
    </div>
  );
}