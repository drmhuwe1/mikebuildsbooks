import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Users, Zap, Award } from "lucide-react";

export default function About() {
  // Update document title & meta for SEO
  React.useEffect(() => {
    document.title = "About MikeBuildsBooks — Our Story & Values";
    document.querySelector('meta[name="description"]')?.setAttribute(
      'content',
      'Learn about MikeBuildsBooks: built by contractors for contractors. Discover our mission to simplify construction business management.'
    );
    document.querySelector('meta[property="og:title"]')?.setAttribute(
      'content',
      'About MikeBuildsBooks — Construction Business Software'
    );
    document.querySelector('meta[property="og:description"]')?.setAttribute(
      'content',
      'Built by contractors, for contractors. Learn how MikeBuildsBooks solves the biggest pain points in construction business management.'
    );
    document.querySelector('link[rel="canonical"]')?.setAttribute(
      'href',
      'https://mikebuildsbooks.base44.app/about'
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link to="/Landing" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">About MikeBuildsBooks</h1>
          <p className="text-muted-foreground">Built by contractors, for contractors.</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">

        {/* Our Story */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Our Story</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              MikeBuildsBooks was born from frustration. Mike, a construction contractor, spent every Sunday night organizing spreadsheets, chasing W-9s, and wondering where his money actually went after a job finished.
            </p>
            <p>
              He realized the problem: construction business software exists, but it's designed for accountants or big corporations — not for the actual contractor running crews, managing clients, and trying to stay profitable.
            </p>
            <p>
              So we built MikeBuildsBooks from the ground up with one goal: <strong className="text-foreground">give contractors a single platform where they can bid, contract, track costs, pay subs, and understand their profit — without logging into 5 different tools.</strong>
            </p>
          </div>
        </section>

        {/* Our Values */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Our Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: Shield, title: "Security First", desc: "Your financial data is encrypted, private, and never shared. You own your data." },
              { icon: Users, title: "Built for You", desc: "Every feature is designed by contractors. We know the job because we've done the job." },
              { icon: Zap, title: "Simple & Fast", desc: "No learning curve, no 50-page manual. If it takes more than 3 clicks, we rebuild it." },
              { icon: Award, title: "Fair Pricing", desc: "No hidden fees. No per-user charges. One price, all features — cancel anytime." },
            ].map((v) => (
              <div key={v.title} className="bg-card border border-border rounded-lg p-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <v.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Our Team */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Our Team</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            MikeBuildsBooks is built by a small team of contractors, engineers, and designers who believe that construction business owners deserve better tools. We're not a Silicon Valley startup disconnected from the field — we work with contractors daily to understand real problems and ship real solutions.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Our customers are our best teachers. Every feature, every bug fix, every improvement comes from listening to what contractors actually need to run their businesses profitably.
          </p>
        </section>

        {/* Why Construction */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Why Construction?</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Construction is the backbone of our economy, yet construction business owners often use tools built 20+ years ago or cobbled together from generic accounting software.
          </p>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-3">
            <p className="text-sm text-foreground font-semibold">The real challenges contractors face:</p>
            <ul className="text-sm text-muted-foreground space-y-2 ml-4">
              <li>• <strong className="text-foreground">Profit invisibility</strong> — Not knowing actual profit until months after a job closes</li>
              <li>• <strong className="text-foreground">Sub chaos</strong> — Scattered W-9s, payment disputes, 1099 tracking nightmares</li>
              <li>• <strong className="text-foreground">Tax surprises</strong> — Huge tax bills because no reserves were set aside during the year</li>
              <li>• <strong className="text-foreground">Broken bids</strong> — Spending hours writing bids, then forgetting what was quoted</li>
              <li>• <strong className="text-foreground">Payment tracking</strong> — Can't tell who owes what or when they're due</li>
            </ul>
          </div>
          <p className="text-muted-foreground leading-relaxed mt-4">
            MikeBuildsBooks solves every one of these. Not with complexity — with clarity.
          </p>
        </section>

        {/* CTA */}
        <section className="bg-card border border-border rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Ready to Run Your Business Better?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Join contractors who are using MikeBuildsBooks to track every dollar, understand their profit, and stop losing money to disorganization.
          </p>
          <Link to="/Landing">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Get Started Free
            </Button>
          </Link>
        </section>

      </div>
    </div>
  );
}