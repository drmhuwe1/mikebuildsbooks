# Permit Fee Intelligence Implementation Summary

## Overview
Successfully enhanced the permit assistant and bid creation workflow with AI-powered permit fee detection. The system searches official municipal and county sources to identify likely permit-related costs and integrates them into the bid creation process.

## Files Created

### 1. **components/permits/PermitFeeChecker.jsx** (334 lines)
Interactive dialog that:
- Collects project details (address, ZIP, municipality, county)
- Uses AI to search official government sources for permit fees
- Displays detected fees with confidence levels and sources
- Returns formatted fee data to parent components
- Includes comprehensive disclaimer about estimates

**Key Features:**
- 3-step wizard (Input → Review → Results)
- Searches: building permits, zoning permits, inspection fees, review fees, filing fees, deck/roof-specific permits
- Shows confidence badges (high/medium/low)
- Displays fee dependencies (e.g., "depends on project value")
- Source attribution for each fee
- Raw results expandable for expert review

### 2. **components/bids/BidPermitFeesStep.jsx** (236 lines)
Dedicated bid wizard step for permit fees that:
- Displays detected permits fees with checkboxes for selection
- Allows editing of individual fee amounts
- Supports manual fee entry
- Calculates total permit-related fees
- Shows confidence badges and source information
- Includes important disclaimer

**Integration:**
- Added as Step 3 in BidWizard
- Positioned between Costs (Step 2) and Margins (Step 4)
- Automatically calculates into bid totals
- Shows running total of selected fees

### 3. **lib/permitFeeIntelligence.js** (210 lines)
Helper utility library with functions:
- `parsePermitFees()` - Parses LLM fee response into structured data
- `categorizeFee()` - Classifies fees by type
- `formatFeeForBid()` - Converts parsed fee to bid line item
- `estimateTotalPermitFees()` - Calculates total of included fees
- `getFeeWarnings()` - Extracts caution notes
- `generateFeeDisclaimer()` - Returns standard disclaimer text

## Modified Files

### components/bids/BidWizard.jsx
Changes:
- Added import: `import BidPermitFeesStep from "./BidPermitFeesStep"`
- Updated STEPS array: Added "Permit Fees" as Step 3
- Added `permit_fee_items: []` to form defaults
- Updated cost calculation to include permit fees
- Added step 2 rendering for PermitFeesStep
- Adjusted subsequent step indices (2→3, 3→4, etc.)
- Updated bid summary to show individual fee line items

### components/permits/PermitStep6Review.jsx
Changes:
- Added import: `import PermitFeeChecker from "./PermitFeeChecker"`
- Added `checkingFees` state variable
- Updated button grid from 4 to 5 columns
- Added "Fee Check" button with dollar sign icon
- Added PermitFeeChecker modal at end

## Workflow Paths

### Path 1: Permit Drawing → Fee Check → Bid Creation
1. User creates permit drawings (PermitDrawingWizard)
2. Reaches Step 6 (Review)
3. Clicks "Fee Check" button
4. PermitFeeChecker opens and searches official sources
5. User reviews detected fees
6. Closes dialog (fees available for reference)
7. Later, creates bid using BidWizard
8. On Step 3 (Permit Fees), fees appear pre-populated

### Path 2: Direct Bid Creation with Fee Check
1. User opens BidWizard
2. Completes Steps 1-2 (Basics, Costs)
3. Reaches Step 3 (Permit Fees)
4. Clicks "Run Fee Intelligence"
5. PermitFeeChecker opens
6. Enters project details and searches
7. Reviews detected fees
8. Adds fees to bid
9. Continues with remaining steps

## AI Integration

**LLM Prompt Focus:**
- Searches OFFICIAL government sources only
- Looks for specific fee types:
  - Building permit fees
  - Zoning permit/variance fees
  - Inspection fees
  - Plan review fees
  - Filing fees
  - Material-specific fees (deck, roof)
  - Valuation-based fees

**Model Used:**
- `gemini_3_pro` for web search capability
- Configured with `add_context_from_internet: true`
- Ensures current fee schedules are found

## Data Flow

