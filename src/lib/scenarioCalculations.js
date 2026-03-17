/**
 * Scenario Calculation Engine
 * Calculates financial projections based on scenario variables
 */

export function calculateScenarioProjection(variables, baselineData, jobs, bills, personalBills, currentUser) {
  // Extract variables
  const jobPriceChange = variables.job_price_change_percent || 0;
  const materialCostChange = variables.material_cost_change_percent || 0;
  const subcontractorPayoutChange = variables.subcontractor_payout_change_percent || 0;
  const jobsPerMonthChange = variables.jobs_per_month_change || 0;
  const ownerDrawChange = variables.owner_draw_change_percent || 0;
  const newMonthlyExpense = variables.new_monthly_expense || 0;
  const equipmentPurchase = variables.equipment_purchase || 0;
  const oneTimeExpense = variables.one_time_expense || 0;
  const taxReserveChange = variables.tax_reserve_percent_change || 0;
  const marketingSpend = variables.marketing_spend || 0;

  // Baseline numbers
  const baseRevenue = baselineData.total_revenue || 0;
  const baseCosts = baselineData.total_costs || 0;
  const baseProfit = baselineData.gross_profit || 0;
  const baseOwnerIncome = baselineData.owner_income || 0;
  const baseCashAvailable = baselineData.cash_available || 0;
  const baseJobsCount = baselineData.jobs_count || 0;

  // Calculate new revenue (based on job price change + job volume change)
  const jobsPerMonth = baseJobsCount > 0 ? baseJobsCount : 3;
  const avgJobRevenue = baseJobsCount > 0 ? baseRevenue / baseJobsCount : 5000;
  const newJobCount = jobsPerMonth + jobsPerMonthChange;
  const priceAdjustedJobRevenue = avgJobRevenue * (1 + jobPriceChange / 100);
  const projectedRevenue = newJobCount * priceAdjustedJobRevenue;

  // Calculate new costs
  const materialCostIncrease = baseCosts * (materialCostChange / 100);
  const newMonthlyTotal = newMonthlyExpense + marketingSpend;
  const subcontractorImpact = Math.max(0, projectedRevenue * 0.25 * (subcontractorPayoutChange / 100));
  const projectedCosts = (baseCosts * (1 + materialCostChange / 100)) + (newMonthlyTotal * 12) + subcontractorImpact;

  // Net profit before adjustments
  const projectedProfit = projectedRevenue - projectedCosts;

  // Tax reserve calculation
  const baseTaxReservePercent = 25 + taxReserveChange;
  const taxReserveAmount = Math.max(0, projectedProfit * (baseTaxReservePercent / 100));

  // Owner income
  const projectedOwnerIncome = baseOwnerIncome * (1 + ownerDrawChange / 100);

  // Cash flow impact
  const cashFlowImpact = projectedProfit - equipmentPurchase - oneTimeExpense;

  // Financial health score (0-100)
  const profitMargin = projectedRevenue > 0 ? (projectedProfit / projectedRevenue) * 100 : 0;
  const cashReserveScore = Math.min(50, (cashFlowImpact / Math.max(1, projectedRevenue / 12)) * 10);
  const ownerPayScore = Math.min(50, (projectedOwnerIncome / 5000) * 10);
  const financialHealthScore = Math.max(0, Math.min(100, profitMargin + cashReserveScore + ownerPayScore));

  // Personal cash flow
  const dailyExpenses = personalBills.reduce((s, b) => s + (b.amount || 0), 0);
  const personalCashFlow = (projectedOwnerIncome / 12) - (dailyExpenses / 12);
  const personalSavingsRate = projectedOwnerIncome > 0 ? (personalCashFlow / (projectedOwnerIncome / 12)) * 100 : 0;

  return {
    business_revenue: Math.round(projectedRevenue * 100) / 100,
    business_expenses: Math.round(projectedCosts * 100) / 100,
    business_profit: Math.round(projectedProfit * 100) / 100,
    cash_flow_impact: Math.round(cashFlowImpact * 100) / 100,
    tax_reserve_amount: Math.round(taxReserveAmount * 100) / 100,
    owner_income: Math.round(projectedOwnerIncome * 100) / 100,
    personal_cash_flow: Math.round(personalCashFlow * 100) / 100,
    personal_savings_rate: Math.round(personalSavingsRate * 100) / 100,
    financial_health_score: Math.round(financialHealthScore),
    profit_margin_percent: Math.round(profitMargin * 10) / 10,
    jobs_per_month: newJobCount,
    avg_job_value: Math.round(priceAdjustedJobRevenue * 100) / 100,
  };
}

