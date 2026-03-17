/**
 * Project Timeline Prediction & Schedule Risk Monitoring
 * Analyzes historical job data to predict realistic timelines and detect scheduling risks
 */

export function analyzeTimelineRisk(job, allJobs = []) {
  if (!job) return { riskLevel: "low", score: 0, factors: [], confidence: 0 };

  let score = 0;
  const factors = [];
  const revenue = (job.contract_amount || 0) + (job.change_orders_total || 0);
  const projectComplexity = estimateComplexity(job);

  // Factor 1: Timeline aggressiveness
  if (job.start_date && job.projected_completion) {
    const days = Math.ceil(
      (new Date(job.projected_completion) - new Date(job.start_date)) / (1000 * 60 * 60 * 24)
    );
    
    const similarJobs = getSimilarCompletedJobs(job, allJobs);
    if (similarJobs.length > 0) {
      const avgDays = similarJobs.reduce((sum, j) => {
        if (!j.start_date || !j.actual_completion) return sum;
        return sum + Math.ceil((new Date(j.actual_completion) - new Date(j.start_date)) / (1000 * 60 * 60 * 24));
      }, 0) / similarJobs.length;

      if (days < avgDays * 0.75) {
        score += 35;
        factors.push(`Timeline is 25% shorter than similar projects (${days} vs ${avgDays.toFixed(0)} days)`);
      } else if (days < avgDays * 0.9) {
        score += 15;
        factors.push(`Timeline is slightly aggressive (${days} vs ${avgDays.toFixed(0)} days)`);
      }
    }
  }

  // Factor 2: Missing subcontractor scheduling
  if (!job.subcontractor_costs || job.subcontractor_costs === 0) {
    if (projectComplexity >= 3) {
      score += 20;
      factors.push("Complex project but no subcontractors scheduled");
    }
  }

  // Factor 3: Project complexity & scope
  if (projectComplexity >= 4) {
    score += 20;
    factors.push("High project complexity — may require additional coordination");
  }

  // Factor 4: Labor allocation
  const laborHours = estimateLaborHours(job);
  if (laborHours > 0) {
    const expectedHours = estimateExpectedLaborHours(job);
    if (laborHours < expectedHours * 0.7) {
      score += 25;
      factors.push(`Labor hours are 30%+ below estimated (${laborHours.toFixed(0)} vs ${expectedHours.toFixed(0)})`);
    }
  }

  // Factor 5: Material preparation
  if (!job.material_costs || job.material_costs === 0) {
    score += 15;
    factors.push("Materials not planned — may delay start");
  }

  // Factor 6: Historical delays
  const similarJobs = getSimilarCompletedJobs(job, allJobs);
  if (similarJobs.length > 0) {
    const delayedCount = similarJobs.filter(j => {
      if (!j.projected_completion || !j.actual_completion) return false;
      const projected = new Date(j.projected_completion);
      const actual = new Date(j.actual_completion);
      return actual > projected;
    }).length;

    if (delayedCount / similarJobs.length > 0.5) {
      score += 15;
      factors.push(`${Math.round((delayedCount / similarJobs.length) * 100)}% of similar projects experienced delays`);
    }
  }

  const riskLevel = score > 60 ? "high" : score > 30 ? "moderate" : "low";
  const confidence = Math.min(95, 60 + similarJobs.length * 5);

  return { riskLevel, score: Math.min(100, score), factors, confidence, similarJobsCount: similarJobs.length };
}

