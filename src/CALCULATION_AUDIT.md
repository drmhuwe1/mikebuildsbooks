# MikeBuildsBooks - Complete Calculation Audit
**Last Updated:** 2026-03-19  
**Purpose:** Comprehensive list of all calculations and data routes for NSM validation scans

---

## 1. BID SYSTEM CALCULATIONS

### 1.1 Labor Cost
**Location:** BidBuilder page, Step 7 (Labor)  
**Formula:** `labor_hours × labor_rate = labor_cost`
- **Inputs:** `labor_hours` (number), `labor_rate` ($/hr)
- **Output:** `labor_cost` (stored in Bid entity)
- **Validation Rules:**
  - `labor_hours >= 0`
  - `labor_rate > 0`
  - Result must be `>= 0`
- **Routing:** → Bid.labor_cost → Bid calculation chain
- **Stored In:** `Bid.labor_hours`, `Bid.labor_rate`

### 1.2 Total Estimated Cost
**Location:** BidBuilder  
**Formula:** `material_cost + labor_cost + subcontractor_cost + permit_cost + equipment_cost = total_estimated_cost`
- **Inputs:** 5 cost categories (all numbers)
- **Output:** `total_estimated_cost` (Bid entity)
- **Validation Rules:**
  - Each input `>= 0`
  - Sum must be `>= 0`
  - Cannot be NaN or undefined
- **Routing:** → Used in profit calculations
- **Stored In:** `Bid.total_estimated_cost`

### 1.3 Overhead Calculation
**Location:** BidBuilder, Step 7  
**Formula:** `direct_costs × (overhead_percent / 100) = overhead_amount`
- **Inputs:** 
  - `direct_costs` (material + labor + subcontractor + permit + equipment)
  - `overhead_percent` (stored as 10 for 10%, NOT 0.10)
- **Output:** Overhead amount added to costs
- **Validation Rules:**
  - `overhead_percent >= 0 && overhead_percent <= 100` (must be 0-100 integer or decimal, NOT pre-divided)
  - Result must be `>= 0`
  - **CRITICAL:** Storage convention is integer/decimal value (10 = 10%), divide by 100 in formula
- **Routing:** → Added to direct costs to create total cost
- **Stored In:** `Bid.overhead_percent` (stored as 10, 15, 5.5, etc. — NOT 0.10)

### 1.4 Contingency Calculation
**Location:** BidBuilder, Step 7  
**Formula:** `direct_costs × (contingency_percent / 100) = contingency_amount`
- **Inputs:** 
  - `direct_costs` (same base as overhead)
  - `contingency_percent` (stored as 5 for 5%, NOT 0.05)
- **Output:** Added to costs
- **Validation Rules:**
  - `contingency_percent >= 0 && contingency_percent <= 100`
  - Result must be `>= 0`
  - Storage convention: integer/decimal (5 = 5%), divide by 100 in formula
- **Stored In:** `Bid.contingency_percent` (stored as 5, 10, 2.5, etc.)

### 1.5 Gross Profit (Before Overhead/Contingency)
**Location:** BidBuilder summary  
**Formula:** `bid_amount - total_estimated_cost = gross_profit`
- **Inputs:** `bid_amount`, `total_estimated_cost`
- **Output:** `Bid.gross_profit`
- **Validation Rules:**
  - Can be negative (indicates loss)
  - Result must be calculated accurately to 2 decimals
- **Routing:** → Used in net profit calculation
- **Stored In:** `Bid.gross_profit`

### 1.6 Net Profit (After All Overhead)
**Location:** BidBuilder  
**Formula:** `bid_amount - total_estimated_cost - overhead_amount - contingency_amount = net_profit`
- **Inputs:** bid_amount, all costs
- **Output:** `Bid.net_profit`
- **Validation Rules:**
  - Can be negative
  - Must match: `gross_profit - overhead - contingency`
- **Routing:** → Tax Export, Payout Engine
- **Stored In:** `Bid.net_profit`

