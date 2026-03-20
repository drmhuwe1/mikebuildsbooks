import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-black text-white font-inter">
      <div className="border-b border-yellow-500/20 bg-black/90 sticky top-0 z-40 px-6 py-4">
        <Link to="/Landing">
          <Button variant="ghost" className="text-yellow-400 hover:text-yellow-300">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-400 mb-8">Last updated: March 20, 2026</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Acceptance of Terms</h2>
            <p>By accessing or using MikeBuildsBooks ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Description of Service</h2>
            <p>MikeBuildsBooks is a business management platform designed for construction professionals. It provides tools for job management, bid creation, contract generation, financial tracking, subcontractor management, and tax planning.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Subscription and Payments</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Access to the Service requires a paid subscription.</li>
              <li>Subscriptions are billed on a monthly or annual basis depending on your selected plan.</li>
              <li>Payments are processed securely through Stripe.</li>
              <li>You may cancel your subscription at any time. Cancellation takes effect at the end of your current billing period.</li>
              <li>We do not offer refunds for partial billing periods.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">User Responsibilities</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You agree to use the Service only for lawful business purposes.</li>
              <li>You are responsible for the accuracy of all financial and business data you enter into the Service.</li>
              <li>You must not share your account with unauthorized users.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Disclaimer of Warranties</h2>
            <p>MikeBuildsBooks is provided "as is" without warranties of any kind. We do not guarantee that the Service will be uninterrupted, error-free, or suitable for your specific business needs. The Service does not constitute legal, tax, or financial advice — always consult qualified professionals for such matters.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, MikeBuildsBooks shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including but not limited to loss of profits, data, or business opportunities.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Intellectual Property</h2>
            <p>All content, features, and functionality of MikeBuildsBooks — including software, text, graphics, and logos — are owned by MikeBuildsBooks and protected by applicable intellectual property laws. You may not copy, reproduce, or distribute any part of the Service without prior written permission.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Termination</h2>
            <p>We reserve the right to suspend or terminate your account at our discretion if you violate these Terms of Service. Upon termination, your right to access the Service will cease immediately.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Changes to Terms</h2>
            <p>We may update these Terms of Service periodically. We will notify you of significant changes via email or a prominent notice in the platform. Your continued use of the Service after changes constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
            <div className="bg-gray-900 border border-yellow-500/20 rounded-lg p-6">
              <p><strong>Email:</strong> <a href="mailto:support@mikebuildsbooks.com" className="text-yellow-400 hover:underline">support@mikebuildsbooks.com</a></p>
              <p className="mt-2"><strong>Company:</strong> MikeBuildsBooks</p>
            </div>
          </section>

          <div className="border-t border-gray-800 pt-8 mt-12 flex gap-4 text-sm">
            <Link to="/privacy-policy" className="text-yellow-400 hover:underline">Privacy Policy</Link>
            <Link to="/Landing" className="text-gray-400 hover:text-yellow-400">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}