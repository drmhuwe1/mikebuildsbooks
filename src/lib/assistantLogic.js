/**
 * Core logic for the Daily Business Assistant.
 * Returns prioritized action items and health metrics based on app data.
 */

export function buildActionItems({ jobs, bills, subPayments, bankAccounts, contracts, bids, settings, transactions }) {
  const today = new Date().toISOString().split("T")[0];
  const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
  const s = settings || {};
  const items = [];

  // CRITICAL: Overdue bills
  const overdueBills = (bills || []).filter(b => b.status !== "paid" && b.due_date < today);
  overdueBills.forEach(b => {
    items.push({
      priority: 1,
      category: "billing",
      icon: "AlertTriangle",
      color: "red",
      title: `Pay overdue bill: ${b.title}`,
      detail: `Due ${b.due_date} · ${formatC(b.amount)} · ${b.vendor || b.category}`,
      link: "/BillsCalendar",
      id: `overdue_bill_${b.id}`,
    });
  });

  // CRITICAL: Bills due today
  const billsDueToday = (bills || []).filter(b => b.status !== "paid" && b.due_date === today);
  billsDueToday.forEach(b => {
    items.push({
      priority: 2,
      category: "billing",
      icon: "Calendar",
      color: "orange",
      title: `Bill due today: ${b.title}`,
      detail: `${formatC(b.amount)} · ${b.vendor || b.category}`,
      link: "/BillsCalendar",
      id: `today_bill_${b.id}`,
    });
  });

  // HIGH: Pending subcontractor payments
  const pendingSub = (subPayments || []).filter(p => p.status === "pending");
  pendingSub.forEach(p => {
    items.push({
      priority: 3,
      category: "subcontractors",
      icon: "HardHat",
      color: "orange",
      title: `Review subcontractor payment: ${p.subcontractor_name || "Subcontractor"}`,
      detail: `${formatC(p.amount)} · ${p.job_title || "No job assigned"}`,
      link: "/Subcontractors",
      id: `sub_pay_${p.id}`,
    });
  });

  // HIGH: Unsigned contracts (only draft/sent that are NOT signed and accepted)
  const unsignedContracts = (contracts || []).filter(c => (c.status === "draft" || c.status === "sent") && !c.signed_and_accepted);
  unsignedContracts.forEach(c => {
    items.push({
      priority: 3,
      category: "contracts",
      icon: "FileCheck",
      color: "blue",
      title: `Follow up on unsigned contract: ${c.title}`,
      detail: `Status: ${c.status} · ${formatC(c.contract_amount)}`,
      link: "/Contracts",
      id: `contract_${c.id}`,
    });
  });

  // HIGH: Approved bids with no contract
  const approvedBids = (bids || []).filter(b => b.status === "approved");
  approvedBids.forEach(b => {
    const hasContract = (contracts || []).some(c => c.bid_id === b.id || c.job_id === b.job_id);
    if (!hasContract) {
      items.push({
        priority: 3,
        category: "contracts",
        icon: "FileText",
        color: "blue",
        title: `Create contract for approved estimate: ${b.title}`,
        detail: `Bid amount: ${formatC(b.bid_amount)} · Client: ${b.client_name || "—"}`,
        link: "/Contracts",
        id: `bid_no_contract_${b.id}`,
      });
    }
  });

  // MEDIUM: Active jobs missing cost data
  const activeJobs = (jobs || []).filter(j => ["in_progress", "contracted"].includes(j.status));
  activeJobs.forEach(j => {
    const missing = [];
    if (!j.material_costs) missing.push("material costs");
    if (!j.labor_costs) missing.push("labor costs");
    if (!j.projected_completion) missing.push("completion date");
    if (!j.contract_amount) missing.push("contract amount");
    if (missing.length > 0) {
      items.push({
        priority: 4,
        category: "jobs",
        icon: "AlertTriangle",
        color: "yellow",
        title: `Add missing data for job: ${j.title}`,
        detail: `Missing: ${missing.join(", ")}`,
        link: "/Jobs",
        id: `missing_job_${j.id}`,
      });
    }
  });

  // MEDIUM: Jobs over budget
  activeJobs.forEach(j => {
    const revenue = (j.contract_amount || 0) + (j.change_orders_total || 0);
    const costs = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0);
    if (revenue > 0 && costs > revenue * 0.9) {
      items.push({
        priority: 4,
        category: "jobs",
        icon: "TrendingDown",
        color: "red",
        title: `Job approaching budget limit: ${j.title}`,
        detail: `Costs ${formatC(costs)} vs Revenue ${formatC(revenue)} — ${((costs / revenue) * 100).toFixed(0)}% of budget used`,
        link: "/Jobs",
        id: `budget_risk_${j.id}`,
      });
    }
  });

  // MEDIUM: Jobs nearing completion date
  const fiveDays = new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0];
  activeJobs.forEach(j => {
    if (j.projected_completion && j.projected_completion <= fiveDays && j.projected_completion >= today) {
      items.push({
        priority: 4,
        category: "jobs",
        icon: "Clock",
        color: "orange",
        title: `Job nearing completion: ${j.title}`,
        detail: `Projected completion: ${j.projected_completion}`,
        link: "/Jobs",
        id: `nearing_completion_${j.id}`,
      });
    }
    if (j.projected_completion && j.projected_completion < today) {
      items.push({
        priority: 3,
        category: "jobs",
        icon: "Clock",
        color: "red",
        title: `Job past projected completion: ${j.title}`,
        detail: `Was due: ${j.projected_completion}`,
        link: "/Jobs",
        id: `overdue_job_${j.id}`,
      });
    }
  });

  // LOW: Uncategorized bank transactions
  const uncategorized = (transactions || []).filter(t => !t.is_categorized);
  if (uncategorized.length > 0) {
    items.push({
      priority: 5,
      category: "banking",
      icon: "CreditCard",
      color: "yellow",
      title: `Categorize ${uncategorized.length} bank transaction(s)`,
      detail: "Uncategorized transactions affect your financial reports",
      link: "/Banking",
      id: "uncategorized_transactions",
    });
  }

  // LOW: Jobs bidding but no estimate sent (skip if job already has bid or contract linked)
  const biddingJobs = (jobs || []).filter(j => j.status === "bidding");
  biddingJobs.forEach(j => {
    const hasBidOrContract = j.bid_id || j.contract_id;
    if (!hasBidOrContract) {
      items.push({
        priority: 5,
        category: "jobs",
        icon: "FileText",
        color: "blue",
        title: `Create estimate for bidding job: ${j.title}`,
        detail: `Client: ${j.client_name || "—"} · No bid/estimate on file`,
        link: "/BidBuilder",
        id: `no_bid_${j.id}`,
      });
    }
  });

  return items.sort((a, b) => a.priority - b.priority);
}

