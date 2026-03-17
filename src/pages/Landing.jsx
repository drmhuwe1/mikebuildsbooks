import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  BarChart2, FileText, DollarSign, HardHat, Clock, Shield,
  ArrowRight, CheckCircle, Briefcase, Calculator, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  { icon: Briefcase, title: "Job Management", desc: "Track every project from bid to completion with real-time cost monitoring and profit analysis." },
  { icon: FileText, title: "Document Generator", desc: "Produce professional contracts, bids, change orders, and proposals in seconds." },
  { icon: DollarSign, title: "Payout Engine", desc: "Automatic reserve allocation — taxes, owner payout, operating reserves, and manager pay." },
  { icon: HardHat, title: "Subcontractor Tracking", desc: "Manage 1099 subcontractors, W-9 compliance, YTD payments, and payment rules." },
  { icon: Calculator, title: "Bid Builder", desc: "Build accurate bids with materials, labor, overhead, and profit margin calculations." },
  { icon: BarChart2, title: "Financial Dashboard", desc: "Real-time cash flow, bank account tracking, and bill calendar all in one place." },
];

const demoRows = [
  { job: "Kitchen Renovation – 123 Main St", revenue: "$28,500", mgr: "$950", profit: "$6,400", status: "In Progress" },
  { job: "Deck Build – 44 Oak Ave", revenue: "$12,200", mgr: "$410", profit: "$3,100", status: "Contracted" },
  { job: "Basement Finish – 8 Maple Ln", revenue: "$41,000", mgr: "$1,380", profit: "$9,800", status: "Completed" },
];

export default function Landing() {
  const handleLogin = () => {
    base44.auth.redirectToLogin("/Dashboard");
  };

  return (
    <div className="min-h-screen bg-black text-white font-inter">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-yellow-500/20 bg-black/90 sticky top-0 z-50 backdrop-blur-sm">
        <img
          src="https://media.base44.com/images/public/69b9774720c1d890b1162f57/77973bc53_MikeBuildsBooksLogo.png"
          alt="MikeBuildsBooks"
          className="h-10 w-auto object-contain"
        />
        <Button
          onClick={handleLogin}
          className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6"
        >
          Login / Sign In <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-20 pb-24 text-center">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="https://media.base44.com/images/public/69b9774720c1d890b1162f57/e28d19baa_MikeBuildsBooksLogo.png"
              alt="MikeBuildsBooks"
              className="h-48 sm:h-64 w-auto object-contain drop-shadow-2xl"
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

      {/* Features */}
      <section className="px-6 py-16 bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">Everything You Need to Run Your Business</h2>
          <p className="text-gray-400 text-center mb-12">From the first bid to the final payout — all in one secure platform.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="bg-gray-900 border-yellow-500/20 p-6 hover:border-yellow-400/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-yellow-400/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

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
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Why MikeBuildsBooks?</h2>
          <div className="space-y-4 text-left">
            {[
              "Designed specifically for construction contractors and their business managers",
              "Business managers are tracked as 1099 contractors — pay is calculated automatically",
              "All financial data is secured behind login — no sensitive info ever exposed publicly",
              "Generate client-ready contracts, bids, and proposals with one click",
              "Stay tax-ready year-round with automated reserve calculations",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-900 border border-yellow-500/10 rounded-xl px-5 py-3">
                <CheckCircle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
                <p className="text-gray-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 bg-yellow-400 text-black text-center">
        <h2 className="text-4xl font-extrabold mb-4">Ready to Take Control?</h2>
        <p className="text-lg mb-8 opacity-80">Secure login required — your financial data stays private.</p>
        <Button
          onClick={handleLogin}
          size="lg"
          className="bg-black hover:bg-gray-900 text-yellow-400 font-bold text-lg px-10 py-4 h-auto"
        >
          Login to Your Dashboard <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
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
            className="h-8 w-auto object-contain opacity-80"
          />
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <FooterLink href="#privacy">Privacy Policy</FooterLink>
            <FooterLink href="#terms">Terms of Service</FooterLink>
            <FooterLink href="#disclaimer">Disclaimer</FooterLink>
            <FooterLink href="#faq">FAQ</FooterLink>
            <FooterLink href="mailto:drmhuwe@gmail.com">Contact Us</FooterLink>
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

function FooterLink({ href, children }) {
  return (
    <a href={href} className="hover:text-yellow-400 transition-colors">{children}</a>
  );
}