### 1.7 Bid Amount (Price to Customer)
**Location:** BidBuilder, Step 7  
**Formula:** `(total_estimated_cost + overhead + contingency) / (1 - (target_profit_margin / 100)) = bid_amount`
- **Inputs:** costs, `target_profit_margin` (%)
- **Output:** `Bid.bid_amount`
- **Validation Rules:**
  - `target_profit_margin > 0 && target_profit_margin < 100`
  - Cannot divide by zero
  - Result must be `> total_estimated_cost`
  - Round to 2 decimals
- **Critical:** This is the customer-facing price
- **Stored In:** `Bid.bid_amount`

### 1.8 Deposit Amount
**Location:** Contract creation  
**Formula:** `bid_amount × (deposit_percent / 100) = deposit_amount`
- **Inputs:** `bid_amount`, `deposit_percent`
- **Output:** `Bid.deposit_amount`, `Contract.deposit_amount`
- **Validation Rules:**
  - `deposit_percent > 0 && deposit_percent <= 100`
  - Result must be `<= bid_amount`
- **Routing:** → Contract payment schedule, Invoice tracking
- **Stored In:** `Bid.deposit_amount`, `Contract.deposit_amount`

### 1.9 Start-of-Construction Amount (Second Payment)
**Location:** Bid/Contract, Step 5  
**ACTUAL IMPLEMENTATION:** Remainder-based calculation only
- **Formula:** `bid_amount - deposit_amount - final_payment_amount = start_of_construction_amount`
- **Inputs:** 
  - `bid_amount` (user-entered or calculated)
  - `deposit_amount` (user-entered, can override calculated percentage)
  - `start_of_construction_amount` (user-entered, OPTIONAL — can be left blank)
  - `final_payment_amount` (auto-calculated as remainder)
- **Output:** `Bid.start_of_construction_amount`
- **Validation Rules:**
  - When user enters second payment amount: `final = bid - deposit - second`
  - When user leaves second payment blank: second remains 0, all remainder goes to final
  - `deposit + start + final = bid_amount` (must balance to 2 decimals)
  - Each must be `> 0` or can be $0 (second is optional)
- **Routing:** → Contract payment schedule, Invoice generation
- **Stored In:** `Bid.start_of_construction_amount`, `Bid.start_of_construction_label` (milestone description)
- **CLARIFICATION:** NO percentage-based priority — user enters exact amounts, system calculates remainder for final

### 1.10 Final Payment Amount
**Location:** Bid/Contract, auto-calculated  
**Formula:** `bid_amount - deposit_amount - start_of_construction_amount = final_payment_amount`
- **Inputs:** bid_amount, deposit_amount, start_of_construction_amount
- **Output:** `Bid.final_payment_amount` (auto-calculated, read-only in UI)
- **Calculation:** Always performed as remainder — final payment absorbs any rounding
- **Validation Rules:**
  - Must be `>= 0` (can be $0 if deposit + second sum to bid)
  - Three payments must sum to bid_amount (within 2-decimal rounding)
  - Auto-rounded to 2 decimals via: `Math.max(0, bidAmount - depositAmt - secondPaymentAmt)`
- **Routing:** → Invoice tracking, Payment schedule
- **Stored In:** `Bid.final_payment_amount`
- **Display Note:** Shows in blue box as "automatically calculated as remaining balance"

---

## 2. JOB FINANCIAL CALCULATIONS

### 2.1 Job Revenue
**Location:** Jobs page, Job detail  
**Formula:** `contract_amount = job revenue` (what customer owes)
- **Inputs:** `Job.contract_amount`
- **Output:** Used in all profit calculations
- **Validation Rules:**
  - Must be `> 0`
  - Should match bid_amount if from bid
- **Routing:** → Profit calculations, Financial dashboards
- **Stored In:** `Job.contract_amount`

### 2.2 Job Total Paid by Customer
**Location:** Jobs tracking  
**Formula:** Sum of all paid invoices on job
- **Inputs:** `Invoice.amount` where `status = "paid"`
- **Output:** `Job.total_paid_by_customer`
- **Validation Rules:**
  - Must be `>= 0`
  - Must be `<= contract_amount`
  - Updated whenever invoice is marked paid
