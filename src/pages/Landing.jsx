import React, { useState, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import {
  BarChart2, FileText, DollarSign, HardHat, Clock, Shield,
  ArrowRight, CheckCircle, Briefcase, Calculator, LogOut, LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CookieConsent from "@/components/landing/CookieConsent.jsx";
import SkipToContent from "@/components/landing/SkipToContent.jsx";

const InteractiveDemo = lazy(() => import("@/components/landing/InteractiveDemo"));

const features = [
  { icon: Briefcase, title: "Job Management", desc: "Track every project from bid to closeout. See real-time profit, costs, and payment status on every job — no more guessing where you stand." },
  { icon: FileText, title: "Professional Documents", desc: "Generate contracts, bids, change orders, and invoices in seconds — all branded with your logo. No Word templates, no formatting headaches." },
  { icon: DollarSign, title: "Payout Engine", desc: "After every job, automatically calculate your tax reserve, owner payout, operating reserve, and manager pay — based on percentages you control." },
  { icon: HardHat, title: "Subcontractor & W-9 Management", desc: "Track all your 1099 subs, collect W-9s digitally or upload paper copies, and get automatic alerts when anyone hits the $600 reporting threshold." },
  { icon: Calculator, title: "Bid Builder", desc: "Build accurate, professional bids with line items for materials, labor, subs, equipment, overhead, and profit margin — then convert approved bids to contracts in one click." },
  { icon: BarChart2, title: "Full Financial Dashboard", desc: "Connect your bank via Plaid for automatic transaction sync, or log manually. Track business and personal finances separately. Stay tax-ready all year." },
  { icon: Clock, title: "Permit Drawings & Inspections", desc: "Generate permit-ready drawings for decks and roofs. Track building departments, inspector contacts, and inspection results by job." },
  { icon: Shield, title: "Tax Planning Built In", desc: "Every closed job auto-calculates a tax reserve. Export a complete tax report for your accountant at year-end — including all 1099 contractor payments." },
];

const demoRows = [
  { job: "Kitchen Renovation – 123 Main St", revenue: "$28,500", mgr: "$950", profit: "$6,400", status: "In Progress" },
  { job: "Deck Build – 44 Oak Ave", revenue: "$12,200", mgr: "$410", profit: "$3,100", status: "Contracted" },
  { job: "Basement Finish – 8 Maple Ln", revenue: "$41,000", mgr: "$1,380", profit: "$9,800", status: "Completed" },
];

const painPoints = [
  { problem: "Losing track of job profits", solution: "Every job shows real-time revenue vs. cost vs. profit — no spreadsheets needed." },
  { problem: "Forgetting to set aside taxes", solution: "Tax reserves are calculated automatically every time a job closes." },
  { problem: "Chasing down W-9s from subs", solution: "Send a digital W-9 form directly from the app — subs fill it out and sign online." },
  { problem: "Bids that take hours to write", solution: "Build a complete bid with materials, labor, overhead, and profit in minutes." },
  { problem: "Not knowing if you can afford payroll", solution: "The financial dashboard shows real cash on hand vs. upcoming bills at a glance." },
  { problem: "Permit drawings done by hand", solution: "Generate permit-ready deck and roof drawings with dimensions, materials, and specs built in." },
];

export default function Landing() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    base44.auth.isAuthenticated().then(setIsLoggedIn);
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  const handleLogout = () => {
    base44.auth.logout("/Landing");
  };

  const handleCheckout = async (plan) => {
    // Block checkout inside iframe (preview mode)
    if (window.self !== window.top) {
      toast({ title: "Checkout unavailable in preview", description: "Please open the published app to subscribe.", variant: "destructive" });
      return;
    }
    if (!isLoggedIn) {
      base44.auth.redirectToLogin();
      return;
    }
    setCheckoutLoading(plan);
    const response = await base44.functions.invoke('stripeCheckout', { plan });
    setCheckoutLoading(null);
    if (response.data?.url) {
      window.location.href = response.data.url;
    } else {
      toast({ title: "Error", description: response.data?.error || "Could not start checkout.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white font-inter">
      <SkipToContent />
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-yellow-500/20 bg-black/90 sticky top-0 z-50 backdrop-blur-sm">
        <img
           src="https://media.base44.com/images/public/69b9774720c1d890b1162f57/77973bc53_MikeBuildsBooksLogo.png"
           alt="MikeBuildsBooks"
           width="256"
           height="64"
           className="h-10 w-auto object-contain"
           loading="lazy"
           style={{ aspectRatio: '4/1' }}
         />
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link to="/Dashboard">
                <Button variant="outline" className="border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10 font-semibold">
                  <LayoutDashboard className="w-4 h-4 mr-1.5" /> Go to Dashboard
                </Button>
              </Link>
              <Button
                onClick={handleLogout}
                className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6"
              >
                <LogOut className="w-4 h-4 mr-1.5" /> Logout
              </Button>
            </>
          ) : (
            <Button
              onClick={handleLogin}
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6"
            >
              Login / Sign In <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-20 pb-24 text-center">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 sm:w-[500px] sm:h-[400px] bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="https://media.base44.com/images/public/69b9774720c1d890b1162f57/e28d19baa_MikeBuildsBooksLogo.png"
              alt="MikeBuildsBooks"
              width="512"
              height="512"
              className="h-48 sm:h-64 w-auto object-contain drop-shadow-2xl"
              loading="lazy"
              style={{ aspectRatio: '1/1' }}
            />
          </div>
          <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-1.5 text-yellow-400 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" /> Built for construction business owners & managers
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-4">
            Build Your Business.<br />
            <span className="text-yellow-400">Track Every Dollar.</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            MikeBuildsBooks is the all-in-one financial and operations platform for construction professionals — from bidding and contracts to payouts, subcontractors, and tax reserves.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleLogin}
              size="lg"
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-lg px-8 py-4 h-auto"
            >
              Get Started <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <a href="#demo">
              <Button size="lg" variant="outline" className="border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10 text-lg px-8 py-4 h-auto w-full sm:w-auto">
                See a Demo
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section id="main-content" className="px-6 py-16 bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">Sound Familiar?</h2>
          <p className="text-gray-400 text-center mb-12">MikeBuildsBooks solves the exact problems that cost contractors time and money every day.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {painPoints.map((p, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-red-400 text-sm font-semibold mb-1">❌ &nbsp;{p.problem}</p>
                <p className="text-green-400 text-sm">✅ &nbsp;{p.solution}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 bg-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">Everything You Need to Run Your Business</h2>
          <p className="text-gray-400 text-center mb-12">From the first bid to the final payout — one platform built specifically for construction.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <Card key={f.title} className="bg-gray-900 border-yellow-500/20 p-5 hover:border-yellow-400/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-yellow-400/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="text-white font-semibold mb-2 text-sm">{f.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <Suspense fallback={<div className="px-6 py-20 bg-gray-950 text-center text-gray-400">Loading demo...</div>}>
        <InteractiveDemo />
      </Suspense>

      {/* Demo Section */}
      <section id="demo" className="px-6 py-16 bg-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">See It In Action</h2>
          <p className="text-gray-400 text-center mb-10">Here's an example of how the Payout Engine distributes profits across your jobs.</p>

          {/* Demo table */}
          <div className="bg-gray-900 rounded-2xl border border-yellow-500/20 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-yellow-500/10 flex items-center gap-3">
              <BarChart2 className="w-4 h-4 text-yellow-400" />
              <span className="font-semibold text-sm text-yellow-400">Payout Engine — Sample Breakdown</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase border-b border-gray-800">
                    <th className="text-left px-6 py-3">Job</th>
                    <th className="text-right px-4 py-3">Revenue</th>
                    <th className="text-right px-4 py-3">Mgr Pay (10%)</th>
                    <th className="text-right px-4 py-3">Net Profit</th>
                    <th className="text-right px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {demoRows.map((r, i) => (
                    <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-white">{r.job}</td>
                      <td className="px-4 py-3 text-right text-gray-300">{r.revenue}</td>
                      <td className="px-4 py-3 text-right text-yellow-400 font-semibold">{r.mgr}</td>
                      <td className="px-4 py-3 text-right text-green-400 font-semibold">{r.profit}</td>
                      <td className="px-6 py-3 text-right">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Tax Reserve (25%)", val: "$4,825", color: "text-red-400" },
              { label: "Owner Payout (30%)", val: "$5,790", color: "text-green-400" },
              { label: "Operating Reserve (10%)", val: "$1,930", color: "text-blue-400" },
              { label: "Retained Earnings (10%)", val: "$1,930", color: "text-purple-400" },
            ].map(item => (
              <div key={item.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                <p className={`text-xl font-bold ${item.color}`}>{item.val}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why section */}
      <section className="px-6 py-16 bg-gray-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Built By a Contractor. For Contractors.</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Most accounting software is designed for desk jobs. MikeBuildsBooks is built around how construction businesses actually work — jobs, subs, permits, and payouts.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {[
              "Designed specifically for construction contractors and their business managers",
              "Business managers are tracked as 1099 contractors — pay is calculated automatically from profit",
              "All financial data is secured behind login — no sensitive info ever exposed publicly",
              "Generate client-ready contracts, bids, change orders, and invoices with one click",
              "Stay tax-ready year-round with automated reserve calculations on every closed job",
              "Connect real bank accounts via Plaid for automatic transaction syncing and categorization",
              "Collect W-9s digitally — subs sign on any device, no paper, no chasing",
              "Generate permit drawings for decks and roofs — no AutoCAD required",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-900 border border-yellow-500/10 rounded-xl px-5 py-3">
                <CheckCircle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
                <p className="text-gray-300 text-sm">{item}</p>
              </div>
            ))}
          </div>

          {/* Testimonial-style quote placeholder */}
          <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-2xl p-8 text-center">
          <p className="text-xl text-white font-medium italic mb-4">"I used to spend Sunday nights doing bookkeeping. Now I close a job, hit the payout button, and I know exactly where every dollar goes."</p>
          <p className="text-yellow-400 text-sm font-semibold">— Mike, Construction Business Owner</p>
          </div>

          {/* Cookie Consent Banner */}
          <CookieConsent />
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="px-6 py-16 bg-black">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3">Simple, Transparent Pricing</h2>
          <p className="text-gray-400 mb-8">No per-user fees. No surprise charges. Cancel anytime.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Starter */}
            <Card className="bg-gray-900 border-gray-700 p-8 text-left">
              <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2">Starter</p>
              <p className="text-4xl font-extrabold text-white mb-0.5">$49<span className="text-lg text-gray-400 font-normal">/mo</span></p>
              <p className="text-xs text-gray-500 mb-4">Billed monthly</p>
              <p className="text-gray-400 text-sm mb-6">For solo contractors getting organized</p>
              <ul className="space-y-2 text-sm text-gray-300">
                {["Unlimited bids & contracts", "Job & client management", "Payout engine", "Document generator", "Financial dashboard"].map(f => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-yellow-400 shrink-0" />{f}</li>
                ))}
              </ul>
              <Button
                onClick={() => handleCheckout('starter')}
                disabled={checkoutLoading === 'starter'}
                variant="outline"
                className="w-full mt-6 border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10"
              >
                {checkoutLoading === 'starter' ? 'Loading...' : 'Get Started'}
              </Button>
            </Card>

            {/* Pro */}
            <Card className="bg-yellow-400 border-yellow-400 p-8 text-left relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-black text-yellow-400 text-xs font-bold px-2 py-1 rounded-full">Most Popular</div>
              <p className="text-black text-xs font-bold uppercase tracking-widest mb-2">Pro</p>
              <p className="text-4xl font-extrabold text-black mb-0.5">$79<span className="text-lg text-black/60 font-normal">/mo</span></p>
              <p className="text-xs text-black/50 mb-4">Billed monthly</p>
              <p className="text-black/70 text-sm mb-6">For growing crews with more complexity</p>
              <ul className="space-y-2 text-sm text-black">
                {["Everything in Starter", "Plaid bank sync", "W-9 digital collection", "Permit drawing generator", "1099 tracking & tax export", "Financial scenario simulator"].map(f => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-black shrink-0" />{f}</li>
                ))}
              </ul>
              <Button
                onClick={() => handleCheckout('pro')}
                disabled={checkoutLoading === 'pro'}
                className="w-full mt-6 bg-black hover:bg-gray-900 text-yellow-400 font-bold"
              >
                {checkoutLoading === 'pro' ? 'Loading...' : 'Get Started'}
              </Button>
            </Card>

            {/* Professional */}
            <Card className="bg-gray-900 border-gray-700 p-8 text-left relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-yellow-400/10 text-yellow-400 text-xs font-bold px-2 py-1 rounded-full border border-yellow-400/30">Best Value</div>
              <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2">Professional</p>
              <p className="text-4xl font-extrabold text-white mb-0.5">$499<span className="text-lg text-gray-400 font-normal">/yr</span></p>
              <p className="text-xs text-gray-500 mb-4">One flat annual price — everything included</p>
              <p className="text-gray-400 text-sm mb-6">All features, no limits, billed once a year</p>
              <ul className="space-y-2 text-sm text-gray-300">
                {["Everything in Pro", "Plaid bank sync", "W-9 digital collection", "Permit drawing generator", "1099 tracking & tax export", "Financial scenario simulator", "Priority support", "Early access to new features"].map(f => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-yellow-400 shrink-0" />{f}</li>
                ))}
              </ul>
              <Button
                onClick={() => handleCheckout('professional')}
                disabled={checkoutLoading === 'professional'}
                variant="outline"
                className="w-full mt-6 border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10"
              >
                {checkoutLoading === 'professional' ? 'Loading...' : 'Get Started'}
              </Button>
            </Card>
          </div>
          <p className="text-gray-500 text-xs mt-6">All plans include a subscription. Cancel anytime.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 bg-yellow-400 text-black text-center">
        <h2 className="text-4xl font-extrabold mb-4">Stop Losing Money to Disorganization.</h2>
        <p className="text-lg mb-3 opacity-80 max-w-xl mx-auto">Know your profit on every job. Never miss a tax reserve. Get your W-9s in order. All in one place.</p>
        <p className="text-sm mb-8 opacity-60">Secure login required — your financial data is always private and encrypted.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleLogin}
            size="lg"
            className="bg-black hover:bg-gray-900 text-yellow-400 font-bold text-lg px-10 py-4 h-auto"
          >
            Login to Your Dashboard <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}

function LandingFooter() {
  return (
    <footer className="bg-gray-950 border-t border-yellow-500/20 px-6 py-10 text-gray-400 text-sm">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
          <img
            src="https://media.base44.com/images/public/69b9774720c1d890b1162f57/77973bc53_MikeBuildsBooksLogo.png"
            alt="MikeBuildsBooks"
            width="256"
            height="64"
            className="h-8 w-auto object-contain opacity-80"
            loading="lazy"
            style={{ aspectRatio: '4/1' }}
          />
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/privacy-policy" className="hover:text-yellow-400 transition-colors">Privacy Policy</Link>
            <a href="mailto:contact&#64;mikebuildsbooks&#46;com" className="hover:text-yellow-400 transition-colors">Contact Us</a>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 text-xs text-gray-500 space-y-2">
          <p><strong className="text-gray-400">Disclaimer:</strong> MikeBuildsBooks is a business management tool. It does not constitute legal, tax, or financial advice. Always consult a qualified professional.</p>
          <p><strong className="text-gray-400">Privacy:</strong> Your financial data is encrypted and never shared with third parties.</p>
          <p className="mt-4">© {new Date().getFullYear()} MikeBuildsBooks. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}