export function getBaselineFromData(jobs, bills, personalBills, bankAccounts) {
  const totalRevenue = jobs.reduce((s, j) => s + (j.contract_amount || 0) + (j.change_orders_total || 0), 0);
  const totalCosts = jobs.reduce((s, j) => s + (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0), 0);
  const cashCollected = jobs.reduce((s, j) => s + (j.deposits_received || 0), 0);
  const personalExpenses = personalBills.reduce((s, b) => s + (b.amount || 0), 0);

  return {
    total_revenue: totalRevenue,
    total_costs: totalCosts,
    gross_profit: totalRevenue - totalCosts,
    owner_income: (totalRevenue - totalCosts) * 0.30,
    cash_available: cashCollected,
    jobs_count: jobs.filter(j => j.status !== "cancelled").length,
    business_expenses: totalCosts,
    personal_expenses: personalExpenses,
  };
}

export function generateMonthlyProjection(variables, baselineData, months = 12) {
  const data = calculateScenarioProjection(variables, baselineData);
  const monthlyRevenue = data.business_revenue / months;
  const monthlyExpenses = data.business_expenses / months;
  const monthlyProfit = data.business_profit / months;

  const months_array = [];
  for (let i = 0; i < months; i++) {
    const cumulativeProfit = monthlyProfit * (i + 1);
    months_array.push({
      month: i + 1,
      revenue: Math.round(monthlyRevenue * 100) / 100,
      expenses: Math.round(monthlyExpenses * 100) / 100,
      profit: Math.round(monthlyProfit * 100) / 100,
      cumulative_profit: Math.round(cumulativeProfit * 100) / 100,
      cash_flow: Math.round((data.cash_flow_impact / months) * 100) / 100,
    });
  }

  return months_array;
}

export function compareScenarios(scenario1, scenario2) {
  const r1 = scenario1.projection_results;
  const r2 = scenario2.projection_results;

  return {
    profit_difference: Math.round((r2.business_profit - r1.business_profit) * 100) / 100,
    revenue_difference: Math.round((r2.business_revenue - r1.business_revenue) * 100) / 100,
    expense_difference: Math.round((r2.business_expenses - r1.business_expenses) * 100) / 100,
    cash_flow_difference: Math.round((r2.cash_flow_impact - r1.cash_flow_impact) * 100) / 100,
    owner_income_difference: Math.round((r2.owner_income - r1.owner_income) * 100) / 100,
    tax_reserve_difference: Math.round((r2.tax_reserve_amount - r1.tax_reserve_amount) * 100) / 100,
    health_score_difference: r2.financial_health_score - r1.financial_health_score,
    scenario1_wins: r2.business_profit < r1.business_profit,
  };
}

export function generateInsights(variables, results, baseline) {
  const insights = [];

  // Price increase insights
  if (variables.job_price_change_percent > 0) {
    const profitIncrease = results.business_profit - baseline.gross_profit;
    insights.push({
      type: "positive",
      message: `Raising prices by ${variables.job_price_change_percent}% could increase annual profit by ${Math.round(profitIncrease)}`,
    });
  }

  // Expense insights
  if (variables.new_monthly_expense > 0) {
    const yearlyImpact = variables.new_monthly_expense * 12;
    insights.push({
      type: "warning",
      message: `Adding ${variables.new_monthly_expense} in monthly expenses will reduce profit by ${Math.round(yearlyImpact)} annually.`,
    });
  }

  // Equipment purchase insights
  if (variables.equipment_purchase > 0) {
    const months = results.business_profit > 0 ? Math.ceil(variables.equipment_purchase / (results.business_profit / 12)) : 0;
    if (results.cash_flow_impact < variables.equipment_purchase) {
      insights.push({
        type: "warning",
        message: `Equipment purchase will significantly impact cash reserves. Payback period: ${months} months.`,
      });
    } else {
      insights.push({
        type: "info",
        message: `Equipment can be paid off in approximately ${months} months based on projected profit.`,
      });
    }
  }

  // Owner draw insights
  if (variables.owner_draw_change_percent > 0) {
    insights.push({
      type: "warning",
      message: `Increasing owner draws by ${variables.owner_draw_change_percent}% reduces business reserves and reinvestment capacity.`,
    });
  } else if (variables.owner_draw_change_percent < 0) {
    insights.push({
      type: "positive",
      message: `Reducing owner withdrawals improves reserve stability and business reinvestment capacity.`,
    });
  }

  // Tax reserve insights
  if (results.financial_health_score < 50) {
    insights.push({
      type: "warning",
      message: `Financial health score is below 50. Consider reducing discretionary spending or increasing revenue.`,
    });
  }

  // Cash reserve insights
  if (results.cash_flow_impact < 5000) {
    insights.push({
      type: "warning",
      message: `Projected monthly cash flow is low. This may limit reinvestment and growth capacity.`,
    });
  }

  return insights;
}