export function buildHealthMetrics({ jobs, bills, subPayments, bankAccounts, contracts, bids, settings, transactions }) {
   const today = new Date().toISOString().split("T")[0];
   const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
   const monthFromNow = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
   const s = settings || {};

   // Only count SIGNED & ACCEPTED contracts (active revenue)
   const activeContracts = (contracts || []).filter(c => c.signed_and_accepted);
   const totalCash = (bankAccounts || []).reduce((sum, a) => sum + (a.current_balance || 0), 0);

   const totalRevenue = activeContracts.reduce((sum, c) => sum + (c.contract_amount || 0), 0);
   const totalDeposits = activeContracts.reduce((sum, c) => sum + (c.client_paid_amount || 0), 0);
   const outstanding = totalRevenue - totalDeposits;
   
   // Use jobs for cost data if they exist, otherwise calculate from contracts
   const activeJobs = (jobs || []).filter(j => ["in_progress", "contracted"].includes(j.status) && (activeContracts.some(c => c.job_id === j.id) || c.id === j.contract_id));
   const totalCosts = activeJobs.reduce((sum, j) =>
     sum + (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0), 0);
   const grossProfit = totalRevenue - totalCosts;
   const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100) : 0;

   const overdueBills = (bills || []).filter(b => b.status !== "paid" && b.due_date < today);
   const billsThisWeek = (bills || []).filter(b => b.status !== "paid" && b.due_date >= today && b.due_date <= weekFromNow);
   const billsThisMonth = (bills || []).filter(b => b.status !== "paid" && b.due_date >= today && b.due_date <= monthFromNow);

   // Tax reserve based on collected funds (contracts)
   const totalCollected = (contracts || []).reduce((sum, c) => sum + (c.client_paid_amount || 0), 0);
   const taxReserveEstimate = totalCollected * ((s.tax_reserve_percent || 25) / 100);
   const ownerPayoutEstimate = grossProfit * ((s.owner_payout_percent || 30) / 100);
   const adminPayoutEstimate = grossProfit * ((s.admin_compensation_percent || 15) / 100);

  const jobsOverBudget = activeJobs.filter(j => {
    const rev = (j.contract_amount || 0) + (j.change_orders_total || 0);
    const cost = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0);
    return rev > 0 && cost > rev;
  });

  const jobsMissingData = activeJobs.filter(j =>
    !j.material_costs || !j.labor_costs || !j.projected_completion || !j.contract_amount
  );

  return {
    totalCash,
    totalRevenue,
    totalCosts,
    grossProfit,
    profitMargin,
    totalDeposits,
    outstanding,
    taxReserveEstimate,
    ownerPayoutEstimate,
    adminPayoutEstimate,
    overdueBillsCount: overdueBills.length,
    overdueBillsAmount: overdueBills.reduce((s, b) => s + (b.amount || 0), 0),
    billsThisWeekCount: billsThisWeek.length,
    billsThisWeekAmount: billsThisWeek.reduce((s, b) => s + (b.amount || 0), 0),
    billsThisMonthAmount: billsThisMonth.reduce((s, b) => s + (b.amount || 0), 0),
    activeJobsCount: activeJobs.length,
    jobsOverBudgetCount: jobsOverBudget.length,
    jobsMissingDataCount: jobsMissingData.length,
    pendingSubCount: (subPayments || []).filter(p => p.status === "pending").length,
    pendingSubAmount: (subPayments || []).filter(p => p.status === "pending").reduce((s, p) => s + (p.amount || 0), 0),
    unsignedContractsCount: (contracts || []).filter(c => !c.signed_and_accepted && (c.status === "draft" || c.status === "sent")).length,
    unapprovedBidsCount: (bids || []).filter(b => b.status === "sent").length,
  };
}

