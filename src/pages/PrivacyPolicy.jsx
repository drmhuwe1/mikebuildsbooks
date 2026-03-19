import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-white font-inter">
      {/* Header */}
      <div className="border-b border-yellow-500/20 bg-black/90 sticky top-0 z-40 px-6 py-4">
        <Link to="/Landing">
          <Button variant="ghost" className="text-yellow-400 hover:text-yellow-300">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: March 19, 2026</p>

        <div className="space-y-8 text-gray-300">
          {/* Data Collection */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Data Collection</h2>
            <p className="mb-3">We collect the following types of information:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Account Information:</strong> Full name, email address, phone number, and business address</li>
              <li><strong>Financial Data:</strong> Job details, costs, revenues, bank transactions (via Plaid integration), and contractor payments</li>
              <li><strong>Document Data:</strong> Contracts, bids, change orders, invoices, and W-9 forms you create or upload</li>
              <li><strong>Usage Data:</strong> How you interact with the platform, pages visited, features used, and error logs</li>
              <li><strong>Device Data:</strong> Browser type, IP address, device type, and operating system</li>
            </ul>
          </section>

          {/* Data Usage */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Data Usage</h2>
            <p className="mb-3">We use your data to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Provide and maintain the platform and its features</li>
              <li>Process payments and manage your subscription</li>
              <li>Communicate with you about account changes, updates, and support</li>
              <li>Generate financial reports, tax documents, and exports</li>
              <li>Improve platform performance and security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Data Sharing</h2>
            <p className="mb-3">We may share your data with:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Payment Processors:</strong> Stripe, for subscription and payment processing</li>
              <li><strong>Bank Integrations:</strong> Plaid, to securely connect your bank accounts (read-only transactions)</li>
              <li><strong>Service Providers:</strong> Email providers, hosting providers, and analytics partners</li>
              <li><strong>Legal Requirements:</strong> Government agencies, if required by law</li>
            </ul>
            <p className="mt-3">We do <strong>not</strong> sell, rent, or share your personal data with third parties for marketing purposes.</p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Data Retention</h2>
            <p>We retain your data for as long as your account is active. After account deletion, we retain:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-3">
              <li>Anonymized financial data for tax and audit purposes (7 years)</li>
              <li>Transaction records as required by law</li>
              <li>Backup copies may be retained for up to 90 days</li>
            </ul>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Your Data Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Access:</strong> Request a copy of your data in a readable format</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and personal data (subject to legal obligations)</li>
              <li><strong>Export:</strong> Download your financial data and documents in standard formats</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from non-essential communications</li>
            </ul>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Security</h2>
            <p>We implement industry-standard security measures to protect your data:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-3">
              <li>End-to-end encryption for sensitive data</li>
              <li>Secure HTTPS connections</li>
              <li>Regular security audits and penetration testing</li>
              <li>Role-based access control</li>
              <li>Multi-factor authentication available</li>
            </ul>
            <p className="mt-3">While we strive to protect your data, no security system is 100% secure. You are responsible for keeping your password confidential.</p>
          </section>

          {/* Cookies & Tracking */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Cookies & Tracking</h2>
            <p className="mb-3">We use cookies and tracking pixels for:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Session management and authentication</li>
              <li>Analytics to understand platform usage</li>
              <li>Remembering user preferences</li>
            </ul>
            <p className="mt-3">You can manage cookie settings in your browser. Disabling cookies may affect platform functionality.</p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Third-Party Services</h2>
            <p className="mb-3">We use third-party services that have their own privacy policies:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Stripe:</strong> <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">Privacy Policy</a></li>
              <li><strong>Plaid:</strong> <a href="https://plaid.com/privacy" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">Privacy Policy</a></li>
            </ul>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
            <p className="mb-3">If you have questions about this Privacy Policy or your data, contact us:</p>
            <div className="bg-gray-900 border border-yellow-500/20 rounded-lg p-6 mt-4">
              <p><strong>Email:</strong> <a href="mailto:drmhuwe@gmail.com" className="text-yellow-400 hover:underline">drmhuwe@gmail.com</a></p>
              <p className="mt-2"><strong>Company:</strong> MikeBuildsBooks</p>
              <p className="text-sm text-gray-400 mt-4">We will respond to data requests within 30 days.</p>
            </div>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Changes to This Policy</h2>
            <p>We may update this Privacy Policy periodically. We will notify you of significant changes via email or a prominent notice on the platform. Your continued use of MikeBuildsBooks after changes constitutes acceptance of the updated policy.</p>
          </section>

          {/* Footer */}
          <div className="border-t border-gray-800 pt-8 mt-12">
            <p className="text-gray-500 text-sm">© {new Date().getFullYear()} MikeBuildsBooks. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}