- **Routing:** → Cash flow tracking, Revenue recognition
- **Stored In:** `Job.total_paid_by_customer`

### 2.3 Outstanding Receivables
**Location:** Dashboard, Banking  
**Formula:** `contract_amount - total_paid_by_customer = outstanding`
- **Inputs:** revenue, paid amount
- **Output:** Used in cash position calculations
- **Validation Rules:**
  - Must be `>= 0`
  - Should match sum of unpaid invoices
- **Routing:** → Cash flow warnings, Daily Assistant
- **Stored In:** Calculated on-the-fly

### 2.4 Job Material Costs
**Location:** Job detail, Materials tab  
**Formula:** Sum of all `MaterialCost.cost` for job
- **Inputs:** Each material line item
- **Output:** `Job.material_costs`
- **Validation Rules:**
  - Each cost `>= 0`
  - Sum must match database totals
- **Routing:** → Job profit calculation
- **Stored In:** `Job.material_costs`

### 2.5 Job Labor Costs
**Location:** Job detail  
**Formula:** Sum of labor line items OR `hours × hourly_rate`
- **Inputs:** Labor entries or hours/rate
- **Output:** `Job.labor_costs`
- **Validation Rules:**
  - Each entry `>= 0`
  - Validate hours are reasonable (0-24 per day)
- **Routing:** → Profit calculation
- **Stored In:** `Job.labor_costs`

### 2.6 Job Subcontractor Costs
**Location:** Job detail, Subcontractor payment logs  
**Formula:** Sum of all `SubcontractorPayment.amount` for job
- **Inputs:** Payment entries per subcontractor
- **Output:** `Job.subcontractor_costs`
- **Validation Rules:**
  - Each payment `> 0`
  - Must match payment records
- **Routing:** → Financials, Tax export
- **Stored In:** `Job.subcontractor_costs`

### 2.7 Job Permit Costs
**Location:** Job detail  
**Formula:** Sum of permit fees
- **Inputs:** `PermitFee` records or manual entry
- **Output:** `Job.permit_costs`
- **Validation Rules:**
  - Each `>= 0`
- **Routing:** → Profit calculation
- **Stored In:** `Job.permit_costs`

### 2.8 Job Equipment Costs
**Location:** Job detail  
**Formula:** Sum of equipment rentals/purchases
- **Inputs:** Equipment line items
- **Output:** `Job.equipment_costs`
- **Validation Rules:**
  - Each `>= 0`
- **Routing:** → Profit calculation
- **Stored In:** `Job.equipment_costs`

### 2.9 Job Overhead Costs
**Location:** Job detail  
**Formula:** `total_other_costs × (default_overhead_percent / 100)` OR manual
- **Inputs:** Overhead % from settings or override
- **Output:** `Job.overhead_costs`
- **Validation Rules:**
  - Percent `>= 0 && <= 100`
- **Routing:** → Profit calculation
- **Stored In:** `Job.overhead_costs`

### 2.10 Job Total Costs
**Location:** All job views  
**Formula:** `material + labor + subcontractor + permit + equipment + overhead + other = total_costs`
- **Inputs:** All 7 cost categories
- **Output:** Used in profit calculation
- **Validation Rules:**
  - Sum must be `>= 0`
  - Must match database sum
- **Routing:** → Profit = Revenue - Total Costs
- **Calculated:** On-the-fly from stored costs

### 2.11 Job Gross Profit
**Location:** Job detail, Dashboard  
**Formula:** `contract_amount - total_costs = gross_profit`
- **Inputs:** revenue, total costs
- **Output:** `Job.gross_profit` (calculated)
- **Validation Rules:**
  - Can be negative (loss)
  - Must be `contract_amount - total_costs`
- **Routing:** → Payout Engine, Financial alerts
- **Calculated:** On-the-fly

