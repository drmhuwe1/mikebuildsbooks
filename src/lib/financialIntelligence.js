/**
 * Financial Intelligence Engine
 * Analyzes business financial data for anomalies, risks, and predictions
 */

export function analyzeFinancialData(jobs, materials, subcontractorPayments, bills, bankTransactions, settings) {
  const alerts = [];
  const jobRisks = {};
  
  // Analyze each job for anomalies and risks
  jobs.forEach(job => {
    const jobAnalysis = analyzeJobFinancials(job, jobs, materials, subcontractorPayments);
    jobRisks[job.id] = jobAnalysis;
    alerts.push(...jobAnalysis.alerts);
  });
  
  // Detect duplicate expenses
  const duplicateAlerts = detectDuplicateExpenses(materials, subcontractorPayments, bankTransactions);
  alerts.push(...duplicateAlerts);
  
  // Detect spending patterns
  const patternAlerts = detectAnomalousPatterns(jobs, materials, subcontractorPayments);
  alerts.push(...patternAlerts);
  
  return { alerts, jobRisks };
}

export function analyzeJobFinancials(job, allJobs, allMaterials, allSubPayments) {
  const alerts = [];
  const completedJobs = allJobs.filter(j => j.status === 'completed' && j.id !== job.id);
  
  // Calculate current job costs
  const totalCosts = (job.material_costs || 0) + (job.labor_costs || 0) + 
                    (job.subcontractor_costs || 0) + (job.permit_costs || 0) + 
                    (job.equipment_costs || 0) + (job.overhead_costs || 0);
  
  const revenue = (job.contract_amount || 0) + (job.change_orders_total || 0);
  const currentProfit = revenue - totalCosts;
  const currentMargin = revenue > 0 ? ((currentProfit / revenue) * 100).toFixed(1) : 0;
  
  // Analyze materials
  const jobMaterials = allMaterials.filter(m => m.job_id === job.id);
  const materialTotal = jobMaterials.reduce((sum, m) => sum + (m.cost || 0), 0);
  
  // Find similar jobs (by scope keywords or size)
  const similarJobs = findSimilarJobs(job, completedJobs);
  
  // Check for unusually high material costs
  if (similarJobs.length > 0) {
    const avgMaterialCost = similarJobs.reduce((sum, j) => sum + (j.material_costs || 0), 0) / similarJobs.length;
    const materialVariance = ((job.material_costs - avgMaterialCost) / avgMaterialCost * 100).toFixed(1);
    
    if (materialVariance > 30) {
      alerts.push({
        id: `${job.id}-high-materials`,
        type: 'high_costs',
        severity: 'warning',
        title: 'Unusually High Material Costs',
        message: `Material costs are ${materialVariance}% higher than similar projects`,
        jobId: job.id,
        jobTitle: job.title,
        value: job.material_costs,
        comparison: avgMaterialCost,
        recommendation: 'Review material pricing and waste. Consider renegotiating with suppliers.',
        timestamp: new Date().toISOString(),
      });
    }
  }
  
  // Check for unusually low labor estimates
  if (similarJobs.length > 0 && (job.labor_costs > 0 || !job.labor_costs)) {
    const avgLaborCost = similarJobs.reduce((sum, j) => sum + (j.labor_costs || 0), 0) / similarJobs.length;
    const laborVariance = ((job.labor_costs - avgLaborCost) / avgLaborCost * 100).toFixed(1);
    
    if (laborVariance < -30 && job.status !== 'completed') {
      alerts.push({
        id: `${job.id}-low-labor`,
        type: 'low_costs',
        severity: 'warning',
        title: 'Unusually Low Labor Estimate',
        message: `Labor costs are ${Math.abs(laborVariance)}% below similar projects`,
        jobId: job.id,
        jobTitle: job.title,
        value: job.labor_costs,
        comparison: avgLaborCost,
        recommendation: 'Verify labor hours and rates. Budget may be underestimated.',
        timestamp: new Date().toISOString(),
      });
    }
  }
  
  // Check for low profit margin
  if (currentMargin < 15 && revenue > 0) {
    alerts.push({
      id: `${job.id}-low-margin`,
      type: 'budget_overrun',
      severity: job.status === 'completed' ? 'info' : 'warning',
      title: 'Low Profit Margin',
      message: `Current profit margin is ${currentMargin}% (target: 20%)`,
      jobId: job.id,
      jobTitle: job.title,
      currentMargin,
      targetMargin: 20,
      recommendation: 'Review all costs and consider change orders if scope expanded.',
      timestamp: new Date().toISOString(),
    });
  }
  
  // Check for missing cost categories
  const missingCategories = [];
  if (!job.labor_costs || job.labor_costs === 0) missingCategories.push('labor');
  if (!job.material_costs || job.material_costs === 0) missingCategories.push('materials');
  if (!job.overhead_costs || job.overhead_costs === 0) missingCategories.push('overhead');
  
  if (missingCategories.length > 0 && job.status !== 'completed') {
    alerts.push({
      id: `${job.id}-missing-costs`,
      type: 'low_costs',
      severity: 'info',
      title: 'Missing Cost Estimates',
      message: `No estimates for: ${missingCategories.join(', ')}`,
      jobId: job.id,
      jobTitle: job.title,
      missingCategories,
      recommendation: 'Complete all cost estimates before finalizing the bid.',
      timestamp: new Date().toISOString(),
    });
  }
  
  return {
    alerts,
    riskLevel: calculateJobRiskLevel(job, alerts, similarJobs),
    profitPrediction: predictJobProfit(job, similarJobs),
    similarJobs: similarJobs.slice(0, 3),
  };
}

