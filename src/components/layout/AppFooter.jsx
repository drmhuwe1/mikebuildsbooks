import React from "react";
import { Link } from "react-router-dom";

export default function AppFooter() {
  return (
    <footer className="bg-gray-950 border-t border-yellow-500/20 px-6 py-10 text-gray-400 text-sm shrink-0">
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
              <Link to="/Dashboard" className="block text-gray-400 hover:text-yellow-400 transition-colors mb-1">Dashboard</Link>
              <Link to="/Jobs" className="block text-gray-400 hover:text-yellow-400 transition-colors">Jobs</Link>
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
              <p className="font-semibold text-gray-300 mb-2">Support</p>
              <a href="mailto:drmhuwe@gmail.com" className="block text-gray-400 hover:text-yellow-400 transition-colors mb-1">Email Support</a>
              <a href="https://michaeljotech.org" target="_blank" rel="noopener noreferrer" className="block text-gray-400 hover:text-yellow-400 transition-colors mb-1">Michael Jo Tech</a>
              <Link to="/Sitemap" className="block text-gray-400 hover:text-yellow-400 transition-colors mb-1">Sitemap</Link>
            </div>
          </div>
        </div>
        {/* Disclaimer + copyright */}
        <div className="border-t border-gray-800 pt-6 text-xs text-gray-500 space-y-2">
          <p><strong className="text-gray-400">Disclaimer:</strong> MikeBuildsBooks is a business management tool. It does not constitute legal, tax, or financial advice. Always consult a qualified professional.</p>
          <p><strong className="text-gray-400">Privacy:</strong> Your financial data is encrypted and never shared with third parties.</p>
          <p className="mt-4">© {new Date().getFullYear()} MikeBuildsBooks. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}