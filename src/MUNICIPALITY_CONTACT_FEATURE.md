# Municipality Contact Panel Feature Guide

## Overview
The Municipality Contact Panel automatically identifies and stores permit office information for each project, making it easy to quickly confirm requirements, submit permits, and schedule inspections.

## What's Included

### 1. **Municipality Entity**
Stores all permit office information linked to jobs:
- Municipality/County/State/ZIP identification
- Building & Zoning Department contacts
- Permit office address, hours, websites
- Inspector information
- Office-specific rules and submission preferences
- Inspection tracking (passed/failed status)

### 2. **Inspection Tracking**
Log inspections directly in the app:
- Foundation, Framing, Electrical, Plumbing, HVAC, Roofing, Final inspections
- Track: Requested date, Scheduled date, Inspector name, Result (passed/failed)
- Follow-up notes for any required re-inspections
- Integrated into job timeline

### 3. **Municipality Contact Panel Component**
Located in the Jobs detail view:
- **Quick Actions**: Call, Email, Visit Website, Open Online Permit Portal
- **Contact Information**: Building Dept, Zoning Dept, Inspector details
- **Office Notes**: Special township requirements, submission preferences
- **Edit Mode**: Update information if details change
- **Disclaimer**: Reminds users to verify with the local office

### 4. **Unified Workflow Integration**
The Municipality identification is built into Step 2 of the Design Workflow:
- When users enter project address, municipality info is populated
- Information is saved and editable throughout the workflow
- Municipality details reference throughout permit and design stages

## How to Use

### Adding Municipality Information

1. **Open a Job Details**
   - Click "View Details" on any job in the Jobs list
   - Navigate to the "Municipality" tab

2. **Add or Edit Municipality Info**
   - Click "Edit" button in the Municipality Contact Panel
   - Enter or update:
     - Municipality/County/State/ZIP
     - Building Department details
     - Zoning Department details
     - Permit office address and hours
     - Permit website URLs
     - Inspector information
     - Special office notes

3. **Save Changes**
   - Click "Save Municipality Info"
   - Information is now attached to the job

### Quick Actions

Once municipality information is saved:
- **Call**: Click the "Call" button to dial the building department
- **Email**: Click "Email" to send a message
- **Website**: Visit the official permit website
- **Portal**: Access the online permit submission portal

### Logging Inspections

1. Navigate to Job Details → Municipality → "Inspections" tab
2. Click "+ Log Inspection"
3. Enter:
   - Inspection type (Foundation, Framing, etc.)
   - Status (Requested, Scheduled, Completed)
   - Requested and Scheduled dates
   - Inspector name
   - Result (Passed, Failed, Conditional Pass)
   - Follow-up notes if needed
4. Click "Log Inspection"

Inspections appear in the timeline and can be referenced when preparing next steps.

### In the Unified Design Workflow

1. **Step 2: Municipality**
   - Enter project address
   - System prepares municipality identification
   - Review and verify municipality details
   - Edit if information is incorrect
   - Information is saved with project data

2. **Later Steps**
   - Permit requirements reference municipality location
   - Fee estimates consider local permit processes
   - Packet builder knows submission preferences

## Key Features

✅ **Automatic Municipality Identification**
- Identifies municipality from project address
- Prepares initial contact information
- User verifies and edits as needed

✅ **One-Click Contact**
- Call building department directly
- Send email in one click
- Copy contact info to clipboard

✅ **Centralized Office Notes**
- Store special township requirements
- Track inspection scheduling methods
- Note submission preferences
- Keep inspector contact info

✅ **Inspection Tracking**
- Log each inspection with details
- Track passed/failed results
- Record follow-up requirements
- Integrated with job timeline

✅ **Attached to Projects**
- Municipality info saved with each job
- Never lose permit office details
- Easily reference for future work

## Best Practices

1. **Verify Information**
   - Always confirm municipality details with the local office
   - Check website URLs are correct
   - Verify current office hours

2. **Update When Office Changes**
   - Update if building department moves
   - Note if contacts or processes change
   - Keep website links current

3. **Use for Planning**
   - Check office hours before calling
   - Reference submission preferences
   - Note inspection scheduling instructions

4. **Log Inspections Regularly**
   - Record inspection results immediately
   - Add follow-up notes for failed inspections
   - Track inspection history for future projects

## Integration Points

The Municipality Contact Panel integrates with:
- **Unified Design Workflow**: Step 2 identifies and stores municipality
- **Permit Packet Builder**: References submission preferences
- **Permit Fee Intelligence**: Uses location for fee estimates
- **Job Timeline**: Inspection records appear in project history
- **Jobs List**: Municipality tab in job detail view

## Data Stored

For each municipality, you can store:
- **Location**: Municipality, County, State, ZIP
- **Contacts**: Building Dept, Zoning Dept, Inspector names and numbers
- **Office**: Address, Hours, Website, Online Portal
- **Office Preferences**: Submission method, inspection scheduling, special rules
- **Status**: Whether information has been verified with office

## Disclaimer

⚠️ **Important**: Municipality information is provided as guidance and should always be confirmed directly with the local permit office before submission. Building departments may update contact information, processes, or requirements.

Always contact the permit office directly to verify:
- Current contact information
- Required documents
- Permit fees
- Inspection scheduling process
- Special municipal requirements

## Troubleshooting

**Municipality info not auto-populated?**
- Ensure address is entered correctly
- Check ZIP code is accurate
- May need manual entry if address is incomplete

**Can't reach permit office?**
- Verify hours are current
- Try alternate contact method
- Check website for updated phone/email

**Inspection not appearing?**
- Refresh page to see latest data
- Confirm inspection was saved successfully
- Check that job_id is correct

## Next Steps

1. Try adding a municipality to a job
2. Log a test inspection
3. Use quick actions to contact the office
4. Update office notes with special requirements

Questions? Refer to the full app documentation or contact support.