export function detectDuplicateExpenses(materials, subPayments, transactions) {
  const alerts = [];
  const seenMaterials = new Map();
  
  // Check for duplicate material entries
  materials.forEach(m => {
    const key = `${m.job_id}-${m.supplier}-${m.cost}`.toLowerCase();
    if (seenMaterials.has(key)) {
      const previous = seenMaterials.get(key);
      if (Math.abs(new Date(m.purchase_date) - new Date(previous.purchase_date)) < 86400000) { // Within 24 hours
        alerts.push({
          id: `dup-material-${m.id}`,
          type: 'duplicate',
          severity: 'error',
          title: 'Possible Duplicate Material Entry',
          message: `Similar material entry found for ${m.supplier}`,
          firstId: previous.id,
          secondId: m.id,
          amount: m.cost,
          recommendation: 'Review both entries and delete the duplicate if confirmed.',
          timestamp: new Date().toISOString(),
        });
      }
    }
    seenMaterials.set(key, m);
  });
  
  return alerts;
}

export function detectAnomalousPatterns(jobs, materials, subPayments) {
  const alerts = [];
  
  // Analyze spending velocity
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  
  const recentMaterials = materials.filter(m => new Date(m.purchase_date) > last30Days);
  const totalRecentSpend = recentMaterials.reduce((sum, m) => sum + m.cost, 0);
  
  // Calculate average monthly spend
  const allMaterials = materials || [];
  const avgMonthlySpend = allMaterials.reduce((sum, m) => sum + m.cost, 0) / Math.max(1, Math.ceil(allMaterials.length / 30));
  
  if (totalRecentSpend > avgMonthlySpend * 2) {
    alerts.push({
      id: 'spend-spike',
      type: 'suspicious_pattern',
      severity: 'warning',
      title: 'Unusual Spending Spike',
      message: `Material spending in last 30 days is ${((totalRecentSpend / avgMonthlySpend) * 100).toFixed(0)}% above average`,
      totalRecent: totalRecentSpend,
      avgMonthly: avgMonthlySpend,
      recommendation: 'Review recent material purchases for unexpected projects or waste.',
      timestamp: new Date().toISOString(),
    });
  }
  
  return alerts;
}

