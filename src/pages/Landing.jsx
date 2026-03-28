import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import {
  BarChart2, FileText, DollarSign, HardHat, Clock, Shield,
  ArrowRight, CheckCircle, Briefcase, Calculator, LogOut, LayoutDashboard, Zap,
  Camera, Wand2, Receipt, CalendarDays, Image, ClipboardList, RefreshCw, PackageSearch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/usePageMeta";
import SkipToContent from "@/components/landing/SkipToContent.jsx";

import InteractiveDemo from '@/components/landing/InteractiveDemo.jsx';

const features = [
  { icon: Briefcase, title: "Job Management", desc: "Track every project from bid to closeout. See real-time profit, costs, and payment status on every job — no more guessing where you stand." },
  { icon: FileText, title: "Professional Documents", desc: "Generate contracts, bids, change orders, and invoices in seconds — all branded with your logo. No Word templates, no formatting headaches." },
  { icon: Zap, title: "AI Cost & Labor Estimator", desc: "Type in a job description and let AI estimate materials, labor hours, and timeline. Break down by work phases. Perfect for concrete, roofing, framing, and more." },
  { icon: DollarSign, title: "Payout Engine", desc: "After every job, automatically calculate your tax reserve, owner payout, operating reserve, and manager pay — based on percentages you control." },
  { icon: HardHat, title: "Subcontractor & W-9 Management", desc: "Track all your 1099 subs, collect W-9s digitally or upload paper copies, and get automatic alerts when anyone hits the $600 reporting threshold." },
  { icon: Calculator, title: "Bid Builder", desc: "Build accurate, professional bids with line items for materials, labor, subs, equipment, overhead, and profit margin — then convert approved bids to contracts in one click." },
  { icon: BarChart2, title: "Full Financial Dashboard", desc: "Connect your bank via Plaid for automatic transaction sync, or log manually. Track business and personal finances separately. Stay tax-ready all year." },
  { icon: Clock, title: "Permit Drawings & Inspections", desc: "Generate permit-ready drawings for decks and roofs. Track building departments, inspector contacts, and inspection results by job." },
  { icon: Shield, title: "Tax Planning Built In", desc: "Every closed job auto-calculates a tax reserve. Export a complete tax report for your accountant at year-end — including all 1099 contractor payments." },
  { icon: Camera, title: "Photo-to-Bid AI", desc: "Snap a photo of any structure and AI instantly generates a full material list, labor breakdown, and dollar estimate. Show up to a job site and have a bid ready before you leave." },
  { icon: Wand2, title: "Bid Package Wizard", desc: "4-step guided wizard: upload a photo or blueprint, enter measurements, assign your crew, and get a complete professional bid package with timeline and specs — in under 5 minutes." },
  { icon: RefreshCw, title: "Change Orders", desc: "When the scope changes mid-job, create a professional change order in seconds. Send it to the client for digital approval — no paper, no back-and-forth." },
  { icon: CalendarDays, title: "Personal Bills Calendar", desc: "Track your personal bills on a calendar so nothing sneaks up on you. See what's due, what's paid, and what's overdue — all in one color-coded view." },
  { icon: Image, title: "Job Photos & Daily Logs", desc: "Log daily work notes and attach photos directly to each job. Keep a record of what was done, when, and by whom — great for disputes and client updates." },
  { icon: PackageSearch, title: "Live Material Price Lookup", desc: "Look up real Home Depot prices for materials while building a bid. See actual current prices so your estimates are always based on what things actually cost today." },
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
  { problem: "Bids that take hours to write", solution: "Snap a photo of the job site and let AI generate a full bid with materials and labor in seconds." },
  { problem: "Not knowing if you can afford payroll", solution: "The financial dashboard shows real cash on hand vs. upcoming bills at a glance." },
  { problem: "Permit drawings done by hand", solution: "Generate permit-ready deck and roof drawings with dimensions, materials, and specs built in." },
  { problem: "Clients asking for scope changes mid-job", solution: "Create a professional change order and send it for digital client approval — no paperwork." },
  { problem: "Personal bills piling up and getting missed", solution: "A color-coded personal bills calendar shows everything due, paid, or overdue at a glance." },
];

export default function Landing() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const { toast } = useToast();

  usePageMeta({
    title: 'MikeBuildsBooks — Construction Business Management Platform',
    description: 'MikeBuildsBooks — The all-in-one financial and operations platform for construction professionals. Track jobs, bids, contracts, payouts, and taxes in one place.',
    canonical: 'https://mikebuildsbooks.base44.app/Landing',
  });

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
    <div className="min-h-screen bg-black text-white font-inter" style={{overflowX:'hidden',maxWidth:'100vw'}}>
      <SkipToContent />
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-3 border-b border-yellow-500/20 bg-black sticky top-0 z-50" style={{backdropFilter:'blur(8px)'}}>
        <div className="flex items-center gap-3 min-w-0">
          <img
             src="https://media.base44.com/images/public/69b9774720c1d890b1162f57/77973bc53_MikeBuildsBooksLogo.png"
             alt="MikeBuildsBooks"
             width="120"
             height="30"
             className="h-7 w-auto object-contain shrink-0"
             loading="lazy"
           />
          <span className="hidden sm:block text-xs font-medium italic border-l border-yellow-500/20 pl-3"><span className="text-white">Better Books.</span> <span className="text-yellow-400">Better Builds.</span></span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isLoggedIn ? (
            <>
              <Link to="/Dashboard">
                <Button variant="outline" size="sm" className="border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10 font-semibold text-xs px-3">
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1" /> Dashboard
                </Button>
              </Link>
              <Button
                onClick={handleLogout}
                size="sm"
                className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-3 text-xs"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" /> Logout
              </Button>
            </>
          ) : (
            <a
              href="/api/auth/login"
              className="inline-flex items-center justify-center bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-4 py-1.5 rounded-md text-xs sm:text-sm transition-colors"
              aria-label="Login or Sign In to MikeBuildsBooks"
            >
              Login / Sign In
            </a>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-20 pb-24 text-center" style={{maxWidth:'100vw'}}>
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-transparent to-transparent pointer-events-none" style={{maxWidth:'100%'}} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 sm:w-[400px] sm:h-[300px] bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          {/* Logo at top with glow */}
          <div className="flex justify-center mb-8">
            <img
              src="https://media.base44.com/images/public/69b9774720c1d890b1162f57/e28d19baa_MikeBuildsBooksLogo.png"
              alt="MikeBuildsBooks — Construction Business Management Software"
              width="512"
              height="512"
              className="h-48 sm:h-64 w-auto object-contain drop-shadow-2xl"
              loading="eager"
              style={{ aspectRatio: '1/1' }}
            />
          </div>
          <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-1.5 text-yellow-400 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" /> Built for construction business owners & managers
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-4">
            MikeBuildsBooks: Construction Business Management.<br />
            <span className="text-yellow-400">Track Every Job. Every Dollar.</span>
          </h1>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto mb-8">
            MikeBuildsBooks is the all-in-one financial and operations platform for construction professionals — from bidding and contracts to payouts, subcontractors, and tax reserves.
          </p>

          {/* Primary CTA — large, unmissable */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full mb-8">
            <Button
              onClick={handleLogin}
              size="lg"
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xl px-8 sm:px-12 py-5 h-auto w-full sm:w-auto max-w-full shadow-lg shadow-yellow-400/30"
              aria-label="Get Started Free — Login or Sign Up"
            >
              Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <button
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-block w-full sm:w-auto border border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10 text-lg px-4 sm:px-8 py-4 rounded-md font-medium text-center transition-colors bg-transparent cursor-pointer"
            >
              See a Demo
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-8">No credit card required to explore. Cancel anytime.</p>
        </div>
      </section>

      {/* Pain Points */}
      <section id="main-content" className="px-6 py-16 bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">Sound Familiar?</h2>
          <p className="text-gray-300 text-center mb-12">MikeBuildsBooks solves the exact problems that cost contractors time and money every day.</p>
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

      {/* Interactive Demo — lazy loaded to improve initial bundle size */}
      <InteractiveDemo />

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
            <div className="overflow-x-auto w-full -webkit-overflow-scrolling-touch">
              <table className="w-full text-sm" style={{minWidth:'500px'}}>
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

      {/* AI Estimator Section */}
      <section className="px-6 py-16 bg-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">AI-Powered Cost & Labor Estimates</h2>
          <p className="text-gray-400 text-center mb-10">Describe a job, get instant estimates for materials, labor time, and project timeline. Perfect for concrete, roofing, framing, and more.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <Card className="bg-gray-900 border-yellow-500/20 p-6">
              <div className="flex items-start gap-3 mb-4">
                <Zap className="w-5 h-5 text-yellow-400 mt-1" />
                <div>
                  <h3 className="text-white font-semibold mb-2">How It Works</h3>
                  <ul className="text-sm text-gray-300 space-y-1.5">
                    <li>✓ Type your job (e.g., "concrete slab 20x30 ft")</li>
                    <li>✓ Enter crew size</li>
                    <li>✓ AI estimates materials & labor breakdown</li>
                    <li>✓ Review or adjust the numbers</li>
                    <li>✓ Sync directly into a bid</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="bg-gray-900 border-yellow-500/20 p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-1" />
                <div>
                  <h3 className="text-white font-semibold mb-2">What You Get</h3>
                  <ul className="text-sm text-gray-300 space-y-1.5">
                    <li>• Material cost estimates</li>
                    <li>• Labor hours by work phase</li>
                    <li>• Timeline (estimated days)</li>
                    <li>• Regional cost adjustments</li>
                    <li>• All numbers fully editable</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-6 text-center">
            <p className="text-gray-300 mb-2">No more guessing. No more spreadsheets. Just type and estimate.</p>
            <p className="text-yellow-400 font-semibold">Estimates take 10 seconds. Adjustments take seconds more.</p>
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
                {[
                  "Unlimited bids & contracts",
                  "Job & client management",
                  "Client portal",
                  "Payout engine",
                  "Quick Bid (AI plain-English estimator)",
                  "Change orders & digital client approval",
                  "Invoicing",
                  "Expense tracking & receipt uploads",
                  "Document generator (contracts, proposals)",
                  "Subcontractor management & W-9 collection",
                  "Personal bills calendar",
                  "Job calendar & timeline",
                  "Daily business assistant",
                  "Financial dashboard",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-yellow-400 shrink-0" />{f}</li>
                ))}
              </ul>
              <Button
                onClick={() => handleCheckout('starter')}
                disabled={checkoutLoading === 'starter'}
                variant="outline"
                className="w-full mt-6 border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10 max-w-full"
              >
                {checkoutLoading === 'starter' ? 'Loading...' : 'Get Started'}
              </Button>
            </Card>

            {/* Pro */}
            <Card className="bg-yellow-400 border-yellow-400 p-8 text-left relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-black text-yellow-400 text-xs font-bold px-2 py-1 rounded-full">Most Popular</div>
              <p className="text-black text-xs font-bold uppercase tracking-widest mb-2">Pro</p>
              <p className="text-4xl font-extrabold text-black mb-0.5">$79<span className="text-lg text-black/75 font-normal">/mo</span></p>
              <p className="text-xs text-black/75 mb-4">Billed monthly</p>
              <p className="text-black/80 text-sm mb-6">For growing crews with more complexity</p>
              <ul className="space-y-2 text-sm text-black">
                {[
                  "Everything in Starter",
                  "Smart Bid Builder (AI line-item builder)",
                  "Photo-to-Bid AI (snap a photo, get a full bid)",
                  "Bid Package Wizard (4-step guided wizard)",
                  "AI Estimate Builder",
                  "Live material price lookup (Home Depot)",
                  "Job photos & daily logs",
                  "Permit drawing generator (deck & roof)",
                  "Unified permit workflow",
                  "Plaid bank sync",
                  "Business & personal financial dashboards",
                  "Financial goals & scenario simulator",
                  "Financial alerts",
                  "Operations command center",
                  "1099 tracking & tax export",
                  "Advanced document generator",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-black shrink-0" />{f}</li>
                ))}
              </ul>
              <Button
                onClick={() => handleCheckout('pro')}
                disabled={checkoutLoading === 'pro'}
                className="w-full mt-6 bg-black hover:bg-gray-900 text-yellow-400 font-bold max-w-full"
              >
                {checkoutLoading === 'pro' ? 'Loading...' : 'Get Started'}
              </Button>
            </Card>

            {/* Professional */}
            <Card className="bg-gray-900 border-gray-700 p-8 text-left relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-yellow-400/10 text-yellow-400 text-xs font-bold px-2 py-1 rounded-full border border-yellow-400/30">Best Value</div>
              <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2">Professional</p>
              <p className="text-4xl font-extrabold text-white mb-0.5">$599<span className="text-lg text-gray-400 font-normal">/yr</span></p>
              <p className="text-xs text-gray-500 mb-4">Save ~$350 vs monthly — everything included</p>
              <p className="text-gray-400 text-sm mb-6">All features, no limits, billed once a year</p>
              <ul className="space-y-2 text-sm text-gray-300">
                {[
                  "Everything in Pro",
                  "Priority support",
                  "Early access to new features",
                  "Unlimited estimate & bid history",
                  "Custom labor rate library",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-yellow-400 shrink-0" />{f}</li>
                ))}
              </ul>
              <Button
                onClick={() => handleCheckout('professional')}
                disabled={checkoutLoading === 'professional'}
                variant="outline"
                className="w-full mt-6 border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10 max-w-full"
              >
                {checkoutLoading === 'professional' ? 'Loading...' : 'Get Started'}
              </Button>
            </Card>
          </div>
          <p className="text-gray-400 text-xs mt-6">Professional annual plan saves ~$349 vs Pro monthly ($79×12=$948). Cancel anytime.</p>
        </div>
      </section>

      {/* ── LEARN MORE SECTION ─────────────────────────────────────────────── */}
      <section id="learn-more" className="px-6 py-20 bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">What's New</span>
            <h2 className="text-4xl font-extrabold mb-3">Every Feature, Explained Simply</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-base">No tech jargon. No confusing terms. Here's exactly what each tool does and how it saves you time and money — written so anyone can understand it.</p>
          </div>

          <div className="space-y-6">

            {/* Photo to Bid */}
            <div className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-7 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 items-start">
              <div className="w-14 h-14 rounded-xl bg-yellow-400/10 flex items-center justify-center shrink-0">
                <Camera className="w-7 h-7 text-yellow-400" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-white text-lg font-bold">Photo-to-Bid AI</h3>
                  <span className="bg-yellow-400/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-400/30">NEW</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">
                  <strong className="text-white">Think of it like this:</strong> You pull up to a job site, take a photo of the deck, fence, or structure with your phone, and the app figures out what it would cost to build — materials, labor, everything — automatically.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">
                  You don't have to type a single thing. Just upload your photo, add rough measurements if you have them (totally optional), pick which workers you want to assign, and hit "Generate." In about 10 seconds, you get a full list of every material needed, how many hours each task will take, a day-by-day build timeline, and a total dollar amount.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  From there you can print it as a PDF, email it to the client, or sync it directly into your bid — one click and all the numbers are already filled in.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["📸 Works with any phone photo","📐 Add measurements (optional)","👷 Auto-assigns your crew","🖨️ Print or email instantly"].map(t => (
                    <span key={t} className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-700">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Blueprint Upload */}
            <div className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-7 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 items-start">
              <div className="w-14 h-14 rounded-xl bg-blue-400/10 flex items-center justify-center shrink-0">
                <Wand2 className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-white text-lg font-bold">Bid Package Wizard</h3>
                  <span className="bg-yellow-400/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-400/30">NEW</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">
                  <strong className="text-white">Think of it like this:</strong> Instead of building a bid piece by piece from scratch, this wizard walks you through 4 easy steps — like filling out a short form — and spits out a complete, professional bid package at the end.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">
                  Step 1: Upload a photo <em>or</em> a blueprint (even a hand-drawn one, or a PDF from an architect). Step 2: Enter your measurements — width, depth, height. Step 3: Pick which workers from your crew should be on this job and how many hours each will work. Step 4: Review the full bid the AI built for you — materials, labor, costs, timeline, and specs.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  The end result looks like a real contractor document, not a napkin sketch. You can print it, email it, or save it to your bids list in the app.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["📋 4-step guided wizard","🏗️ Works from photos or PDF blueprints","🧾 Generates full bid package","📅 Includes build timeline"].map(t => (
                    <span key={t} className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-700">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Material Price Lookup */}
            <div className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-7 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 items-start">
              <div className="w-14 h-14 rounded-xl bg-green-400/10 flex items-center justify-center shrink-0">
                <PackageSearch className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-white text-lg font-bold">Live Material Price Lookup</h3>
                  <span className="bg-yellow-400/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-400/30">NEW</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">
                  <strong className="text-white">Think of it like this:</strong> When you're building a bid and you type in "2x6 lumber" or "concrete mix," there's a "Verify Price" button right next to it. Click it and the app checks today's actual Home Depot prices near you — in real time.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">
                  No more guessing what lumber costs this week. No more under-bidding because prices went up since last month. The app shows you the actual product name, price, and a link to the item so you know exactly what you're quoting.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Just make sure your company zip code is entered in Settings — that's how it knows which store to look at. After that, it's one click per material item.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["🏪 Real Home Depot prices","📍 Based on your zip code","🔄 Updated in real time","✅ Click to apply price to bid"].map(t => (
                    <span key={t} className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-700">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Change Orders */}
            <div className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-7 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 items-start">
              <div className="w-14 h-14 rounded-xl bg-orange-400/10 flex items-center justify-center shrink-0">
                <RefreshCw className="w-7 h-7 text-orange-400" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-white text-lg font-bold">Change Orders</h3>
                  <span className="bg-yellow-400/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-400/30">NEW</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">
                  <strong className="text-white">Think of it like this:</strong> A client calls mid-job and says "hey, can we also add a gate to that fence?" That's extra work, and extra money. A change order is the paperwork that makes it official so you actually get paid for it.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">
                  In the app, you just click "New Change Order," describe what's being added (or removed), put in the dollar amount, and send it to the client. The client gets a link, reads it over, types their name to sign it, and clicks Approve. Done. The amount automatically gets added to the contract total.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  No more handshake deals that become arguments later. Every scope change is documented, signed, and saved permanently.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["✍️ Client signs digitally from any device","📬 Sent via email link","💰 Auto-updates contract total","📁 Saved permanently to the job"].map(t => (
                    <span key={t} className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-700">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Personal Bills Calendar */}
            <div className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-7 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 items-start">
              <div className="w-14 h-14 rounded-xl bg-purple-400/10 flex items-center justify-center shrink-0">
                <CalendarDays className="w-7 h-7 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-white text-lg font-bold">Personal Bills Calendar</h3>
                  <span className="bg-yellow-400/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-400/30">NEW</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">
                  <strong className="text-white">Think of it like this:</strong> It's like a regular wall calendar, but instead of birthdays and appointments, it shows every bill you owe — rent, car payment, insurance, electric — highlighted in color based on whether it's been paid, coming up, or past due.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">
                  Red means you're already late. Yellow means it's coming up soon. Green means you paid it. You can click any day on the calendar to quickly add a bill or mark one paid right from that screen.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  It'll also pop up a reminder automatically when something is overdue or due within the next 3 days, so nothing sneaks up on you anymore.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["📅 Color-coded calendar view","🔔 Auto reminders for overdue bills","💸 Tracks paid vs unpaid","🏠 Personal & business bills separate"].map(t => (
                    <span key={t} className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-700">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Daily Logs & Job Photos */}
            <div className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-7 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 items-start">
              <div className="w-14 h-14 rounded-xl bg-cyan-400/10 flex items-center justify-center shrink-0">
                <Image className="w-7 h-7 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-white text-lg font-bold">Job Photos & Daily Logs</h3>
                  <span className="bg-yellow-400/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-400/30">NEW</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">
                  <strong className="text-white">Think of it like this:</strong> Every day on a job site, something happens — concrete got poured, inspection passed, materials delivered. This feature is your job site diary with photos attached.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">
                  You write a quick note about what got done that day, attach photos from your phone, and it all gets saved to that specific job forever. You can also mark photos as "client visible" so they show up in the client's portal — a great way to keep homeowners updated without 50 text messages.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  If a client ever says "you didn't finish that," or a subcontractor disputes what they worked on, you've got a dated, documented record with photos to back you up.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["📷 Upload photos from phone","📝 Daily work notes per job","🏠 Share updates with client","📅 Dated and saved permanently"].map(t => (
                    <span key={t} className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-700">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Job Expense Receipts */}
            <div className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-7 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 items-start">
              <div className="w-14 h-14 rounded-xl bg-red-400/10 flex items-center justify-center shrink-0">
                <Receipt className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-white text-lg font-bold">Job Expense Receipts</h3>
                  <span className="bg-yellow-400/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-400/30">NEW</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">
                  <strong className="text-white">Think of it like this:</strong> Every time you spend money on a job — a run to Home Depot, a rental fee, a tool you bought — you take a picture of the receipt and upload it to that job right in the app. No shoebox of receipts at tax time.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">
                  Each receipt is tied to a specific job, categorized (materials, labor, fuel, tools, etc.), and tallied up automatically. Your accountant will love you for it. And when you look at a job's profitability, every penny you spent is already counted.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["📸 Photo receipts attached to jobs","🗂️ Auto-categorized expenses","💰 Counts against job profit","📊 Full ledger view at year-end"].map(t => (
                    <span key={t} className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-700">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-7 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 items-start">
              <div className="w-14 h-14 rounded-xl bg-green-400/10 flex items-center justify-center shrink-0">
                <Shield className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-white text-lg font-bold">Bank-Level Data Security</h3>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">
                  <strong className="text-white">Think of it like this:</strong> Your financial data — bank accounts, transactions, subcontractor payments, tax info — is locked to your account only. Not even other users of the app can see it. It's yours and yours alone.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">
                  Every sensitive record (bank accounts, transactions, receipts, payout history, company EIN, manager SSN) is protected by row-level security rules enforced on the server. That means even if someone found the app URL and created an account, they would see zero of your data — the database itself blocks the request before it ever returns anything.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  On top of that, all data is transmitted over HTTPS (encrypted in transit), your Plaid bank credentials are never stored in the app (Plaid handles them directly), and Stripe handles all payment processing — we never see or store your card number.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["🔒 Row-level security on all sensitive data","🏦 Plaid handles bank credentials directly","💳 Stripe processes payments (we never store cards)","🔐 HTTPS encryption on all connections"].map(t => (
                    <span key={t} className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-700">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Daily Assistant */}
            <div className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-7 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 items-start">
              <div className="w-14 h-14 rounded-xl bg-yellow-400/10 flex items-center justify-center shrink-0">
                <ClipboardList className="w-7 h-7 text-yellow-400" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-white text-lg font-bold">Daily Business Assistant</h3>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">
                  <strong className="text-white">Think of it like this:</strong> Every morning, this screen shows you exactly what needs attention today. Jobs running behind schedule, bills coming due, unpaid subcontractors, bids that are expiring — all the important stuff in one place.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">
                  It also calculates a financial health score for your business and tells you plainly whether you're in good shape or if there's something you need to deal with — like a cash flow gap coming next month.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["📋 Daily action items","💡 Business health score","⚠️ Flags problems before they blow up","📆 Weekly & monthly planning"].map(t => (
                    <span key={t} className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-700">{t}</span>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Bottom CTA nudge */}
          <div className="mt-14 bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-8 text-center">
            <p className="text-2xl font-bold text-white mb-2">All of this. One subscription.</p>
            <p className="text-gray-400 mb-6 max-w-xl mx-auto">No per-user fees. No "premium add-on" tricks. Every feature listed here is included — starting at $49/month.</p>
            <Button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-8 py-3 h-auto text-base"
            >
              See Pricing <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 bg-yellow-400 text-black text-center">
        <h2 className="text-4xl font-extrabold mb-4">Stop Losing Money to Disorganization.</h2>
        <p className="text-lg mb-3 text-black/75 max-w-xl mx-auto">Know your profit on every job. Never miss a tax reserve. Get your W-9s in order. All in one place.</p>
        <p className="text-sm mb-8 text-black/70">Secure login required — your financial data is always private and encrypted.</p>
        <div className="flex justify-center w-full">
        <Button
          onClick={handleLogin}
          size="lg"
          className="bg-black hover:bg-gray-900 text-yellow-400 font-bold text-lg px-6 sm:px-10 py-4 h-auto w-full sm:w-auto max-w-xs"
        >
          Login to Your Dashboard <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />

      {/* Sticky bottom CTA for unauthenticated visitors — ensures no dead-end page */}
      {!isLoggedIn && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 border-t border-yellow-400/30 px-4 py-3 flex items-center justify-between gap-3 sm:hidden" style={{backdropFilter:'blur(8px)'}}>
          <p className="text-xs text-gray-300 leading-tight">Construction finances, <span className="text-yellow-400 font-semibold">simplified.</span></p>
          <Button onClick={handleLogin} size="sm" className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs shrink-0 px-4">
            Get Started
          </Button>
        </div>
      )}

      {/* Cookie Consent is rendered globally in App.jsx */}
    </div>
  );
}

function LandingFooter() {
  return (
    <footer className="bg-gray-950 border-t border-yellow-500/20 px-6 py-10 text-gray-400 text-sm">
      <div className="max-w-5xl mx-auto">
        {/* Logo + nav columns */}
        <div className="flex flex-col sm:flex-row gap-8 mb-8">
          {/* Logo */}
          <div className="shrink-0">
            <img
              src="https://media.base44.com/images/public/69b9774720c1d890b1162f57/77973bc53_MikeBuildsBooksLogo.png"
              alt="MikeBuildsBooks"
              width="200"
              height="50"
              className="h-14 w-auto object-contain opacity-85"
              loading="lazy"
            />
          </div>
          {/* Nav columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 flex-1 text-sm">
            <div>
              <p className="font-semibold text-gray-300 mb-2">Product</p>
              <Link to="/Landing" className="block text-gray-400 hover:text-yellow-400 transition-colors mb-1">Home</Link>
              <Link to="/Landing" className="block text-gray-400 hover:text-yellow-400 transition-colors mb-1">Features</Link>
              <Link to="/Landing" className="block text-gray-400 hover:text-yellow-400 transition-colors">Demo</Link>
            </div>
            <div>
              <p className="font-semibold text-gray-300 mb-2">Company</p>
              <Link to="/about" className="block text-gray-400 hover:text-yellow-400 transition-colors mb-1">About Us</Link>
              <Link to="/contact" className="block text-gray-400 hover:text-yellow-400 transition-colors mb-1">Contact</Link>
              <Link to="/FAQ" className="block text-gray-400 hover:text-yellow-400 transition-colors">FAQ</Link>
            </div>
            <div>
              <p className="font-semibold text-gray-300 mb-2">Legal</p>
              <Link to="/privacy-policy" className="block text-gray-400 hover:text-yellow-400 transition-colors mb-1">Privacy Policy</Link>
              <Link to="/terms" className="block text-gray-400 hover:text-yellow-400 transition-colors">Terms of Service</Link>
            </div>
            <div>
              <p className="font-semibold text-gray-300 mb-2">Resources</p>
              <Link to="/Sitemap" className="block text-gray-400 hover:text-yellow-400 transition-colors mb-1">Sitemap</Link>
            </div>
          </div>
        </div>
        {/* Disclaimer + copyright */}
        <div className="border-t border-gray-800 pt-6 text-xs text-gray-400 space-y-2">
          <p><strong className="text-gray-400">Disclaimer:</strong> MikeBuildsBooks is a business management tool. It does not constitute legal, tax, or financial advice. Always consult a qualified professional.</p>
          <p><strong className="text-gray-400">Privacy:</strong> Your financial data is encrypted and never shared with third parties.</p>
          <p className="mt-4">© {new Date().getFullYear()} MikeBuildsBooks. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}