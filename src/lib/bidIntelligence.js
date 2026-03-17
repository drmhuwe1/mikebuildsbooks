/**
 * AI Bid Intelligence Engine
 * Analyzes historical job data to provide smart bidding recommendations
 */

export function calculateBidIntelligence(currentBid, allJobs, allMaterials, allBids) {
  const insights = [];
  const warnings = [];
  const suggestions = {};
  let riskScore = 50;

  // Get similar past jobs based on scope/description
  const similarJobs = findSimilarJobs(currentBid, allJobs);
  const jobStats = calculateJobStats(similarJobs);

  if (similarJobs.length === 0) {
    insights.push({
      type: "info",
      message: "No similar past jobs found. Continue with your estimates.",
    });
    return { insights, warnings, suggestions, riskScore, similarJobs: [] };
  }

  // 1. PROFIT MARGIN ANALYSIS
  if (jobStats.avgGrossMargin > 0) {
    const suggestedBidRange = {
      conservative: jobStats.avgCost * (1 + jobStats.avgGrossMargin * 0.8),
      recommended: jobStats.avgCost * (1 + jobStats.avgGrossMargin),
      aggressive: jobStats.avgCost * (1 + jobStats.avgGrossMargin * 1.2),
    };

    if (currentBid.bid_amount && currentBid.bid_amount < suggestedBidRange.conservative) {
      warnings.push({
        type: "high",
        message: `This bid is ${((suggestedBidRange.recommended - currentBid.bid_amount) / suggestedBidRange.recommended * 100).toFixed(0)}% lower than similar completed jobs. Consider increasing.`,
      });
      riskScore += 15;
    }

    insights.push({
      type: "data",
      message: `Similar jobs averaged ${(jobStats.avgGrossMargin * 100).toFixed(1)}% gross profit margin.`,
      value: `${(jobStats.avgGrossMargin * 100).toFixed(1)}%`,
    });

    suggestions.bidRange = {
      conservative: suggestedBidRange.conservative,
      recommended: suggestedBidRange.recommended,
      aggressive: suggestedBidRange.aggressive,
    };
  }

  // 2. MATERIAL COST ANALYSIS
  if (jobStats.avgMaterialCost > 0 && currentBid.material_cost) {
    const materialDifference = ((currentBid.material_cost - jobStats.avgMaterialCost) / jobStats.avgMaterialCost) * 100;
    if (materialDifference < -15) {
      warnings.push({
        type: "medium",
        message: `Materials are ${Math.abs(materialDifference).toFixed(0)}% below average for this type of work. May be incomplete.`,
      });
      riskScore += 10;
      suggestions.materialCost = jobStats.avgMaterialCost;
    } else if (materialDifference > -5) {
      insights.push({
        type: "good",
        message: `Material estimate is realistic compared to similar jobs.`,
      });
    }
  }

  // 3. LABOR ANALYSIS
  if (jobStats.avgLaborCost > 0 && currentBid.labor_hours && currentBid.labor_rate) {
    const currentLaborCost = currentBid.labor_hours * currentBid.labor_rate;
    const laborDifference = ((currentLaborCost - jobStats.avgLaborCost) / jobStats.avgLaborCost) * 100;
    if (laborDifference < -20) {
      warnings.push({
        type: "high",
        message: `Labor estimate is ${Math.abs(laborDifference).toFixed(0)}% below comparable jobs. May underestimate hours.`,
      });
      riskScore += 12;
      suggestions.laborCost = jobStats.avgLaborCost;
    }
  }

  // 4. CONTINGENCY ANALYSIS
  if (currentBid.contingency_percent < jobStats.avgContingency) {
    warnings.push({
      type: "medium",
      message: `Contingency is ${jobStats.avgContingency.toFixed(1)}% for similar work. Consider increasing from ${currentBid.contingency_percent}%.`,
    });
    riskScore += 8;
    suggestions.contingency = jobStats.avgContingency;
  } else {
    insights.push({
      type: "good",
      message: `Contingency at ${currentBid.contingency_percent}% is appropriate for this work type.`,
    });
  }

  // 5. MISSING LINE ITEMS
  if (!currentBid.subcontractor_cost && jobStats.avgSubcontractorCost > 0) {
    warnings.push({
      type: "medium",
      message: `Similar jobs typically included subcontractor work (avg: $${jobStats.avgSubcontractorCost.toFixed(0)}). Verify if needed.`,
    });
    riskScore += 8;
  }

  // 6. TIMELINE RISK
  if (jobStats.avgTimeline && jobStats.timelineVariance > 20) {
    warnings.push({
      type: "low",
      message: `Similar projects showed variable timelines (avg: ${jobStats.avgTimeline} days). Factor in schedule risk.`,
    });
  }

  // 7. JOB COMPLEXITY
  if (similarJobs.some(j => j.status === "completed" && j.overhead_costs > j.contract_amount * 0.15)) {
    warnings.push({
      type: "low",
      message: `Projects like this historically have higher overhead costs. Budget accordingly.`,
    });
    riskScore += 5;
  }

  // Cap risk score
  riskScore = Math.min(95, Math.max(10, riskScore));

  return {
    insights,
    warnings,
    suggestions,
    riskScore,
    similarJobs: similarJobs.slice(0, 5),
    jobStats,
  };
}

