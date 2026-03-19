import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Loader, Bug, AlertCircle } from "lucide-react";
import { useLocation } from "react-router-dom";

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
];

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm here to help with MikeBuildsBooks features or business questions. What can I help with?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBugForm, setShowBugForm] = useState(false);
  const [bugType, setBugType] = useState("bug");
  const [bugMessage, setBugMessage] = useState("");
  const [bugLoading, setBugLoading] = useState(false);
  const location = useLocation();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await base44.functions.invoke("chatbotRespond", { userMessage });
      const botReply = response.data?.reply || "Sorry, I couldn't process that. Try rephrasing your question.";
      setMessages(prev => [...prev, { role: "assistant", content: botReply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error connecting to chatbot. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all flex items-center justify-center hover:scale-110"
          title="Chat with assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">MikeBuildsBooks Assistant</h3>
              <p className="text-xs opacity-90">Ask about features or business tips</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-primary/80 p-1 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs px-3 py-2 rounded-lg ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted px-3 py-2 rounded-lg flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  <p className="text-sm text-muted-foreground">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3 flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === "Enter" && handleSend()}
              placeholder="Ask a question..."
              disabled={loading}
              className="flex-1 text-sm"
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              size="sm"
              className="px-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export { CHATBOT_FAQ };