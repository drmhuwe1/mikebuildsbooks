import React from "react";

export default function AppFooter() {
  return (
    <footer className="border-t border-border bg-card text-xs text-muted-foreground px-6 py-4 shrink-0">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© {new Date().getFullYear()} MikeBuildsBooks. All rights reserved.</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
          <FooterLink href="mailto:drmhuwe@gmail.com">Contact</FooterLink>
          <FooterLink href="#privacy">Privacy Policy</FooterLink>
          <FooterLink href="#terms">Terms of Service</FooterLink>
          <FooterLink href="#disclaimer">Disclaimer</FooterLink>
          <FooterLink href="#faq">FAQ</FooterLink>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }) {
  return (
    <a href={href} className="hover:text-yellow-500 hover:underline transition-colors">
      {children}
    </a>
  );
}