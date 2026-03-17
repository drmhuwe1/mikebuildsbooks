# AI Project Timeline Predictor & Schedule Risk Monitoring System

## Overview
Added an intelligent timeline forecasting and scheduling guidance system to help project owners plan more accurately and detect schedule risks early.

---

## Core Components Added

### 1. **Timeline Intelligence Engine** (`lib/timelineIntelligence.js`)
Analyzes historical job data to predict realistic timelines and detect scheduling risks.

**Key Functions:**
- `predictProjectTimeline(job, allJobs)` - Predicts completion date, duration, and labor hours
- `analyzeTimelineRisk(job, allJobs)` - Assigns scheduling risk scores (0-100)
- `monitorScheduleVariance(job)` - Tracks actual vs. projected completion
- `analyzePhaseProgress(job, phases)` - Monitors phase-by-phase progress

**Risk Factors Analyzed:**
- Aggressive timelines vs. historical similar projects
- Missing subcontractor scheduling
- Project complexity & scope
- Labor allocation vs. estimated requirements
- Material preparation status
- Historical delays in similar project types

**Output Includes:**
- Estimated start/completion dates
- Estimated total days & labor hours
- Project phases with durations
- Confidence score (50-95%)
- Risk level (Low/Moderate/High)
- Actionable AI insights

---

### 2. **Timeline Predictor Panel** (`components/jobs/TimelinePredictorPanel.jsx`)
Displays timeline predictions with collapsible details in job cards.

**Features:**
- Quick summary: Start date, end date, duration, labor hours
- Risk level badge with color coding
- Expandable details showing:
  - Risk factors contributing to score
  - Breakdown of work phases
  - AI insights based on historical data
  - Edit timeline button

---

### 3. **Schedule Monitoring Component** (`components/jobs/ScheduleMonitor.jsx`)
Real-time tracking of job progress vs. planned timeline.

**Monitors:**
- Planned vs. actual completion dates
- Days overdue (if applicable)
- Phase-by-phase progress with visual indicators
- Completion percentage for each phase
- Status labels (On Schedule / Behind Schedule)

---

### 4. **Schedule Status Widget** (`components/operations/ScheduleStatusWidget.jsx`)
Dashboard widget for Operations Command Center showing job timeline status.

**Displays:**
- Count of jobs on schedule, at risk, and delayed
- Color-coded status indicators (green/yellow/red)
- List of at-risk and delayed jobs with days remaining
- Quick links to Job Timeline page

---

### 5. **Data Cleanup Function** (`functions/clearMockData.js`)
Backend function to clear all mock/sample data from the database.

**Usage:** Admin-only function to reset all entity records for fresh start.

---

## Integration Points

### Job Detail Dialog
- Added `TimelinePredictorPanel` to show timeline predictions when viewing job details
- Displays confidence score and similar project comparisons

### Operations Command Center
- New `ScheduleStatusWidget` showing overall schedule health
- Visual indicators for job status: On Track / At Risk / Delayed
- Quick summary of active jobs

### Job Cards
- Timeline predictor integrated into job cards
- Risk indicator shows in expanded view
- Helps identify scheduling issues early

---

## Key Features

### Timeline Prediction
- Analyzes similar completed projects (within 50% of project size)
- Adjusts estimates based on:
  - Project complexity (1-5 scale)
  - Labor hours required
  - Subcontractor involvement
  - Material costs
  - Equipment needs

### Risk Analysis
- **Low Risk:** Score 0-30
- **Moderate Risk:** Score 30-60  
- **High Risk:** Score 60-100

Risk factors include:
- Timeline 25%+ shorter than similar projects
- Complex projects without subcontractor scheduling
- Labor allocation 30%+ below estimates
- Missing materials planning
- Historical delay patterns in similar projects

### Confidence Scoring
- 50% confidence with no historical data
- Increases by 5% per similar completed project
- Maxes at 95% with 9+ similar projects
- Higher confidence = more reliable predictions

### Phase Tracking
Automatically generates phases:
1. Site Preparation (8% of timeline)
2. Materials & Planning (5%)
3. Subcontractor Work OR Main Work (40-55%)
4. Final Work & Finishing (25%)
5. Inspection & Cleanup (12%)

---

## AI Insights Examples

- "⚠️ This timeline may be overly aggressive compared to similar projects."
- "✓ This timeline has some buffer compared to similar projects."
- "⚠️ Similar projects experienced delays 60% of the time."
- "👥 This project requires significant labor. Consider multiple crew scheduling."
- "⚠️ Ensure subcontractors are confirmed before project start."

---

## User Experience

✅ **Clear, Non-Technical Language**
- Avoids construction jargon when possible
- Uses simple comparisons to past projects
- Color-coded risk levels (green/yellow/red)

✅ **Early Warning System**
- Risk scores calculated upfront
- Schedule variance alerts during execution
- Phase-level monitoring for granular tracking

✅ **No Automatic Changes**
- All predictions are recommendations only
- User approves schedule changes manually
- Integrates into existing workflow

✅ **Continuous Learning**
- System learns from completed jobs
- Improves predictions as more data collected
- Considers project size, type, complexity

---

## Document Import Formats

**Supported for Bid Imports:**
- CSV files
- Excel spreadsheets (.xlsx)
- JSON
- **PDF documents** ✅
- **Word documents** (.doc, .docx) ✅
- Image files (JPG, PNG, GIF, TIFF)

The upload component accepts these formats and AI extracts bid data automatically.

---

## Mock Data Cleared

All sample/mock data has been removed from the database. The app is now empty and ready for user input.

To clear remaining data, call the admin-only backend function:
```
POST /functions/clearMockData
```

---

## Future Enhancements

- Material delivery timeline tracking
- Subcontractor availability integration
- Seasonal pattern learning
- Weather delay predictions
- Crew scheduling optimization
- Automated delay alerts/notifications
- Mobile app for on-site timeline tracking