### 2.12 Job Profit Margin %
**Location:** Job card, Dashboard  
**Formula:** `(gross_profit / contract_amount) × 100 = margin_percent`
- **Inputs:** gross_profit (can be negative), contract_amount
- **Output:** Display only (shows %, can be very negative)
- **Validation Rules:**
  - Contract_amount must not be 0 (check before dividing)
  - Result CAN range from -∞ to +∞ (no validation cap)
    - If costs are 3x revenue: margin = -200%
    - If profit is very high: margin = 75%+
  - Do NOT cap validation to -100 to 100 range
  - Flag extreme values (< -50% or > 60%) as warnings, not errors
  - Round to 1 decimal
- **Routing:** → Risk alerts (warn if < 15% AND > 0% to avoid false alarms on losses)
- **Calculated:** On-the-fly

---

## 3. PAYOUT ENGINE CALCULATIONS

### 3.1 Tax Reserve (& All Payout Allocations)
**Location:** Payout Engine  
**CRITICAL CORRECTION:** The Payout Engine uses a **two-step allocation**:
1. **Manager Pay** (business manager/1099 contractor) — **FIRST** deducted from gross profit
2. **Remaining Buckets** — applied to NET profit AFTER manager pay

**Formulas:**
- Manager Pay: `gross_profit × (manager_pay_percent / 100) = manager_pay` (default 10%)
- Net After Manager: `gross_profit - manager_pay = net_after_manager`
- Tax Reserve: `net_after_manager × (tax_reserve_percent / 100) = tax_amount` (default 25%)
- Owner Payout: `net_after_manager × (owner_payout_percent / 100) = owner_draw` (default 30%)
- Operating Reserve: `net_after_manager × (operating_reserve_percent / 100)` (default 10%)
- Retained Earnings: `net_after_manager × (retained_earnings_percent / 100)` (default 10%)
- Subcontractor Reserve: `net_after_manager × (subcontractor_reserve_percent / 100)` (default 10%)

**Which Gross Profit?** Uses **Job Gross Profit** (section 2.11):
- `gross_profit = revenue - direct_costs - overhead - other_costs`
- This is calculated AFTER overhead is already applied
- NOT the Bid gross_profit (which excludes overhead)

**Validation Rules:**
- Manager % + sum of bucket % should total 100% (if following standard allocation)
- All percentages must be 0-100
- All amounts must be `>= 0`
- Cannot exceed gross_profit
- **CRITICAL:** Verify payout basis (gross_profit vs cash_collected) in settings

**Routing:** → Tax tracking, Owner draws, Reserve accounts
**Stored In:** Calculated and displayed per job, tracked via SubcontractorPayment (manager), financial records (owner/reserves)

### 3.2-3.6 (CONSOLIDATED - See 3.1 Above)
All remaining bucket allocations are calculated AFTER manager pay is deducted.
See Section 3.1 for complete formulas and validation rules.

---

## 4. SUBCONTRACTOR PAYMENT TRACKING (NEW SYSTEM)

### 4.1 Hourly Payment Calculation
**Location:** PaymentLogDialog, Subcontractors page  
**Formula:** `hours_worked × hourly_rate = amount`
- **Inputs:** 
  - `form.hours_worked` (number, step 0.5)
  - `form.hourly_rate` ($/hr, number)
- **Output:** `SubcontractorPayment.amount`
- **Validation Rules:**
  - `hours_worked >= 0`
  - `hourly_rate > 0`
  - Result must be `>= 0`
  - Round to 2 decimals
  - Cannot be NaN
- **Calculation Trigger:** `onBlur` on EITHER hours_worked OR hourly_rate field
  - When user leaves either field, `handleAmountChange()` fires
  - Recalculates if both hours_worked AND hourly_rate are truthy
  - Updates `form.amount` and `calculation_notes` simultaneously
  - User sees updated amount immediately after leaving the field