export function findSimilarJobs(currentBid, allJobs) {
  // Match on scope/description similarity and job complexity
  const keywords = (currentBid.scope_summary || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3);

  return allJobs
    .filter(j => j.status === "completed" && j.contract_amount > 0)
    .map(job => {
      const jobKeywords = (job.scope || "")
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3);
      const matches = keywords.filter(k => jobKeywords.includes(k)).length;
      const similarity = keywords.length > 0 ? matches / keywords.length : 0;
      return { job, similarity };
    })
    .filter(({ similarity }) => similarity > 0.2 || allJobs.length < 5)
    .sort((a, b) => b.similarity - a.similarity)
    .map(({ job }) => job)
    .slice(0, 10);
}

export function calculateJobStats(jobs) {
  if (jobs.length === 0) {
    return {
      avgCost: 0,
      avgGrossMargin: 0.2,
      avgMaterialCost: 0,
      avgLaborCost: 0,
      avgSubcontractorCost: 0,
      avgContingency: 8,
      avgTimeline: 0,
      timelineVariance: 0,
    };
  }

  const costs = jobs.map(j => {
    const revenue = (j.contract_amount || 0) + (j.change_orders_total || 0);
    const cost = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.overhead_costs || 0);
    const profit = revenue - cost;
    return { revenue, cost, profit };
  });

  const avgRevenue = costs.reduce((s, c) => s + c.revenue, 0) / costs.length;
  const avgCost = costs.reduce((s, c) => s + c.cost, 0) / costs.length;
  const avgProfit = costs.reduce((s, c) => s + c.profit, 0) / costs.length;

  const avgMaterial = jobs.reduce((s, j) => s + (j.material_costs || 0), 0) / jobs.length;
  const avgLabor = jobs.reduce((s, j) => s + (j.labor_costs || 0), 0) / jobs.length;
  const avgSub = jobs.reduce((s, j) => s + (j.subcontractor_costs || 0), 0) / jobs.length;

  const timelines = jobs
    .filter(j => j.start_date && j.actual_completion)
    .map(j => {
      const start = new Date(j.start_date);
      const end = new Date(j.actual_completion);
      return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    });

  return {
    avgCost,
    avgRevenue,
    avgGrossMargin: avgRevenue > 0 ? avgProfit / avgRevenue : 0.2,
    avgMaterialCost: avgMaterial,
    avgLaborCost: avgLabor,
    avgSubcontractorCost: avgSub,
    avgContingency: 8,
    avgTimeline: timelines.length > 0 ? Math.round(timelines.reduce((s, t) => s + t, 0) / timelines.length) : 0,
    timelineVariance: timelines.length > 0 ? Math.max(...timelines) - Math.min(...timelines) : 0,
    jobCount: jobs.length,
  };
}

export function getRiskLevel(riskScore) {
  if (riskScore < 35) return { label: "Low Risk", color: "text-green-600", bg: "bg-green-50" };
  if (riskScore < 60) return { label: "Moderate Risk", color: "text-yellow-600", bg: "bg-yellow-50" };
  return { label: "High Risk", color: "text-red-600", bg: "bg-red-50" };
}

export function generateBidAssistantPrompt(intelligence) {
  const prompts = [];

  if (intelligence.riskScore > 70) {
    prompts.push("⚠️ This bid has higher risk indicators. Review before sending to client.");
  }

  if (intelligence.warnings.length > 2) {
    prompts.push(`🔍 ${intelligence.warnings.length} warnings detected. Review them carefully.`);
  }

  const highWarnings = intelligence.warnings.filter(w => w.type === "high");
  if (highWarnings.length > 0) {
    prompts.push(`⚠️ ${highWarnings[0].message}`);
  }

  if (intelligence.jobStats.jobCount > 0) {
    prompts.push(`📊 Based on ${intelligence.jobStats.jobCount} similar completed jobs.`);
  }

  return prompts;
}