export function predictProjectTimeline(job, allJobs = []) {
  if (!job) return null;

  const similarJobs = getSimilarCompletedJobs(job, allJobs);
  const jobComplexity = estimateComplexity(job);
  let estimatedDays = 14; // base estimate

  if (similarJobs.length > 0) {
    const completedDays = similarJobs
      .filter(j => j.actual_completion)
      .map(j => {
        if (!j.start_date || !j.actual_completion) return null;
        return Math.ceil((new Date(j.actual_completion) - new Date(j.start_date)) / (1000 * 60 * 60 * 24));
      })
      .filter(Boolean);

    if (completedDays.length > 0) {
      estimatedDays = completedDays.reduce((a, b) => a + b) / completedDays.length;
    }
  }

  // Adjust based on project complexity
  estimatedDays = estimatedDays * (0.8 + jobComplexity * 0.1);

  // Adjust based on labor
  const laborHours = estimateLaborHours(job);
  if (laborHours > 0) {
    const estimatedHoursPerDay = 8;
    const laborDays = laborHours / estimatedHoursPerDay;
    estimatedDays = Math.max(estimatedDays, laborDays);
  }

  const startDate = job.start_date ? new Date(job.start_date) : new Date();
  const completionDate = new Date(startDate.getTime() + estimatedDays * 24 * 60 * 60 * 1000);

  const phases = generateProjectPhases(job, estimatedDays);
  const confidence = similarJobs.length > 3 ? 85 : similarJobs.length > 0 ? 70 : 50;

  return {
    estimatedStartDate: job.start_date || startDate.toISOString().split("T")[0],
    estimatedCompletionDate: completionDate.toISOString().split("T")[0],
    estimatedTotalDays: Math.ceil(estimatedDays),
    estimatedWorkingDays: Math.ceil(estimatedDays * 0.7),
    estimatedLaborHours: laborHours,
    phases,
    confidence,
    insights: generateTimelineInsights(job, similarJobs, estimatedDays, laborHours),
  };
}

export function monitorScheduleVariance(job) {
  if (!job.start_date || !job.actual_completion) {
    return { variance: null, daysOverdue: 0, alerts: [] };
  }

  const projected = new Date(job.projected_completion);
  const actual = new Date(job.actual_completion);
  const variance = Math.ceil((actual - projected) / (1000 * 60 * 60 * 24));
  const alerts = [];

  if (variance > 0) {
    alerts.push({
      type: "completion_delay",
      severity: variance > 10 ? "error" : variance > 5 ? "warning" : "info",
      message: `This job is ${variance} day${variance !== 1 ? "s" : ""} behind schedule.`,
    });
  }

  return { variance, daysOverdue: Math.max(0, variance), alerts };
}

export function analyzePhaseProgress(job, phases) {
  if (!phases || phases.length === 0) return [];

  const today = new Date();
  const jobStart = job.start_date ? new Date(job.start_date) : null;

  return phases.map(phase => {
    const phaseStart = phase.estimated_start ? new Date(phase.estimated_start) : null;
    const phaseEnd = phase.estimated_end ? new Date(phase.estimated_end) : null;
    const actualEnd = phase.actual_end ? new Date(phase.actual_end) : null;

    let status = "not_started";
    let progress = 0;

    if (phaseStart && today >= phaseStart) {
      if (actualEnd) {
        status = "completed";
        progress = 100;
      } else if (today >= phaseStart) {
        status = "in_progress";
        const totalTime = phaseEnd ? phaseEnd - phaseStart : 0;
        const elapsedTime = today - phaseStart;
        progress = totalTime > 0 ? Math.min(100, Math.round((elapsedTime / totalTime) * 100)) : 0;
      }
    }

    let variance = null;
    if (actualEnd && phaseEnd) {
      variance = Math.ceil((actualEnd - phaseEnd) / (1000 * 60 * 60 * 24));
    }

    return {
      ...phase,
      status,
      progress,
      variance,
      isOverdue: phaseEnd && today > phaseEnd && status !== "completed",
    };
  });
}

// Helper functions

function getSimilarCompletedJobs(job, allJobs) {
  if (!allJobs || allJobs.length === 0) return [];

  const revenue = (job.contract_amount || 0) + (job.change_orders_total || 0);

  return allJobs.filter(j => {
    if (j.status !== "completed" || j.id === job.id) return false;
    const jRevenue = (j.contract_amount || 0) + (j.change_orders_total || 0);
    const similarity = Math.abs(jRevenue - revenue) / Math.max(1, revenue);
    return similarity < 0.5; // Within 50% of project size
  });
}