- **Storage:** `SubcontractorPayment.calculation_notes = "${hours_worked} hours × $${hourly_rate}/hr"`
- **Routing:** → BankTransaction (outflow/subcontractor) via automation
- **User Experience:** Amount auto-fills on blur, not on real-time onChange (prevents stale values during editing)

### 4.2 YTD Subcontractor Payment Sum
**Location:** Subcontractors page detail  
**Formula:** Sum of all `SubcontractorPayment.amount` where `status = "paid"` AND year matches current year
- **Inputs:** All SubcontractorPayment records for one contractor
- **Output:** Display "YTD Paid: $X"
- **Validation Rules:**
  - Filter by: `status = "paid"` AND `payment_date starts with current year`
  - Sum must be `>= 0`
  - Must match database query exactly
- **Routing:** → 1099 threshold check (flag if >= $600)
- **Calculated:** On-the-fly from database

### 4.3 1099 Threshold Check
**Location:** Subcontractors list, detail view  
**Formula:** `ytd_paid >= 600 = requires_1099`
- **Inputs:** YTD paid amount
- **Output:** Boolean flag, visual alert
- **Validation Rules:**
  - Must be exact: >= 600 triggers alert
  - Check runs on page load and after each payment log
- **Routing:** → W-9 collection prompts, Tax Export
- **Stored In:** `Subcontractor.requires_1099` (derived)

---

## 5. FINANCIAL SYNC ROUTING

### 5.1 SubcontractorPayment → BankTransaction
**Location:** syncSubcontractorPayments function  
**Trigger:** When `SubcontractorPayment` created with `status = "paid"`
- **Data Routing:**
  - `SubcontractorPayment.amount` → `BankTransaction.amount`
  - `SubcontractorPayment.payment_date` → `BankTransaction.date`
  - `SubcontractorPayment.job_id` → `BankTransaction.job_id`
  - `SubcontractorPayment.job_title` → `BankTransaction.job_title`
  - `SubcontractorPayment.subcontractor_name` → `BankTransaction.vendor`
  - Fixed description: `"Subcontractor Payment - [Name] ([Job])"`
  - `BankTransaction.category = "subcontractor"` (hardcoded)
  - `BankTransaction.type = "outflow"` (hardcoded)
  - `BankTransaction.is_categorized = true` (hardcoded)
  - Payment method + reference in notes field
- **Validation Rules:**
  - Amount must be `> 0`
  - Payment_date must be valid date
  - Cannot sync if payment already synced (check `synced_to_finances` flag)
  - Must set `SubcontractorPayment.synced_to_finances = true` after sync
- **Error Handling:** Log all errors, return count of synced records
- **Routing:** → Business Financials, Tax Export

---

## 6. BUSINESS FINANCIALS AGGREGATIONS

### 6.1 Total Business Revenue
**Location:** BusinessFinancials page  
**Formula:** Sum of all `Job.contract_amount` where `status = "completed"` OR `total_paid_by_customer > 0`
- **Inputs:** Job records
- **Output:** Display metric
- **Validation Rules:**
  - Sum must be `>= 0`
  - Only count active/completed jobs
- **Routing:** → Dashboard, Reports

### 6.2 Total Business Expenses
**Location:** BusinessFinancials  
**Formula:** Sum of all `BankTransaction.amount` where `type = "outflow"` AND `category in [materials, labor, subcontractor, equipment, permits, overhead, tax, other]`
- **Inputs:** Categorized transactions
- **Output:** Display metric
- **Validation Rules:**
  - Must exclude personal account transactions
  - Must be category-specific
  - Sum must be `>= 0`
- **Routing:** → Dashboard, Reports

### 6.3 Gross Profit
**Location:** BusinessFinancials  
**Formula:** `total_revenue - total_operating_expenses = gross_profit`
- **Inputs:** Revenue, expenses
- **Output:** Display metric
- **Validation Rules:**
  - Can be negative
  - Must match: Revenue - Expenses
- **Routing:** → Financial alerts, Goals tracking

