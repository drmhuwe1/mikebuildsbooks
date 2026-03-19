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
    emoji: "🏠",
    description: "Your daily command center — start here every morning",
    sections: [
      {
        heading: "Operations Command Center",
        content: "This is your big-picture view. It shows all active jobs, who owes you money, upcoming bills, and how healthy your business is right now. Think of it as your morning briefing — open it first thing to see what needs your attention today.",
      },
      {
        heading: "Daily Assistant",
        content: "The AI reads your current jobs, cash flow, and upcoming payments, then gives you plain-English advice. It might say 'You have $3,200 in bills due this week but only $1,800 in reserves — consider collecting the Smith deposit.' Check it daily.",
      },
      {
        heading: "Financial Snapshot",
        content: "A one-page summary of how you're doing financially — business cash, personal cash, tax reserves, and profit at a glance. Great for a quick gut-check without digging through reports.",
      },
      {
        heading: "Financial Alerts",
        content: "Automatic warnings when something looks off — like a job going over budget, a duplicate transaction, or a margin that's too thin. These pop up so nothing slips through the cracks.",
      },
    ],
  },
  {
    id: "clients",
    title: "Clients",
    emoji: "👤",
    description: "Store and manage all your customer info in one place",
    sections: [
      {
        heading: "Adding a Client",
        content: "Go to Clients and click 'Add Client.' Enter their name, phone, email, and address. Once saved, you can link bids, jobs, and contracts directly to them so everything stays organized.",
      },
      {
        heading: "Client History",
        content: "Click on any client to see all their past and current jobs, bids, and contracts. Helpful when a client calls asking about a previous project — everything is right there.",
      },
    ],
  },
  {
    id: "bids-contracts",
    title: "Bids & Contracts",
    emoji: "📋",
    description: "Create estimates and turn them into signed contracts",
    sections: [
      {
        heading: "Creating a Bid",
        content: "Go to Bid Builder and click 'New Bid.' Walk through the steps: pick a client, describe the job, then enter your costs — materials, labor hours, subcontractors, equipment, and permits. The app calculates overhead and profit automatically based on your settings. When done, you'll see the final bid price.",
      },
      {
        heading: "Importing a Bid from a Document",
        content: "Already have a bid written up as a PDF or Word doc? Click 'Import Bid,' upload the file, and the AI reads it and fills in all the fields for you. Review the numbers, make any edits, then save. This saves a lot of manual typing.",
      },
      {
        heading: "Sending a Bid to a Client",
        content: "Once your bid is ready, open it and click 'Send.' Choose email or print. The bid goes out as a professional PDF with your company logo and all the details.",
      },
      {
        heading: "Turning a Bid into a Contract",
        content: "When a client approves a bid, open it and click 'Create Contract.' The app builds a full contract with payment schedule, legal terms, and your signature block — all pre-filled from the bid. Send it to the client for signing.",
      },
      {
        heading: "Payment Schedule on Contracts",
        content: "Contracts include a 3-part payment schedule: deposit (upfront), start-of-construction payment, and final payment. You can customize the amounts and the label for the middle payment (e.g., 'Upon framing inspection passing').",
      },
    ],
  },
  {
    id: "jobs",
    title: "Jobs & Project Management",
    emoji: "🔨",
    description: "Track every project from start to finish",
    sections: [
      {
        heading: "Creating a Job",
        content: "Go to Jobs and click 'New Job.' Enter the job name, client, address, and scope of work. Link it to an approved bid and contract if you have them. Set a start date and projected completion date.",
      },
      {
        heading: "Job Status",
        content: "Each job has a status: Bidding → Contracted → In Progress → Completed. Update the status as the project moves forward. The dashboard uses this to show what's active.",
      },
      {
        heading: "Tracking Costs on a Job",
        content: "As the job progresses, enter your actual costs — materials purchased, subcontractor invoices, permit fees. This lets you see in real-time if the job is on budget or running over.",
      },
      {
        heading: "Job Calendar",
        content: "See all your jobs on a calendar. Click any date to see what's scheduled, what the expected revenue is, and who's assigned. Great for planning your month.",
      },
      {
        heading: "Job Timeline",
        content: "A visual bar chart showing all jobs side-by-side with their phases and tasks. Drag and resize to adjust schedules. Spot conflicts where two big jobs overlap.",
      },
      {
        heading: "Closing Out a Job",
        content: "When a job is done, go to the job and click 'Closeout.' You'll enter final material costs, labor, subcontractor payments, and confirm what the client paid. The app then calculates your actual profit, tax reserve, and owner payout for that job.",
      },
    ],
  },
  {
    id: "permits",
    title: "Permits & Drawings",
    emoji: "📐",
    description: "Generate permit drawings and manage municipal contacts",
    sections: [
      {
        heading: "Permit Drawing Wizard",
        content: "Go to Permit Drawing Wizard to create permit-ready drawings for decks and roofs. Enter the project address, dimensions, materials, and structural details step-by-step. The app builds a professional drawing package you can bring to the permit office.",
      },
      {
        heading: "Unified Design Workflow",
        content: "For bigger projects, use the Unified Design Workflow. It walks you through design, structural review, code compliance, permit requirements, fee estimation, and even building the permit packet — all in one place.",
      },
      {
        heading: "Municipality Contacts",
        content: "Each job can have a linked municipality record. Store the building department phone, email, permit office hours, and inspector info. No more hunting for the right number when you need to schedule an inspection.",
      },
      {
        heading: "Inspection Tracking",
        content: "Log each inspection request — type (framing, electrical, final, etc.), scheduled date, inspector name, and result. Mark as passed, failed, or needing follow-up. All inspection history lives on the job record.",
      },
      {
        heading: "Permit Fee Estimator",
        content: "The app can look up estimated permit fees for your project based on the municipality and project type. Use this when building your bid so permit costs are accurate.",
      },
    ],
  },
  {
    id: "invoicing",
    title: "Invoicing & Payments",
    emoji: "💳",
    description: "Send invoices and track what clients owe you",
    sections: [
      {
        heading: "Creating an Invoice",
        content: "Go to Invoicing and click 'New Invoice.' Link it to a job, set the amount, due date, and type (deposit, progress, or final). The invoice pulls in client contact info automatically.",
      },
      {
        heading: "Sending an Invoice",
        content: "Click 'Send' on any invoice to email it directly to the client as a PDF. The email includes payment instructions and your contact info. You can also print it.",
      },
      {
        heading: "Marking as Paid",
        content: "When a client pays, open the invoice and click 'Mark Paid.' Enter the payment date. This updates the job's payment tracking automatically.",
      },
      {
        heading: "Overdue Invoices",
        content: "The dashboard highlights overdue invoices in red. You can send a follow-up collection request directly from the invoice with one click.",
      },
    ],
  },
  {
    id: "banking",
    title: "Banking & Transactions",
    emoji: "🏦",
    description: "Connect your bank or manually log all transactions",
    sections: [
      {
        heading: "Connecting a Bank Account (Plaid)",
        content: "Go to Banking and click 'Connect Account.' Choose Business or Personal, then click 'Connect with Plaid.' You'll be guided to log into your bank securely — your login is never stored. Once connected, transactions sync automatically.",
      },
      {
        heading: "Adding a Manual Account",
        content: "If you don't want to connect a bank, you can add accounts manually. Enter the bank name, account type, and current balance. Then log transactions by hand.",
      },
      {
        heading: "Categorizing Transactions",
        content: "Each transaction needs a category (materials, payroll, overhead, tax, etc.). Uncategorized transactions are flagged in orange. Click the transaction and pick a category. You can also link it to a specific job.",
      },
      {
        heading: "Business vs. Personal",
        content: "Tag each account as Business or Personal. Business transactions flow into your profit/loss reports. Personal transactions feed your personal budget tracking. Keep them separate for clean books.",
      },
      {
        heading: "Syncing Transactions",
        content: "For connected Plaid accounts, click the sync button (the circular arrow icon) on the account card to pull in the latest transactions. New ones show up automatically as 'uncategorized' for you to review.",
      },
    ],
  },
  {
    id: "financials",
    title: "Financial Management",
    emoji: "📊",
    description: "Track profits, plan taxes, and understand your money",
    sections: [
      {
        heading: "Business Financials",
        content: "See your company's total revenue, expenses, profit, and cash flow in one place. Charts break down where money comes from and where it goes. Use the month-by-month view to spot slow seasons.",
      },
      {
        heading: "Personal Financials",
        content: "Track your personal bills, owner draws, and household cash flow separate from the business. Set a personal monthly budget and see if you're hitting it.",
      },
      {
        heading: "Tax Planning",
        content: "Every time a job closes, the app sets aside a tax reserve (based on your settings — usually 25%). Go to Tax Export to see your estimated tax liability by quarter and export a report for your accountant.",
      },
      {
        heading: "Financial Goals",
        content: "Set savings targets — like 'Save $10,000 for a new truck' or 'Build a 3-month emergency fund.' Track progress over time. The app shows how long it'll take at your current save rate.",
      },
      {
        heading: "Scenario Simulator",
        content: "Curious what happens if you raise prices 10%? Or hire a second crew? Use the Scenario Simulator to model changes and see the projected impact on profit and cash flow before you commit.",
      },
      {
        heading: "Payout Engine",
        content: "After a job closes, the Payout Engine calculates how profit should be split — owner draw, tax reserve, operating reserve, and manager pay — based on your configured percentages. It tells you exactly how much to move where.",
      },
    ],
  },
  {
    id: "crew",
    title: "Subcontractors & 1099s",
    emoji: "🧰",
    description: "Manage contractors, W-9s, and year-end tax forms",
    sections: [
      {
        heading: "Adding a Subcontractor",
        content: "Go to Subcontractors and click 'Add Subcontractor.' Enter their name, company, contact info, specialty, and payment terms. You can set whether they're paid a fixed amount, hourly, or a percentage of labor or profit.",
      },
      {
        heading: "Collecting a W-9 Digitally",
        content: "Click on a subcontractor and find the W-9 section. Click 'Collect W-9 Digitally' to open a guided form. The sub enters their legal name, tax classification, address, and SSN/EIN, then signs digitally. Everything is saved securely.",
      },
      {
        heading: "Uploading a Physical W-9",
        content: "If the sub handed you a paper W-9, click 'Upload W-9 (JPG/PDF).' Take a photo or scan the document and upload it. The system marks their W-9 as received and stores the file on their profile.",
      },
      {
        heading: "Logging Payments",
        content: "Every time you pay a subcontractor, log it under their profile linked to the job. The system tracks their year-to-date total and automatically flags them when they hit the $600 threshold — meaning you'll need to file a 1099-NEC.",
      },
      {
        heading: "1099 Tracking",
        content: "The app watches YTD payments for every subcontractor. When anyone hits $600, a warning badge appears. At year-end, go to Tax Export to pull all the 1099 data you need.",
      },
      {
        heading: "SSN Security",
        content: "SSN and EIN numbers are masked by default — you only see dots while typing. Click the eye icon to reveal the number when you need to. This protects sensitive info from being seen over your shoulder.",
      },
    ],
  },
  {
    id: "documents",
    title: "Documents & Reports",
    emoji: "📄",
    description: "Generate professional PDFs with your company branding",
    sections: [
      {
        heading: "Document Generator",
        content: "Go to Documents to generate professional PDFs: bid estimates, contracts, change orders, job summaries, subcontractor payment reports, and more. All documents include your company logo, name, and contact info.",
      },
      {
        heading: "Sending Documents",
        content: "Any generated document can be emailed directly to a client or subcontractor with one click. You can also print or download as PDF.",
      },
      {
        heading: "Document Archive",
        content: "Every document you generate is saved automatically. Go to the Documents page to find any past bid, contract, or report. Filter by client, job, or document type.",
      },
      {
        heading: "Tax Export",
        content: "Go to Tax Export to pull a full tax report — revenue by job, expenses, profit, reserves, and 1099 contractor payments. Hand this to your accountant at year-end.",
      },
    ],
  },
  {
    id: "settings",
    title: "Settings & Setup",
    emoji: "⚙️",
    description: "Set up your company info and default numbers",
    sections: [
      {
        heading: "Company Information (Do This First!)",
        content: "Go to Settings and fill in your company name, address, phone, email, and logo. This shows up on every bid, contract, and invoice you send. Without this, documents look unprofessional.",
      },
      {
        heading: "Financial Defaults",
        content: "Set your default overhead %, contingency %, profit margin %, and labor rate. These fill in automatically when you create a new bid, so you're not starting from scratch every time. You can always override them on individual bids.",
      },
      {
        heading: "Reserve & Payout Percentages",
        content: "Set how profit is split after a job closes: tax reserve (typically 25%), operating reserve, owner draw, admin/manager pay, and retained earnings. These percentages control the Payout Engine calculations.",
      },
      {
        heading: "Manager / 1099 Contractor",
        content: "If your business has a manager who gets paid as a 1099 contractor (not an employee), enter their info here — name, address, EIN/SSN, and their percentage of gross profit. The system tracks their 1099 threshold automatically.",
      },
      {
        heading: "Document Formatting",
        content: "Adjust page margins, footer text, and other formatting preferences for all your generated PDFs. Make documents look exactly the way you want.",
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
                    <span className="text-lg">{topic.emoji}</span>
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
        <h3 className="font-semibold text-blue-900 mb-3">💡 Quick Start — Do These First</h3>
        <ol className="space-y-2 text-sm text-blue-800 list-decimal list-inside">
          <li>Go to <strong>Settings</strong> and enter your company name, address, and logo.</li>
          <li>Add your first <strong>Client</strong>, then create a <strong>Bid</strong> for them.</li>
          <li>Connect your <strong>Bank Account</strong> under Banking so transactions sync automatically.</li>
          <li>Add your <strong>Subcontractors</strong> and collect their W-9s digitally.</li>
          <li>Check the <strong>Daily Assistant</strong> every morning for personalized recommendations.</li>
        </ol>
      </Card>
    </div>
  );
}