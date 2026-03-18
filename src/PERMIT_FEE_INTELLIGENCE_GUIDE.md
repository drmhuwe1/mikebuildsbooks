# Permit Fee Intelligence Feature Guide

## Overview

The Permit Fee Intelligence system helps contractors identify and include permit-related costs early in the bid creation process by searching official municipal and county sources for likely permit fees.

## Components

### 1. **PermitFeeChecker** (`components/permits/PermitFeeChecker.jsx`)
An interactive dialog that:
- Collects project details (address, municipality, county, ZIP code)
- Searches official government sources for permit-related fees
- Displays detected fees with confidence levels and source information
- Returns formatted fee data to parent components

**Key Features:**
- 3-step wizard (Input → Review → Results)
- Searches official government sources using AI
- Shows confidence levels for each fee
- Displays dependencies (e.g., "depends on project value")
- Includes source attribution
- Clear disclaimer about estimates

### 2. **BidPermitFeesStep** (`components/bids/BidPermitFeesStep.jsx`)
A bid wizard step that:
- Displays detected permit fees with checkboxes for inclusion
- Allows users to edit fee amounts
- Supports manual fee entry
- Calculates total permit-related fees
- Shows confidence badges and source information

**Key Features:**
- Integrates with BidWizard as Step 3
- Editable fee amounts
- Checkbox to include/exclude individual fees
- Manual fee entry form
- Running total of selected fees
- Includes important disclaimer

### 3. **PermitFeeIntelligence** (`lib/permitFeeIntelligence.js`)
Helper utilities for:
- Parsing AI-generated fee data
- Categorizing fees by type
- Formatting fees for bid inclusion
- Calculating total permit costs
- Generating warnings about uncertain fees
- Standardizing disclaimer text

**Key Functions:**
- `parsePermitFees()` - Parse LLM response into structured fee data
- `categorizeFee()` - Classify fees by type
- `formatFeeForBid()` - Convert parsed fee to bid line item
- `estimateTotalPermitFees()` - Calculate included fee total
- `getFeeWarnings()` - Extract caution notes about fees

## User Workflow

### Option A: During Permit Drawing Phase

1. Open "Permit Drawing Wizard"
2. Complete project specifications (Steps 1-5)
3. Reach "Review" step (Step 6)
4. Click **"Fee Check"** button
5. PermitFeeChecker dialog opens
6. Enter project details and search official sources
7. Review detected fees
8. Close dialog (fees are saved for bid creation)

### Option B: During Bid Creation

1. Open "BidWizard" to create a new bid
2. Complete Basics (Step 1) and Costs (Step 2)
3. Reach **"Permit Fees"** step (Step 3)
4. Click **"Run Fee Intelligence"** button
5. PermitFeeChecker dialog opens
6. Enter project details and search official sources
7. Review and confirm detected fees
8. Fees are added to bid cost calculation
9. Continue with remaining bid steps

## Fee Data Structure

Each detected fee includes:

```javascript
{
  id: string,                    // Unique identifier
  name: string,                  // Fee name (e.g., "Building Permit")
  description: string,           // What the fee covers
  amount: number,                // Dollar amount (if fixed) or estimate
  type: string,                  // "fixed", "percentage", "range", "value-based"
  category: string,              // "building", "zoning", "deck", "roof", etc.
  confidence: string,            // "high", "medium", "low"
  source: string,                // Where information came from
  dependsOn: string,             // Dependencies (e.g., "project value")
  notes: string,                 // Additional notes
  included: boolean,             // Whether fee is included in bid
}
```

## Official Sources Searched

The AI searches for fees from:
- Building department websites
- City/township zoning offices
- County clerk fee schedules
- Planning & zoning board websites
- Official government permit applications
- Published municipal code sections

## Important Limitations

### Always Include This Disclaimer

```
Permit fees are AI-assisted estimates based on official public information 
and project inputs. Final fees should always be confirmed with your local 
building and zoning office before submission. Fees may vary based on project 
value, square footage, additional reviews, or other factors specific to your 
municipality.
```

### Fees Not Guaranteed

- Estimates based on public information current at time of search
- Fee schedules change; always verify before submission
- Some fees may depend on project characteristics not captured in initial estimate
- Additional fees may apply based on site conditions, environmental review, etc.
- Some jurisdictions may have discretionary fees not published

### When to Contact Building Department

- Confirm final permit fees before committing to bid
- Clarify which fees apply to your specific project
- Ask about any optional or discretionary fees
- Verify if fees depend on project valuation
- Ask about payment methods and timing

## Integration Points

### In Bid Wizard
- Step 3: Permit Fees Review
- Fees automatically added to direct costs
- Each fee appears as line item in bid summary
- Fees included in total cost calculation
- Fees factored into profit margins

### In Permit Workflow
- Step 6 (Review): Quick access to Fee Check
- Results saved for bid creation reference
- Can be checked multiple times without impact

## Best Practices

1. **Early Fee Detection**
   - Check fees early in bid process
   - Allows accurate bid pricing from start
   - Helps avoid forgetting permit costs

2. **Verify Before Submission**
   - Always call building department before submitting bid
   - Confirm fee amounts are current
   - Ask about any additional fees not listed

3. **Include in Client Communication**
   - Clearly break out permit fees in proposals
   - Explain that fees are estimates pending confirmation
   - Note any contingencies or dependencies

4. **Update as Project Progresses**
   - Re-check if scope changes significantly
   - Some fees may increase with larger projects
   - Additional reviews may trigger new fees

## Error Handling

If fee detection fails:
- User sees error message with suggested troubleshooting
- Option to try search again
- Can add fees manually as fallback
- Disclaimer recommends contacting building department

If no fees found:
- Alert appears indicating no public fee schedule found
- Recommendation to contact building department directly
- Option to add fees manually based on phone inquiry

## Data Privacy

- Project information is sent to LLM for analysis
- Only public government sources are searched
- No PII or sensitive data is stored
- Results are used only for fee estimation

## Future Enhancements

Potential improvements:
- Fee database with historical rates by municipality
- Alerts when fee schedules change
- Integration with online permit portals
- Tracking of actual vs. estimated fees
- Location-specific templates by jurisdiction