export function buildJobAssistant(job, contracts, bids) {
  if (!job) return { steps: [], issues: [] };
  const steps = [];
  const issues = [];

  const revenue = (job.contract_amount || 0) + (job.change_orders_total || 0);
  const costs = (job.material_costs || 0) + (job.labor_costs || 0) + (job.subcontractor_costs || 0) + (job.permit_costs || 0) + (job.equipment_costs || 0) + (job.overhead_costs || 0) + (job.other_costs || 0);
  const profit = revenue - costs;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const outstanding = revenue - (job.deposits_received || 0);

  const hasContract = (contracts || []).some(c => c.job_id === job.id);
  const hasBid = (bids || []).some(b => b.job_id === job.id);

  if (job.status === "bidding") {
    if (!hasBid) steps.push({ text: "Create a bid/estimate for this job", link: "/BidBuilder", priority: "high" });
    else steps.push({ text: "Send the estimate to the client", link: "/BidBuilder", priority: "medium" });
  }

  if (job.status === "bidding" || job.status === "contracted") {
    if (!hasContract) steps.push({ text: "Create a contract for this job", link: "/Contracts", priority: "high" });
  }

  if (["contracted", "in_progress"].includes(job.status)) {
    if (!job.deposits_received) steps.push({ text: "Record the deposit payment from the client", link: "/Jobs", priority: "high" });
    if (!job.material_costs) steps.push({ text: "Record material invoice costs", link: "/Jobs", priority: "medium" });
    if (!job.labor_costs) steps.push({ text: "Enter labor cost hours and rate", link: "/Jobs", priority: "medium" });
  }

  if (job.status === "in_progress") {
    if (outstanding > 0) steps.push({ text: `Follow up on outstanding balance of ${formatC(outstanding)}`, link: "/Jobs", priority: "high" });
    steps.push({ text: "Generate and send progress invoice to client", link: "/DocGenerator", priority: "medium" });
  }

  if (job.status === "completed") {
    if (outstanding > 0) steps.push({ text: `Collect final payment — ${formatC(outstanding)} outstanding`, link: "/Jobs", priority: "high" });
    steps.push({ text: "Generate job financial summary for records", link: "/DocGenerator", priority: "low" });
  }

  // Missing data issues
  if (!job.material_costs && ["contracted", "in_progress"].includes(job.status)) issues.push("No material costs entered — profit estimate may be incorrect");
  if (!job.labor_costs && ["contracted", "in_progress"].includes(job.status)) issues.push("No labor costs entered");
  if (!job.projected_completion) issues.push("No projected completion date set");
  if (!job.contract_amount) issues.push("No contract amount recorded");
  if (!job.scope) issues.push("No scope of work description");
  if (costs > revenue && revenue > 0) issues.push(`Job is over budget — costs exceed revenue by ${formatC(costs - revenue)}`);

  return { steps: steps.slice(0, 3), issues, profit, margin, outstanding };
}

function formatC(amount) {
  if (!amount) return "$0";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}