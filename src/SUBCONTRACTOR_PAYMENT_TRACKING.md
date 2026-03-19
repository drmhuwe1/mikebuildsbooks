# Subcontractor Payment Tracking System

## Overview
Complete system for tracking subcontractor payments with hourly/daily/weekly calculations, job-level breakdown, and automatic sync to Business Financials.

## Features

### 1. Payment Logging
Access via **Subcontractors page → Click any subcontractor → "Log Payment" button**

**Payment Types Supported:**
- **Hourly Rate**: Input hours × hourly rate (auto-calculated)
- **Per Day**: Fixed daily rate
- **Per Week**: Fixed weekly rate
- **Fixed Amount**: One-time payment
- **Lump Sum**: Project completion payment

**Payment Methods Tracked:**
- Venmo (with transaction ID)
- Bank Transfer
- Check (with check #)
- Cash
- Other

### 2. Automatic Calculations
When logging hourly payments:
- Enter hours worked and hourly rate
- System auto-calculates total: `Hours × Rate = Total Amount`
- Stores calculation notes: "8 hours × $45/hr = $360"

### 3. Job-Level Tracking
Each payment links to a specific job:
- Stores: Job ID, Job Title, Payment Amount, Date, Method
- Searchable by job in Subcontractor detail view
- Shows payment history per job

### 4. YTD Tracking
- **YTD Paid**: Shows total paid in current calendar year
- **All-Time Paid**: Total across all time
- **Pending**: Any pending (unpaid) payments
- **1099 Alert**: Automatically flags when YTD exceeds $600

### 5. Payment History
Each subcontractor shows:
- Complete payment history (most recent first)
- Calculation notes (e.g., "8 hours × $45/hr")
- Payment method and reference
- Job associated
- Any additional notes

---

## Financial Integration

### Automatic Sync to Business Financials
**Trigger:** When a payment is logged and marked as "Paid"

**What happens:**
1. Payment creates a `BankTransaction` record with:
   - Category: `subcontractor`
   - Type: `outflow` (expense)
   - Automatically marked as `is_categorized: true`
   - Linked to the job

2. Payment synced flag set to `true` (prevents duplicate syncs)

3. Appears in Business Financials as:
   - **Business Expenses Ledger** → Subcontractor category
   - **Cash Flow Charts** → Outflows
   - **Monthly/YTD Reports** → Categorized spending
   - **Tax Export** → Contractor expenses

### Transaction Details Stored
```
Description: "Subcontractor Payment - [Name] ([Job Title])"
Amount: $360.00
Type: Outflow (Expense)
Category: Subcontractor
Job: Kitchen Remodel – 123 Main St
Vendor: John Smith
Date: 2026-03-15
Notes: "Payment method: venmo - Ref: TX123456 - 8 hours × $45/hr"
Categorized: Yes (auto)
```

---

## Workflow

### Step 1: Set Up Subcontractor
1. Go to **Subcontractors** page
2. Click **"Add Subcontractor"**
3. Fill in:
   - Name
   - Company/Specialty
   - Contact info
   - **Payment Rule** (Hourly Rate recommended)
   - **Hourly Rate** (e.g., $45/hr)
   - W-9 status

### Step 2: Assign to Jobs
- When creating/editing a job, link subcontractors
- Or log payments directly (no pre-assignment needed)

### Step 3: Log Payments
1. Go to **Subcontractors** page
2. Click the subcontractor card to expand
3. Click **"Log Payment"** button
4. Fill in:
   - **Job**: Select which job they worked on
   - **Payment Type**: Hourly, Per Day, Fixed, etc.
   - **Hours/Amount**: Enter hours × rate or fixed amount
   - **Payment Date**: When they were paid
   - **Payment Method**: Venmo, Bank Transfer, Check, etc.
   - **Payment Reference**: Venmo ID, Check #, etc.
   - **Notes**: Any additional details
5. Click **"Log Payment"**

### Step 4: Verify in Financials
1. Go to **Business Financials**
2. Open **Business Expenses Ledger**
3. Filter by **Category: Subcontractor**
4. All logged payments appear here automatically
5. Shows:
   - Amount, date, job, vendor name
   - Status (paid/pending)
   - Payment method

### Step 5: Tax Reporting
1. Go to **Tax Export** at year-end
2. All subcontractor payments appear in:
   - **1099 Contractor Payments** section
   - Grouped by contractor
   - YTD totals calculated
   - Can export for 1099 filing

---

## Data Flow Diagram

```
Subcontractors Page
    ↓
Log Payment Dialog
    ↓
SubcontractorPayment Entity
    (stores payment details: amount, date, job, method, hours, rate)
    ↓
Automation Trigger (on create)
    ↓
syncSubcontractorPayments Function
    ↓
BankTransaction Entity (outflow/subcontractor)
    ↓
Business Financials Dashboard
    (expenses ledger, cash flow, charts, reports)
    ↓
Tax Export
    (1099 reporting, contractor expense summary)
```

---

## Key Fields Explained

| Field | Purpose | Example |
|-------|---------|---------|
| **payment_type** | How to calculate (hourly, daily, fixed) | "hourly" |
| **hours_worked** | Hours worked (for hourly calcs) | 8 |
| **hourly_rate** | Rate per hour | 45 |
| **amount** | Total payment (auto-calc or manual) | 360 |
| **calculation_notes** | How amount was calculated | "8 hours × $45/hr" |
| **payment_date** | When paid | 2026-03-15 |
| **payment_method** | How paid | "venmo" |
| **payment_reference** | Transaction ID | "TX123456" |
| **synced_to_finances** | Auto-synced status | true |
| **status** | Paid or pending | "paid" |

---

## Reports & Exports

### Available Reports

1. **Subcontractor Payment Summary** (Subcontractors page)
   - Export button generates PDF/HTML
   - Lists all contractors with YTD totals
   - Shows W-9 status and 1099 eligibility

2. **Business Expenses Ledger** (Business Financials)
   - Filter by "subcontractor" category
   - See all expenses sorted by date
   - Searchable, sortable, exportable

3. **1099 Report** (Tax Export)
   - Shows contractors with $600+ YTD
   - Ready for accountant/IRS filing
   - Linked to W-9 collection status

4. **Cash Flow Analysis**
   - Monthly subcontractor spending trends
   - Compared to revenue
   - Profit impact visualization

---

## Compliance & Audit Trail

✅ **Full Audit Trail**
- Every payment logged with date/time
- Who logged it (created_by)
- Payment method and reference
- Calculation history stored

✅ **W-9 Tracking**
- Auto-alerts when contractor hits $600 YTD
- Tracks W-9 received date
- Flags missing documentation

✅ **Categorization**
- Every payment auto-categorized
- Searchable by job, contractor, date range
- Ready for tax reporting

✅ **No Data Loss**
- Synced to Business Financials (separate audit trail)
- Calculations stored in notes for transparency
- Payment reference stored for reconciliation

---

## Troubleshooting

**Q: Payment not showing in Business Financials?**
A: Check if `synced_to_finances = true`. If false, run the sync function or log a new payment.

**Q: Hours × rate not calculating?**
A: Enter hours, then enter rate. System auto-calculates on blur. Or manually enter final amount.

**Q: Which bank account should expenses come from?**
A: The system tracks all payments to "business" account category by default. Reconcile manually in Banking tab if needed.

**Q: Can I edit a payment after logging?**
A: Yes. Edit in Subcontractors page. Financial sync will update automatically.