### 6.4 Tax Reserve Calculation
**Location:** BusinessFinancials, Financial Alerts  
**Formula:** Sum of all allocated tax reserves from closed jobs
- **Inputs:** All payout engine allocations
- **Output:** Display & warning if insufficient
- **Validation Rules:**
  - Sum must be `>= 0`
  - Should be flagged if < estimated quarterly tax liability
- **Routing:** → Tax planning, Alerts

---

## 7. INVOICE & CONTRACT PAYMENT TRACKING

### 7.1 Invoice Amount Due
**Location:** Invoicing page  
**Formula:** Manual entry (from bid breakdown)
- **Inputs:** User-entered `amount`
- **Output:** `Invoice.amount`
- **Validation Rules:**
  - Must be `> 0`
  - Sum of all invoices should roughly equal bid_amount
  - Round to 2 decimals
- **Routing:** → Customer payment tracking

### 7.2 Total Received on Job
**Location:** Job detail  
**Formula:** Sum of all `Invoice.amount` where `status = "paid"`
- **Inputs:** Invoice records
- **Output:** `Job.total_paid_by_customer`
- **Validation Rules:**
  - Must be `<= contract_amount`
  - Must be `>= 0`
- **Routing:** → Profit recognition, Cash flow

---

## 8. FINANCIAL GOALS TRACKING

### 8.1 Goal Progress
**Location:** FinancialGoals page  
**Formula:** `(current_amount / target_amount) × 100 = progress_percent`
- **Inputs:** `FinancialGoal.current_amount`, `target_amount`
- **Output:** Progress bar %
- **Validation Rules:**
  - Target must be `> 0`
  - Current must be `>= 0`
  - Progress can exceed 100%
- **Routing:** → Dashboard, Goal tracking

### 8.2 Goal Remaining
**Location:** Goals detail  
**Formula:** `target_amount - current_amount = remaining`
- **Inputs:** Goal amounts
- **Output:** Display
- **Validation Rules:**
  - Can be negative (goal exceeded)
  - Display only

### 8.3 Months to Goal
**Location:** Goals tracking  
**Formula:** `remaining / monthly_contribution = months_needed`
- **Inputs:** remaining, `monthly_contribution`
- **Output:** Estimated months
- **Validation Rules:**
  - Monthly contribution must be `> 0` to divide
  - If 0, show "Never at current pace"
  - Round up to nearest month

---

## 9. SCENARIO SIMULATOR CALCULATIONS

### 9.1 Price Increase Impact
**Location:** FinancialScenarioSimulator  
**Formula:** `current_bid_price × (1 + (price_change_percent / 100)) = new_price`
- **Inputs:** `job_price_change_percent`
- **Output:** Projected revenue
- **Validation Rules:**
  - Percent can be negative
  - Result must be `> 0`
- **Routing:** → Projection display

### 9.2 Cost Impact
**Location:** Scenario simulator  
**Formula:** `current_cost × (1 + (cost_change_percent / 100)) = new_cost`
- **Inputs:** `material_cost_change_percent`
- **Output:** Projected cost
- **Validation Rules:**
  - Percent can be negative (but result must stay `>= 0`)
- **Routing:** → Projection display

### 9.3 Jobs Per Month Impact
**Location:** Scenario simulator  
**Formula:** `current_jobs_per_month + jobs_per_month_change = new_rate`
- **Inputs:** `jobs_per_month_change` (integer)
- **Output:** New monthly job count
- **Validation Rules:**
  - Result must be `> 0`
  - Must be integer
- **Routing:** → Revenue projections

### 9.4 Projection: Annual Revenue Impact
**Location:** Scenario results  
**Formula:** `monthly_jobs × bid_price × 12 = annual_revenue`
- **Inputs:** New job rate, new price
- **Output:** Projected revenue
- **Validation Rules:**
  - All inputs must be `> 0`
  - Result must be `> 0`
- **Routing:** → Comparison display

### 9.5 Projection: Annual Profit Impact
**Location:** Scenario results  
**CORRECTED FORMULA:** `annual_revenue - annual_costs = annual_profit`
- **Inputs:** 
  - Projected annual revenue (from jobs × price)
  - Projected annual costs (materials, labor, subs, etc.)