function estimateComplexity(job) {
  let complexity = 1; // 1-5 scale

  if (job.subcontractor_costs && job.subcontractor_costs > 0) complexity += 1;
  if (job.permit_costs && job.permit_costs > 0) complexity += 1;
  if (job.equipment_costs && job.equipment_costs > 0) complexity += 0.5;

  const revenue = (job.contract_amount || 0) + (job.change_orders_total || 0);
  if (revenue > 50000) complexity += 0.5;
  if (revenue > 100000) complexity += 1;

  return Math.min(5, complexity);
}

function estimateLaborHours(job) {
  // Estimate labor hours based on labor costs or scope
  const laborCosts = job.labor_costs || 0;
  const avgLaborRate = 50; // $/hour average
  return laborCosts > 0 ? laborCosts / avgLaborRate : 0;
}

function estimateExpectedLaborHours(job) {
  const revenue = (job.contract_amount || 0) + (job.change_orders_total || 0);
  const laborCostPercent = 0.35; // typical 35% of revenue
  const avgLaborRate = 50;
  return (revenue * laborCostPercent) / avgLaborRate;
}

function generateProjectPhases(job, estimatedDays) {
  const phases = [
    { name: "Site Preparation", percent: 0.08, type: "prep" },
    { name: "Materials & Planning", percent: 0.05, type: "planning" },
  ];

  if (job.subcontractor_costs && job.subcontractor_costs > 0) {
    phases.push({ name: "Subcontractor Work", percent: 0.4, type: "subcontractor" });
  } else {
    phases.push({ name: "Main Work", percent: 0.55, type: "main" });
  }

  phases.push(
    { name: "Final Work & Finishing", percent: 0.25, type: "finishing" },
    { name: "Inspection & Cleanup", percent: 0.12, type: "inspection" }
  );

  let currentDay = 0;
  return phases.map(phase => {
    const phaseDays = Math.ceil(estimatedDays * phase.percent);
    const startDay = currentDay;
    currentDay += phaseDays;

    return {
      name: phase.name,
      type: phase.type,
      estimated_duration_days: phaseDays,
      completion_percent: 0,
      estimated_start: null,
      estimated_end: null,
      actual_start: null,
      actual_end: null,
    };
  });
}

function generateTimelineInsights(job, similarJobs, estimatedDays, laborHours) {
  const insights = [];

  if (similarJobs.length > 0) {
    const avgDays = similarJobs
      .filter(j => j.actual_completion && j.start_date)
      .map(j => Math.ceil((new Date(j.actual_completion) - new Date(j.start_date)) / (1000 * 60 * 60 * 24)))
      .reduce((a, b) => a + b, 0) / similarJobs.length;

    if (estimatedDays < avgDays * 0.8) {
      insights.push("⚠️ This timeline may be overly aggressive compared to similar projects.");
    } else if (estimatedDays > avgDays * 1.2) {
      insights.push("✓ This timeline has some buffer compared to similar projects.");
    }

    const delayedCount = similarJobs.filter(j => {
      if (!j.projected_completion || !j.actual_completion) return false;
      return new Date(j.actual_completion) > new Date(j.projected_completion);
    }).length;

    if (delayedCount > similarJobs.length / 2) {
      insights.push(`⚠️ Similar projects experienced delays ${Math.round((delayedCount / similarJobs.length) * 100)}% of the time.`);
    }
  } else {
    insights.push("📊 Limited historical data. Timeline confidence will increase as you complete projects.");
  }

  if (laborHours > 300) {
    insights.push("👥 This project requires significant labor. Consider multiple crew scheduling.");
  }

  if (job.subcontractor_costs && job.subcontractor_costs > 0 && estimatedDays < 14) {
    insights.push("⚠️ Ensure subcontractors are confirmed before project start.");
  }

  return insights;
}