function findSimilarJobs(job, completedJobs) {
  // Match by scope keywords or relative project size
  const jobWords = (job.scope || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  return completedJobs
    .filter(j => {
      const scopeWords = (j.scope || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const matchCount = jobWords.filter(w => scopeWords.includes(w)).length;
      const sizeMatch = Math.abs((j.contract_amount || 0) - (job.contract_amount || 0)) / Math.max(1, (job.contract_amount || 0)) < 0.5;
      return matchCount > 0 || sizeMatch;
    })
    .sort((a, b) => (b.contract_amount || 0) - (a.contract_amount || 0))
    .slice(0, 5);
}

function calculateJobRiskLevel(job, alerts, similarJobs) {
  let riskScore = 0;
  
  // Missing costs
  const costGaps = [job.labor_costs, job.material_costs, job.overhead_costs].filter(c => !c || c === 0).length;
  riskScore += costGaps * 15;
  
  // Alert severity
  alerts.forEach(a => {
    if (a.jobId === job.id) {
      riskScore += a.severity === 'error' ? 30 : a.severity === 'warning' ? 15 : 5;
    }
  });
  
  // Low profit margin
  const revenue = (job.contract_amount || 0) + (job.change_orders_total || 0);
  const totalCosts = (job.material_costs || 0) + (job.labor_costs || 0) + (job.subcontractor_costs || 0);
  if (revenue > 0) {
    const margin = ((revenue - totalCosts) / revenue) * 100;
    if (margin < 10) riskScore += 25;
    else if (margin < 15) riskScore += 15;
  }
  
  // Tight timeline
  if (job.projected_completion && job.start_date) {
    const timeline = new Date(job.projected_completion) - new Date(job.start_date);
    if (timeline < 7 * 24 * 60 * 60 * 1000) riskScore += 10; // Less than week
  }
  
  const level = riskScore > 60 ? 'high' : riskScore > 30 ? 'moderate' : 'low';
  
  return { level, score: Math.min(100, riskScore), explanation: getRiskExplanation(level, riskScore) };
}

function getRiskExplanation(level, score) {
  if (level === 'high') {
    return 'Multiple risk factors detected. Review costs, timeline, and profit margin carefully.';
  } else if (level === 'moderate') {
    return 'Some concerns noted. Verify cost estimates and monitor closely during execution.';
  } else {
    return 'Solid financial foundation. Monitor as project progresses.';
  }
}

export function predictJobProfit(job, similarJobs) {
  const revenue = (job.contract_amount || 0) + (job.change_orders_total || 0);
  const currentCosts = (job.material_costs || 0) + (job.labor_costs || 0) + (job.subcontractor_costs || 0) + (job.overhead_costs || 0);
  const currentProfit = revenue - currentCosts;
  
  let prediction = {
    projectedRevenue: revenue,
    projectedCost: currentCosts,
    projectedProfit: currentProfit,
    projectedMargin: revenue > 0 ? ((currentProfit / revenue) * 100).toFixed(1) : 0,
    confidence: 'moderate',
    insights: [],
  };
  
  if (similarJobs.length === 0) {
    prediction.insights.push('Insufficient similar job history for comparison.');
    prediction.confidence = 'low';
  } else {
    const avgMargin = similarJobs.reduce((sum, j) => {
      const rev = (j.contract_amount || 0) + (j.change_orders_total || 0);
      const costs = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0);
      return rev > 0 ? sum + ((rev - costs) / rev * 100) : sum;
    }, 0) / similarJobs.length;
    
    const avgMaterials = similarJobs.reduce((sum, j) => sum + (j.material_costs || 0), 0) / similarJobs.length;
    const avgLabor = similarJobs.reduce((sum, j) => sum + (j.labor_costs || 0), 0) / similarJobs.length;
    
    if (job.material_costs < avgMaterials * 0.7) {
      prediction.insights.push(`Material costs may be underestimated (similar jobs avg: $${avgMaterials.toFixed(0)})`);
    }
    
    if (job.labor_costs < avgLabor * 0.7) {
      prediction.insights.push(`Labor costs may be underestimated (similar jobs avg: $${avgLabor.toFixed(0)})`);
    }
    
    if (prediction.projectedMargin < avgMargin - 5) {
      prediction.insights.push(`Expected margin is below historical average of ${avgMargin.toFixed(1)}%`);
    } else if (prediction.projectedMargin > avgMargin + 5) {
      prediction.insights.push(`Projected margin appears strong vs historical average of ${avgMargin.toFixed(1)}%`);
    }
    
    prediction.confidence = 'high';
  }
  
  return prediction;
}

export function getFinancialHealthScore(jobs, materials, subPayments) {
  let healthScore = 100;
  
  // Completed jobs profitability
  const completedJobs = jobs.filter(j => j.status === 'completed');
  if (completedJobs.length > 0) {
    const avgMargin = completedJobs.reduce((sum, j) => {
      const rev = (j.contract_amount || 0) + (j.change_orders_total || 0);
      const costs = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0);
      return rev > 0 ? sum + ((rev - costs) / rev * 100) : sum;
    }, 0) / completedJobs.length;
    
    if (avgMargin < 15) healthScore -= 20;
    else if (avgMargin < 20) healthScore -= 10;
  }
  
  // Active job risk
  const activeJobs = jobs.filter(j => j.status === 'in_progress' || j.status === 'contracted');
  const highRiskActive = activeJobs.filter(j => {
    const rev = (j.contract_amount || 0);
    const costs = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0);
    const margin = rev > 0 ? ((rev - costs) / rev * 100) : 0;
    return margin < 10;
  }).length;
  
  if (highRiskActive > 0) healthScore -= Math.min(30, highRiskActive * 15);
  
  return Math.max(0, healthScore);
}