- **Output:** Projected profit
- **Validation Rules:**
  - Can be negative (loss scenario)
  - Do NOT multiply by profit percent again (revenue - costs IS the profit)
  - If using `net_profit_percent`, it represents owner payout share, apply separately
- **Routing:** → Comparison display, scenario impact analysis
- **NOTE:** If the scenario includes "owner gets 30% of profit," calculate: `(annual_revenue - annual_costs) × 0.30 = owner_income`

---

## 10. ALERT & THRESHOLD CALCULATIONS

### 10.1 Budget Overrun Alert
**Location:** FinancialAlerts  
**Formula:** `total_actual_costs > budgeted_amount = overage`
- **Inputs:** Job budget vs actual costs
- **Output:** Alert severity
- **Validation Rules:**
  - Trigger if overage > 5% of budget
- **Routing:** → FinancialAlerts page, Dashboard

### 10.2 Margin Alert
**Location:** Jobs page  
**Formula:** `profit_margin_percent < 15% = low_margin_alert`
- **Inputs:** Calculated margin
- **Output:** Visual indicator
- **Validation Rules:**
  - Trigger if < 15% (configurable in settings)
- **Routing:** → Risk indicator on job card

### 10.3 Cash Position Alert
**Location:** Dashboard  
**Formula:** `total_business_cash < upcoming_bills_30_days = cash_warning`
- **Inputs:** Current cash, upcoming obligations
- **Output:** Alert level
- **Validation Rules:**
  - Trigger if cash < 30 days expenses
- **Routing:** → Daily Assistant, Dashboard alerts

### 10.4 Overdue Invoice Alert
**Location:** Dashboard, Invoicing  
**Formula:** `invoice.due_date < today() AND invoice.status != "paid" = overdue`
- **Inputs:** Due date, today's date, status
- **Output:** Overdue list
- **Validation Rules:**
  - Date comparison must be accurate
  - Only unpaid invoices count
- **Routing:** → Collections prompt

---

## 11. DATA VALIDATION RULES (ACROSS ALL SYSTEMS)

### Universal Rules
1. **Decimal Precision:** All currency fields must round to exactly 2 decimals
2. **NaN Prevention:** Never allow `undefined` or `NaN` in calculations
3. **Negative Prevention:** Most costs must be `>= 0` (profit/margin can be negative)
4. **Sum Verification:** Multi-component sums must verify components add up
5. **Date Validation:** All dates must be valid `YYYY-MM-DD` format
6. **Percentage Validation:** Percentages must be 0-100 unless explicitly allowing override
7. **Division by Zero:** Never divide by 0 (always check before dividing by customer amount, hourly rate, etc.)

---

## 12. CRITICAL DATA FLOWS

```
BID CREATION FLOW:
User Input → material_cost, labor_hours, labor_rate, subcontractor_cost, 
             permit_cost, equipment_cost, overhead_percent, contingency_percent, 
             target_profit_margin
  ↓
Calculations:
  - labor_cost = labor_hours × labor_rate
  - total_cost = material + labor + subcontractor + permit + equipment
  - overhead_amount = total_cost × (overhead_percent / 100)
  - contingency_amount = (total_cost + overhead) × (contingency_percent / 100)
  - bid_amount = (total_cost + overhead + contingency) / (1 - margin/100)
  - gross_profit = bid_amount - total_cost
  - net_profit = bid_amount - total_cost - overhead - contingency
  - deposit_amount = bid_amount × (deposit_percent / 100)
  - start_of_construction = bid_amount - deposit - final
  - final_payment = bid_amount - deposit - start
  ↓
Storage → Bid entity
  ↓
Conversion → Contract (uses bid amounts)
  ↓
Conversion → Job (uses contract amount as revenue)
```

