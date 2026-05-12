import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail, Phone, MessageSquare, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import SkipToContent from "@/components/landing/SkipToContent";

export default function Contact() {
  // Update document title & meta for SEO
  React.useEffect(() => {
    document.title = "Contact MikeBuildsBooks — Get in Touch";
    document.querySelector('meta[name="description"]')?.setAttribute(
      'content',
      'Contact the MikeBuildsBooks team. Have questions? Email us or use our contact form for support.'
    );
    document.querySelector('meta[property="og:title"]')?.setAttribute(
      'content',
      'Contact MikeBuildsBooks Support'
    );
    document.querySelector('meta[property="og:description"]')?.setAttribute(
      'content',
      'Get in touch with our team. We respond to all inquiries within 24 hours.'
    );
    document.querySelector('link[rel="canonical"]')?.setAttribute(
      'href',
      'https://mikebuildsbooks.com/contact'
    );
  }, []);

  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  // Obfuscated support email — assembled at runtime to prevent scraping
  const supportEmail = ['support', 'mikebuildsbooks.com'].join('@');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await base44.integrations.Core.SendEmail({
      to: supportEmail,
        subject: `Contact Form: ${formData.name}`,
        body: `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`,
      });
      setSubmitted(true);
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      toast({ title: "Error", description: "Could not send message. Please try again.", variant: "destructive" });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SkipToContent />
      <main id="main-content" className="outline-none" tabIndex={-1}>
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link to="/Landing" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Contact Us</h1>
          <p className="text-muted-foreground">Have a question? We'd love to hear from you.</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">

          {/* Contact Methods */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">Get in Touch</h2>

            {[
              { icon: Mail, label: "Email", value: supportEmail, href: `mailto:${supportEmail}` },
              { icon: Phone, label: "Phone", value: "Available via email", href: null },
              { icon: MessageSquare, label: "Chat", value: "In-app support for subscribers", href: null },
            ].map((contact) => (
              <div key={contact.label}>
                <div className="flex items-center gap-3 mb-2">
                  <contact.icon className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">{contact.label}</span>
                </div>
                {contact.href ? (
                  <a href={contact.href} className="text-foreground hover:text-primary font-medium">
                    {contact.value}
                  </a>
                ) : (
                  <p className="text-foreground font-medium">{contact.value}</p>
                )}
              </div>
            ))}

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">Response time: Usually within 24 hours during business days.</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-card border border-border rounded-lg p-6">
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Message Sent!</h3>
                <p className="text-muted-foreground text-sm mb-4">Thanks for reaching out. We'll get back to you soon.</p>
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="outline"
                  className="text-xs"
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-foreground mb-1">Name <span aria-hidden="true">*</span></label>
                  <Input
                    id="contact-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-foreground mb-1">Email <span aria-hidden="true">*</span></label>
                  <Input
                    id="contact-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-foreground mb-1">Message <span aria-hidden="true">*</span></label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us what's on your mind..."
                    rows={5}
                    className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    required
                    aria-required="true"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90"
                  aria-label={loading ? "Sending your message…" : "Send message"}
                >
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </form>
            )}
          </div>

        </div>

        {/* FAQ Quick Link */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-3">Didn't find what you needed?</p>
          <Link to="/FAQ">
            <Button variant="outline">View Frequently Asked Questions</Button>
          </Link>
        </div>

        {/* Internal Links for SEO */}
        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground mb-4">Other resources:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/about" className="text-primary hover:underline font-medium text-sm">
              About MikeBuildsBooks
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/FAQ" className="text-primary hover:underline font-medium text-sm">
              FAQ
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