```
PermitFeeChecker Dialog
  ↓ (user searches)
LLM with Internet Search
  ↓ (returns fee data)
parsePermitFees() helper
  ↓ (structures data)
BidPermitFeesStep
  ↓ (user selects/edits)
Form State
  ↓ (included in calculation)
Bid Total & Line Items
```

## Fee Data Structure

```javascript
{
  id: string,                 // Unique identifier
  name: string,              // Fee name
  description: string,       // What fee covers
  amount: number,            // Dollar amount estimate
  type: string,              // "fixed", "percentage", "range", "value-based"
  category: string,          // "building", "zoning", "deck", "roof", etc.
  confidence: string,        // "high", "medium", "low"
  source: string,            // Government office/website
  dependsOn: string,         // Dependencies
  notes: string,             // Additional notes
  included: boolean,         // Selected for bid
}
```

## Key Features

### 1. **Official Source Priority**
- Searches government websites, building departments, county clerks
- Prioritizes published fee schedules
- Marks confidence levels for each fee
- Includes source attribution

### 2. **Confidence Levels**
- **High** - Found on official fee schedule
- **Medium** - Likely applicable, partial confirmation
- **Low** - Estimated, needs verification
- UI uses badges to show level

### 3. **Fee Dependencies**
- Shows when fees depend on project value
- Indicates square footage-based calculations
- Highlights need for additional review
- Recommends verification before submission

### 4. **Multiple Fee Types**
```
Building Permits
Zoning Permits & Variances
Inspections (footing, framing, final, etc.)
Plan Review Fees
Filing Fees
Deck-Specific Permits
Roof-Specific Permits
Valuation-Based Fees
Other Municipal Fees
```

### 5. **User Control**
- Checkbox to include/exclude individual fees
- Editable amounts for all fees
- Manual entry for fees not detected
- Clear totals showing included amount

## Disclaimers & Limitations

**Required Disclaimer (shown in multiple places):**
```
Permit fees are AI-assisted estimates based on official public information 
and project inputs. Final fees should always be confirmed with your local 
building and zoning office before submission. Fees may vary based on project 
value, square footage, additional reviews, or other factors specific to your 
municipality.
```

**Limitations:**
- Estimates only; final verification required
- Fee schedules change; always check current rates
- Some fees may not be publicly listed
- Discretionary or conditional fees may not appear
- Different jurisdictions have different requirements
- Project-specific conditions may affect final fees

## Testing Recommendations

1. **Basic Flow**
   - Create permit drawing → Fee Check → review results
   - Create bid → Permit Fees step → detect and add fees

2. **Fee Detection**
   - Test with various ZIP codes
   - Test with different project types (deck, roof, roof-over-deck)
   - Verify sources appear in results
   - Check confidence levels are accurate

3. **Bid Integration**
   - Verify permit fees appear in step 3
   - Confirm fees add to total costs
   - Test fee editing and removal
   - Verify bid summary shows individual fees

4. **Edge Cases**
   - Test with invalid ZIP code
   - Test with small vs. large estimated values
   - Test with manual fee entry
   - Test removing all fees then re-adding

## Future Enhancement Opportunities

1. **Fee Database**
   - Cache common fee schedules by municipality
   - Track historical fees for trend analysis
   - Speed up repeat checks for same location

2. **Smart Defaults**
   - Learning from user selections
   - Suggest common fees based on project type
   - Remember past fee patterns

3. **Integration Enhancements**
   - Link to official fee schedule documents
   - One-click contact for building department
   - Online permit application links

4. **Analytics**
   - Track detected vs. actual permit fees
   - Identify common fee patterns by region
   - Help contractors improve pricing

## Maintenance Notes

- LLM model: `gemini_3_pro` supports web search
- Helper functions centralized in `permitFeeIntelligence.js`
- Fee parsing is flexible to handle various LLM response formats
- Confidence levels are user-facing indicators, not automatic selectors
- All fees default to unselected except high-confidence items

## Support & Documentation

- **User Guide:** See PERMIT_FEE_INTELLIGENCE_GUIDE.md
- **Component Details:** JSDoc comments in each component
- **Helper Functions:** Exported from lib/permitFeeIntelligence.js
- **Integration Points:** BidWizard step 3, PermitStep6Review button