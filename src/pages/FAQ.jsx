import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SkipToContent from "@/components/landing/SkipToContent";

const faqs = [
  {
    category: "Getting Started",
    items: [
      { q: "How do I sign up for MikeBuildsBooks?", a: "Click 'Get Started' on our home page, enter your email, and create a password. You'll be able to start building bids and managing jobs right away. The first 14 days are free." },
      { q: "Do I need to enter a credit card to try it free?", a: "No. Your first 14 days are completely free with no credit card required. After 14 days, you can choose a plan that works for you." },
      { q: "Can I cancel anytime?", a: "Yes. You can cancel your subscription anytime from Settings. Your data will be preserved for 30 days in case you want to reactivate." },
    ]
  },
  {
    category: "Billing & Subscriptions",
    items: [
      { q: "How much does MikeBuildsBooks cost?", a: "We offer three plans: Starter ($49/mo), Pro ($79/mo), and Professional ($599/year). See our pricing page for a full feature comparison." },
      { q: "What's included in each plan?", a: "Starter includes job management, bids, contracts, and the payout engine. Pro adds AI tools (photo-to-bid, bid package wizard) and Plaid bank sync. Professional adds priority support and early feature access." },
      { q: "Are there per-user or per-job fees?", a: "No. All our plans are flat-rate with no per-user or per-job charges. Invite as many team members or subcontractors as you need." },
      { q: "Do you offer annual billing discounts?", a: "Yes. The Professional plan is billed annually at $599/year, saving ~$349 vs. monthly Pro billing." },
    ]
  },
  {
    category: "Features & Functionality",
    items: [
      { q: "Can I import my existing bids and contracts?", a: "Yes. We have an import wizard that can read PDFs and Word files. The AI extracts key data so you don't have to re-type everything." },
      { q: "Does MikeBuildsBooks connect to my bank?", a: "Yes, on the Pro plan and above. We use Plaid to securely connect your business and personal bank accounts. Transactions sync automatically." },
      { q: "Can I share bids or contracts with clients?", a: "Yes. You can email contracts and change orders directly to clients. They can sign digitally — no printing or scanning needed." },
      { q: "Does it work offline?", a: "The app works best online, but we've built offline support so you can view cached pages and data. Some features (like syncing new data) require internet." },
      { q: "Can I generate permit drawings?", a: "Yes, on the Pro plan and above. We support deck and roof drawings with dimensions, materials, and structural specs built in." },
    ]
  },
  {
    category: "Data & Security",
    items: [
      { q: "Is my financial data secure?", a: "Yes. All data is encrypted in transit (HTTPS) and at rest. We never share your data with third parties. You own your data and can export or delete it anytime." },
      { q: "Can my team members access my jobs and bids?", a: "Only if you invite them. You control who sees what. Clients can only see what you share with them." },
      { q: "What happens if I delete my account?", a: "Your account and all associated data is deleted within 30 days. We retain anonymized, aggregated data for analytics only." },
      { q: "Do you comply with GDPR?", a: "Yes. We comply with GDPR, CCPA, and other privacy regulations. See our Privacy Policy for details." },
    ]
  },
  {
    category: "Subcontractors & Payments",
    items: [
      { q: "How do I track subcontractor payments?", a: "Add subs to your team, log their work hours or daily rates, and the app calculates what you owe. You can mark payments as made and keep a full payment ledger." },
      { q: "Do you handle W-9 collection?", a: "Yes. Send a digital W-9 form directly from the app. Subs fill it out and sign online. Alerts appear when anyone hits $600+ YTD (1099 threshold)." },
      { q: "Can I set different pay rates for different subs?", a: "Yes. Each sub can have a default hourly, daily, or weekly rate. You can override the rate on any specific job." },
    ]
  },
  {
    category: "Support & Help",
    items: [
      { q: "Is there customer support?", a: "Yes. All subscribers get email support. Professional plan subscribers get priority support and faster response times." },
      { q: "How do I contact support?", a: "Go to our Contact page or use the contact form at mikebuildsbooks.com/contact. Most inquiries are answered within 24 hours." },
      { q: "Is there a phone number I can call?", a: "Currently we support email and in-app chat for subscribers. For urgent issues, email us and we'll call you back." },
      { q: "Do you have video tutorials?", a: "Yes. Our Help Guide includes step-by-step walkthroughs for every major feature." },
    ]
  }
];

export default function FAQ() {
  // Update document title & meta for SEO
  React.useEffect(() => {
    document.title = "FAQ — MikeBuildsBooks Questions Answered";
    // Inject FAQ JSON-LD for rich results
    const existingScript = document.getElementById('faq-jsonld');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'faq-jsonld';
      script.type = 'application/ld+json';
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.flatMap(section =>
          section.items.map(item => ({
            "@type": "Question",
            "name": item.q,
            "acceptedAnswer": { "@type": "Answer", "text": item.a }
          }))
        )
      };
      script.textContent = JSON.stringify(faqSchema);
      document.head.appendChild(script);
    }
    document.querySelector('meta[name="description"]')?.setAttribute(
      'content',
      'Frequently asked questions about MikeBuildsBooks: pricing, features, billing, security, and more.'
    );
    document.querySelector('meta[property="og:title"]')?.setAttribute(
      'content',
      'FAQ — Common Questions About MikeBuildsBooks'
    );
    document.querySelector('meta[property="og:description"]')?.setAttribute(
      'content',
      'Get answers to common questions about MikeBuildsBooks features, pricing, and how to get started.'
    );
    document.querySelector('link[rel="canonical"]')?.setAttribute(
      'href',
      'https://mikebuildsbooks.com/FAQ'
    );
    return () => {
      const s = document.getElementById('faq-jsonld');
      if (s) s.remove();
    };
  }, []);

  const [expanded, setExpanded] = useState({});

  const toggleItem = (category, index) => {
    const key = `${category}-${index}`;
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-background">
      <SkipToContent />
      <main id="main-content">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link to="/Landing" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">Find answers to common questions about MikeBuildsBooks.</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {faqs.map((section) => (
            <section key={section.category}>
              <h2 className="text-2xl font-bold text-foreground mb-4">{section.category}</h2>
              <div className="space-y-3">
                {section.items.map((item, idx) => {
                  const key = `${section.category}-${idx}`;
                  const isExpanded = expanded[key];
                  return (
                    <div key={key} className="border border-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleItem(section.category, idx)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-card/50 transition-colors"
                      >
                        <span className="text-left font-medium text-foreground pr-4">{item.q}</span>
                        <ChevronDown className={`w-5 h-5 text-primary shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      {isExpanded && (
                        <div className="px-6 py-4 bg-card/30 border-t border-border">
                          <p className="text-muted-foreground text-sm leading-relaxed">{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-card border border-border rounded-lg p-8 text-center">
          <MessageCircle className="w-10 h-10 text-primary mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Didn't find your answer?</h3>
          <p className="text-muted-foreground text-sm mb-4">Our support team is here to help.</p>
          <Link to="/contact">
            <Button variant="outline">Contact Support</Button>
          </Link>
        </div>

        {/* Internal Links for SEO */}
        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground mb-4">Related pages:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/about" className="text-primary hover:underline font-medium text-sm">
              About Us
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/contact" className="text-primary hover:underline font-medium text-sm">
              Contact
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/privacy-policy" className="text-primary hover:underline font-medium text-sm">
              Privacy Policy
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/Landing" className="text-primary hover:underline font-medium text-sm">
              Home
            </Link>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}