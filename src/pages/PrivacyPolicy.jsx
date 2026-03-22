import React from "react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="text-muted-foreground space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Data Collection</h2>
            <p>
              MikeBuildsBooks collects the following types of information:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li><strong>Account Information:</strong> Email address, name, phone number, company details, and login credentials.</li>
              <li><strong>Project Data:</strong> Job details, client information, bids, contracts, material costs, labor rates, and financial records.</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, timestamps, IP address, and browser information (via analytics).</li>
              <li><strong>Payment Information:</strong> Billing address and transaction history (processed securely by Stripe; we do not store full credit card numbers).</li>
              <li><strong>Files and Documents:</strong> PDFs, images, and other files you upload for permits, contracts, and project documentation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Data Usage</h2>
            <p>We use your data to:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li>Provide and improve the MikeBuildsBooks platform.</li>
              <li>Process payments and send billing notifications.</li>
              <li>Send service updates, security alerts, and account notifications.</li>
              <li>Analyze usage patterns to optimize features and performance.</li>
              <li>Respond to support requests and troubleshoot issues.</li>
              <li>Comply with legal obligations and enforce our Terms of Service.</li>
              <li>Generate insights for construction estimating (anonymized, aggregated data only).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Data Sharing</h2>
            <p>
              We do <strong>not</strong> sell your personal data. We may share your data with:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li><strong>Service Providers:</strong> Payment processors (Stripe), email services, cloud hosting providers, and analytics platforms.</li>
              <li><strong>Legal Requirements:</strong> Law enforcement or government agencies if required by law.</li>
              <li><strong>Business Transfers:</strong> If MikeBuildsBooks is acquired or merged, data may be transferred as part of that transaction.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. When you delete your account, we will:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li>Delete your personal account information within 30 days.</li>
              <li>Remove project data, documents, and files.</li>
              <li>Retain anonymized aggregated data for analytics and improvement purposes.</li>
              <li>Keep transaction records for compliance and tax purposes (as required by law).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Your Rights</h2>
            <p>
              Depending on your location, you may have the right to:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal data.</li>
              <li><strong>Correction:</strong> Update or correct inaccurate data.</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data (Right to be Forgotten).</li>
              <li><strong>Portability:</strong> Receive your data in a machine-readable format.</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications.</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at <strong>support@mikebuildsbooks.com</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Security</h2>
            <p>
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li>HTTPS encryption for all data in transit.</li>
              <li>Secure password hashing and authentication.</li>
              <li>Regular security audits and updates.</li>
              <li>Access controls and role-based permissions.</li>
            </ul>
            <p className="mt-3">
              While we strive to protect your data, no system is 100% secure. You are responsible for maintaining the confidentiality of your login credentials.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Cookies & Analytics</h2>
            <p>
              We use cookies and similar tracking technologies for:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li>Session management and authentication.</li>
              <li>Remembering user preferences.</li>
              <li>Analytics to understand platform usage.</li>
            </ul>
            <p className="mt-3">
              You can control cookie preferences in your browser settings. If you disable cookies, some features may not work as expected.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Third-Party Links</h2>
            <p>
              MikeBuildsBooks may contain links to third-party websites. We are not responsible for their privacy practices. Please review their privacy policies before providing any information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Do Not Track (DNT)</h2>
            <p>
              MikeBuildsBooks respects your privacy preferences. If your browser is configured to send a Do Not Track signal, we will limit non-essential tracking (such as analytics cookies) for your session. You can also manage your cookie preferences via our cookie consent banner at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Updates to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant changes via email or in-app notification. Your continued use of MikeBuildsBooks after changes indicates your acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Contact Information</h2>
            <p>
              If you have questions or concerns about this Privacy Policy or our data practices, please contact:
            </p>
            <div className="mt-3 bg-muted p-4 rounded-lg">
              <p className="font-semibold">MikeBuildsBooks Privacy Team</p>
              <p>Email: <a href="mailto:privacy@mikebuildsbooks.com" className="text-primary hover:underline">privacy@mikebuildsbooks.com</a></p>
              <p>Support: <a href="mailto:support@mikebuildsbooks.com" className="text-primary hover:underline">support@mikebuildsbooks.com</a></p>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Last Updated: March 21, 2026
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center">
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
            <Link to="/FAQ" className="text-primary hover:underline font-medium text-sm">
              FAQ
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/terms" className="text-primary hover:underline font-medium text-sm">
              Terms of Service
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/Landing" className="text-primary hover:underline font-medium text-sm">
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}