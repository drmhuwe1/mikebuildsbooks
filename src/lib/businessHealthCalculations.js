/**
 * Business Health Score Calculation
 * Calculates overall business health based on multiple factors
 */

export function calculateBusinessHealthScore(jobs, bills, personalBills, bankAccounts, settings) {
  // Start at 0, only award points for actual activity
  let score = 0;
  
  // Check if there's any data at all
  const hasData = jobs.length > 0 || bills.length > 0 || personalBills.length > 0 || bankAccounts.length > 0;
  
  // If no data, return 0 (user hasn't set anything up yet)
  if (!hasData) return 0;

  // 1. Profitability (0-20 points)
  const totalRevenue = jobs.reduce((s, j) => s + (j.contract_amount || 0) + (j.change_orders_total || 0), 0);
  const totalCosts = jobs.reduce((s, j) => s + (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.overhead_costs || 0), 0);
  const profit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  if (profitMargin >= 25) score += 20;
  else if (profitMargin >= 15) score += 15;
  else if (profitMargin >= 5) score += 10;
  else if (profitMargin > 0) score += 5;

  // 2. Cash Flow Stability (0-15 points)
  const cashAvailable = bankAccounts.reduce((s, a) => s + (a.current_balance || 0), 0);
  const monthlyBills = bills.reduce((s, b) => s + (b.amount || 0), 0);
  const monthlyPersonal = personalBills.reduce((s, b) => s + (b.amount || 0), 0);
  const totalMonthlyNeeds = monthlyBills + monthlyPersonal;
  const cashCoverMonths = totalMonthlyNeeds > 0 ? cashAvailable / totalMonthlyNeeds : 0;
  if (cashCoverMonths >= 6) score += 15;
  else if (cashCoverMonths >= 3) score += 10;
  else if (cashCoverMonths >= 1) score += 5;

  // 3. Reserve Levels (0-15 points)
  const targetReserve = profit * 0.25;
  const actualReserve = cashAvailable - (totalMonthlyNeeds * 1);
  const reservePercent = targetReserve > 0 ? (actualReserve / targetReserve) * 100 : 0;
  if (reservePercent >= 100) score += 15;
  else if (reservePercent >= 75) score += 12;
  else if (reservePercent >= 50) score += 8;
  else if (reservePercent >= 25) score += 4;

  // 4. Overdue Invoices (0-15 points penalty)
  const today = new Date().toISOString().split("T")[0];
  const overdueJobs = jobs.filter(j => j.status !== "completed" && j.contract_amount > j.deposits_received);
  if (overdueJobs.length === 0) score += 15;
  else if (overdueJobs.length <= 2) score += 10;
  else if (overdueJobs.length <= 4) score += 5;

  // 5. Job Pipeline Strength (0-15 points)
  const activeJobs = jobs.filter(j => ["bidding", "contracted", "in_progress"].includes(j.status)).length;
  if (activeJobs >= 5) score += 15;
  else if (activeJobs >= 3) score += 10;
  else if (activeJobs >= 1) score += 5;

  // 6. Expense Trends (0-10 points)
  const avgCosts = totalCosts > 0 ? totalCosts / Math.max(1, jobs.length) : 0;
  const costControl = avgCosts < 20000 ? 10 : avgCosts < 30000 ? 5 : 0;
  score += costControl;

  return Math.max(0, Math.min(100, score));
}

export function getBusinessHealthStatus(score) {
  if (score >= 80) return { label: "Excellent", color: "text-green-600", bg: "bg-green-50" };
  if (score >= 60) return { label: "Good", color: "text-blue-600", bg: "bg-blue-50" };
  if (score >= 40) return { label: "Fair", color: "text-yellow-600", bg: "bg-yellow-50" };
  return { label: "Needs Attention", color: "text-red-600", bg: "bg-red-50" };
}

export function generateOperationalInsights(jobs, bills, personalBills, bankAccounts, subcontractors, payments, contracts = []) {
   const insights = [];
   const today = new Date().toISOString().split("T")[0];

   // Contracts awaiting job creation (signed/active contracts without a job)
   const contractsAwaitingJob = contracts.filter(c => !c.job_id && (c.status === "signed" || c.status === "active") && c.signed_and_accepted).length;
   if (contractsAwaitingJob > 0) insights.push({ type: "action", message: `You have ${contractsAwaitingJob} contract${contractsAwaitingJob !== 1 ? "s" : ""} awaiting job creation.` });

  // Overdue invoices
  const unpaid = jobs.filter(j => j.status !== "completed" && j.contract_amount > j.deposits_received);
  if (unpaid.length > 0) insights.push({ type: "warning", message: `${unpaid.length} invoice${unpaid.length !== 1 ? "s" : ""} awaiting payment.` });

  // Cash reserves
  const cashAvailable = bankAccounts.reduce((s, a) => s + (a.current_balance || 0), 0);
  const monthlyNeeds = (bills.reduce((s, b) => s + (b.amount || 0), 0) + personalBills.reduce((s, b) => s + (b.amount || 0), 0)) / 12;
  const monthsCovered = monthlyNeeds > 0 ? cashAvailable / monthlyNeeds : 0;
  if (monthsCovered < 2) insights.push({ type: "warning", message: `Cash reserves below safety threshold (${Math.round(monthsCovered)} months).` });

  // Upcoming bills
  const upcomingBills = bills.filter(b => b.due_date && b.due_date <= new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split("T")[0] && b.status !== "paid");
  if (upcomingBills.length > 0) insights.push({ type: "info", message: `${upcomingBills.length} bill${upcomingBills.length !== 1 ? "s" : ""} due in the next week.` });

  // Subcontractor payouts pending
  const pendingPayments = payments.filter(p => p.status === "pending").length;
  if (pendingPayments > 0) insights.push({ type: "info", message: `${pendingPayments} subcontractor payout${pendingPayments !== 1 ? "s" : ""} pending.` });

  // Active jobs
  const activeJobs = jobs.filter(j => j.status === "in_progress").length;
  if (activeJobs > 0) insights.push({ type: "success", message: `${activeJobs} job${activeJobs !== 1 ? "s" : ""} currently in progress.` });

  return insights;
}