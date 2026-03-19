import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// FAQ knowledge base
const CHATBOT_FAQ = [
  { keyword: "bid", answer: "To create a bid: Go to Jobs → New Bid, enter client info, add costs (materials, labor, subs), set overhead/profit margins, and save. The app auto-converts approved bids to contracts." },
  { keyword: "job", answer: "Jobs track projects from bidding to completion. Create a job via the Bid Wizard or Jobs page, track costs, schedule, and payments. When done, use the Closeout Wizard to finalize and calculate payouts." },
  { keyword: "payout", answer: "The Payout Engine automatically splits profits after each job closes: tax reserve (25%), owner payout (30%), operating reserve (10%), retained earnings (10%), and manager pay (10%). Adjust percentages in Settings." },
  { keyword: "contract", answer: "Contracts are generated from approved bids. They include payment terms, scope, change order policy, and signature blocks. You can customize the contract template in Documents." },
  { keyword: "subcontractor", answer: "Track subs in Subcontractors. Collect W-9s digitally or upload paper copies. The app tracks payments and auto-flags when someone hits $600+ (1099 threshold)." },
  { keyword: "w-9", answer: "Send digital W-9 forms directly to subs—they sign online. Upload paper copies if needed. Track status in the Subcontractor panel. Required for 1099 filing." },
  { keyword: "permit", answer: "Use Permit Drawing Wizard to generate deck/roof drawings with dimensions and specs. Track inspections and building dept contacts in the Municipality panel for each job." },
  { keyword: "tax", answer: "Set tax reserve % in Settings (default 25%). Each closed job auto-calculates and sets aside that amount. Export a complete tax report at year-end via Tax Export." },
  { keyword: "receipt", answer: "Upload receipts in Job Financials. Categorize by type (materials, labor, equipment, etc.). The app aggregates for expense tracking and tax reporting." },
  { keyword: "pricing", answer: "Set markup in Bid Wizard: target profit margin %, overhead %, contingency %. The app calculates bid amount based on direct costs. Adjust in Settings for defaults." },
  { keyword: "cash flow", answer: "View real-time cash on hand in Banking. Connect bank via Plaid for auto-sync, or log transactions manually. Track overdue bills, receivables, and upcoming expenses." },
  { keyword: "profit", answer: "Profit = Revenue - Expenses - Manager Pay. Track on each job, and see business profit in Business Financials. Set % reserves for taxes, operations, and owner draw in Settings." },
  { keyword: "markup", answer: "Markup = (Bid Amount - Cost) / Cost × 100%. Use the Bid Wizard to set profit margin % — the app calculates the bid amount for you." },
  { keyword: "margin", answer: "Profit margin = (Profit / Revenue) × 100%. The Bid Wizard uses target margin % to auto-calculate bid amounts. Typical margins are 15-25% for construction." },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userMessage } = await req.json();

    if (!userMessage || typeof userMessage !== "string") {
      return Response.json({ error: "Invalid message" }, { status: 400 });
    }

    const lowerMessage = userMessage.toLowerCase();

    // Step 1: Check FAQ for matching keywords
    const faqMatch = CHATBOT_FAQ.find(item => lowerMessage.includes(item.keyword));
    
    if (faqMatch) {
      return Response.json({ reply: faqMatch.answer });
    }

    // Step 2: Fall back to AI for general/business questions
    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a helpful assistant for MikeBuildsBooks, a financial and job management app for construction contractors. 
A user asked: "${userMessage}"

Context: MikeBuildsBooks helps contractors manage bids, jobs, contracts, payouts, subcontractors, permits, finances, and taxes.

Respond concisely (1-2 sentences) with practical advice. If it's not about construction/business/the app, politely redirect.`,
      model: "gpt_5_mini"
    });

    const reply = typeof aiResponse === "string" ? aiResponse : aiResponse.reply || "I'm not sure how to help with that. Try asking about bids, jobs, payouts, or business strategy.";

    return Response.json({ reply });
  } catch (error) {
    console.error("Chatbot error:", error.message);
    return Response.json({ reply: "Sorry, I encountered an error. Please try again." }, { status: 500 });
  }
});