```
JOB PROFIT CALCULATION FLOW:
Job Revenue (from Contract) = contract_amount
  ↓
- Material costs (sum of purchases)
- Labor costs (hours × rate or sum of entries)
- Subcontractor costs (sum of payments)
- Permit costs
- Equipment costs
- Overhead costs
- Other costs
  ↓
= Total Job Costs
  ↓
Job Revenue - Total Costs = Gross Profit
  ↓
Gross Profit / Revenue × 100 = Profit Margin %
  ↓
Routing to:
  - Job card (display profit & margin)
  - Financial alerts (flag if low)
  - Payout engine (split profit)
  - Tax export (track profit by job)
```

```
PAYOUT ENGINE FLOW:
Job Closed & Profit Calculated
  ↓
Gross Profit × AppSettings percentages:
  - tax_reserve_percent → Tax reserve account
  - owner_payout_percent → Owner draw
  - operating_reserve_percent → Business cash
  - admin_compensation_percent → Manager 1099 payment
  - retained_earnings_percent → Business equity
  ↓
VERIFICATION: Sum of all % must = 100
  ↓
Storage → Multiple entities:
  - Tax reserve tracked separately
  - Manager pay → SubcontractorPayment record
  - Owner draw → Personal financial record
  ↓
Routing to:
  - Financial dashboard
  - Tax export (quarterly estimates)
  - 1099 reporting (manager pay)
  - Personal finances (owner draw)
```

```
SUBCONTRACTOR PAYMENT SYNC FLOW:
User logs payment in PaymentLogDialog:
  - payment_type: "hourly"
  - hours_worked: 8
  - hourly_rate: 45
  ↓
Calculation: 8 × 45 = 360
  ↓
Storage → SubcontractorPayment entity:
  - amount: 360
  - hours_worked: 8
  - hourly_rate: 45
  - calculation_notes: "8 hours × $45/hr"
  - synced_to_finances: false
  ↓
Automation Trigger (on create)
  ↓
syncSubcontractorPayments function:
  - Creates BankTransaction (outflow/subcontractor)
  - amount: 360
  - category: "subcontractor"
  - job_id linked
  - description: "Subcontractor Payment - [Name] ([Job])"
  - Sets SubcontractorPayment.synced_to_finances = true
  ↓
Routing to:
  - Business Financials (Expenses Ledger)
  - Cash flow calculations
  - Tax export (contractor expense)
  - YTD 1099 tracking
```

---

## 13. SENSITIVITY AREAS FOR NSM VALIDATION

**HIGH RISK** (verify every calculation):
1. Bid pricing formula (profit margin application)
2. Payout percentages (must sum to 100%)
3. Subcontractor hourly calculations (hours × rate)
4. Financial sync (payment → transaction routing)
5. YTD aggregations (must use correct date filters)
6. Invoice payment reconciliation (must not double-count)

**MEDIUM RISK** (spot-check regularly):
1. Expense categorizations (check BankTransaction category assignments)
2. Job cost summations (verify database sums match UI)
3. Profit margin calculations (check for zero-division)
4. Goal progress percentages (verify division logic)
5. Scenario projections (check month/year logic)

**LOW RISK** (check quarterly):
1. Status flags (paid/unpaid/completed)
2. Display formatting (date, currency)
3. Sorting/filtering (not math-critical but affects user experience)

---

## CHECKLIST FOR NSM VERIFICATION SCANS

- [ ] All currency values round to 2 decimals
- [ ] No NaN or undefined values in calculations
- [ ] Payout percentages sum to 100% (when job closes)
- [ ] Hourly: hours × rate = amount
- [ ] Bid: revenue - costs = profit (verify components)
- [ ] Invoice: sum of payments ≤ contract amount
- [ ] YTD: uses current year filter correctly
- [ ] Sync: every paid SubcontractorPayment creates BankTransaction
- [ ] Tax reserve: percentage matches settings at time of calculation
- [ ] Margin %: (profit / revenue) × 100, no zero-division
- [ ] 1099 threshold: >= $600 exact
- [ ] Date formatting: all dates are valid YYYY-MM-DD
- [ ] Budget alerts: only trigger on specified thresholds