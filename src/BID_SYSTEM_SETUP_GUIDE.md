# Complete Bid System Setup Guide

## 📍 Company Information Location

**Settings Page** → **Company Settings Tab**

All company branding and information displays on all bids and documents:
- ✅ Company Logo (image upload)
- ✅ Company Name
- ✅ Company Address
- ✅ Company Phone
- ✅ Company Email
- ✅ Manager Name & Title
- ✅ Manager EIN/SSN (for 1099s)
- ✅ Document Footer Text
- ✅ Document Margins

---

## 📋 Bid Workflow - 6 Steps

### Step 1: Basics
- Bid title
- Client selection (or create new)
- Project scope (detailed description)
- Bid valid until date

### Step 2: Costs
- Material costs
- Labor hours & rate
- Subcontractor costs
- Permits & equipment

### Step 3: Margins
- Overhead percentage
- Contingency percentage
- Target profit margin
- Internal notes

### Step 4: Payment & Terms
- Deposit required (%)
- Deposit amount (calculated)
- Terms & conditions disclaimer
- Additional fees/conditions

### Step 5: Review & Validation ⭐ NEW
- **AI Bid Validation** checks:
  - Required fields present
  - Financial completeness
  - Legal requirements met
  - Pricing sensibility
  - Margin warnings
  - Timeline alerts
- Profit prediction based on similar jobs
- Historical job comparisons

### Step 6: Signatures ⭐ NEW
- **Contractor Signature** (required)
  - Name & title
  - Date signed automatically
- **Customer Signature** (required)
  - Customer name
  - Date signed automatically
- Status: Cannot save without both signatures
- Legal binding confirmation

---

## 🤖 AI Enhancements

### 1. **Bid Document Import** (`extractBidFromDocument.js`)
- Upload PDF, Word, Excel, or image
- AI extracts:
  - Project title
  - Client name
  - Complete scope of work
  - Material costs
  - Labor hours
  - Subcontractor needs
  - Permit costs
  - Equipment costs
  - Bid amount
  - Deposit percentage
  - Valid until date
  - Terms & conditions

**Key Feature:** Captures FULL scope details, not just summaries

### 2. **Bid Validation** (`validateBid.js`)
AI checks every bid before signing:

**Required Fields:**
- ✅ Bid title
- ✅ Client name
- ✅ Detailed scope (min 50 chars)
- ✅ Bid expiration date
- ✅ At least one cost category
- ✅ Labor rate if labor hours entered
- ✅ Non-zero bid amount

**Legal Compliance Checks:**
- ✅ Valid contract terms & scope
- ✅ Clear pricing
- ✅ Expiration date specified
- ✅ Terms & conditions included
- ✅ Contractor signature line ready
- ✅ Customer signature line ready

**AI Warnings:**
- ⚠️ Material costs > 70% of bid
- ⚠️ Labor cost exceeds bid amount
- ⚠️ Bid expires soon or already expired
- ⚠️ Unusual pricing patterns

---

## 📝 Signatures & Legal Requirements

### Why Both Signatures Are Required
- **Legally binding contract** between parties
- **Contractor accountability** - proves business owner commitment
- **Customer agreement** - proves client acceptance of terms
- **Dispute prevention** - clear evidence of what was agreed
- **Professional standard** - construction industry best practice

### Signature Process
1. Contractor enters name/title first
2. System records date automatically
3. Customer enters name second
4. System records date automatically
5. Both signatures required before saving
6. Creates legally enforceable contract

### Document Includes
- Company logo & branding (from Settings)
- All work details & scope
- Pricing breakdown
- Payment terms & deposit
- Terms & conditions
- Contractor signature line with date
- Customer signature line with date
- Company contact information

---

## 🎨 Branding on All Documents

Every bid, proposal, contract, and estimate includes:
- ✅ Company logo (top left or center)
- ✅ Company name & contact info
- ✅ Professional formatting per Settings
- ✅ Custom footer text
- ✅ Custom margins
- ✅ Legal compliance notice
- ✅ Signature lines for all parties

---

## ✏️ Editing & Alterations

### Before Signatures
- All fields fully editable
- Can change costs, margins, terms
- Validation re-runs automatically
- Signatures cleared if major changes made

### After Signatures
- View full signed document
- Cannot edit signed bid directly
- Create new version if changes needed
- Original signed copy preserved
- Audit trail maintained

---

## 📤 Using the Uploaded Bid Document

Your uploaded bid document will be used to:
1. **Extract bid information** via AI
2. **Populate the form** with extracted data
3. **Validate scope details** are complete
4. **Compare to previous bids** for pricing consistency
5. **Add signatures** to create binding contract

The system ensures NO details are missed during extraction.

---

## 🔍 Quality Assurance

### Before Finalizing
1. Review extracted information
2. Verify scope is complete (AI will flag if brief)
3. Check all costs are entered
4. Confirm pricing makes sense
5. Both parties sign
6. System validates everything

### If Issues Found
- Red warning badges appear
- Specific missing items listed
- Cannot save until resolved
- Guidance on what's needed

---

## 📊 Bid Analytics

After bid is signed:
- Bid amount vs. actual job cost tracking
- Profit margin analysis
- Historical comparison
- Seasonal pattern recognition
- Customer decision timeline

---

## Questions?

- **Company Settings:** Go to Settings page → Company Info tab
- **Bid Validation Issues:** Review warnings in Step 5
- **Signature Problems:** Ensure both names entered, dates auto-fill
- **Document Import:** Upload any bid document (PDF, Word, Excel, image)