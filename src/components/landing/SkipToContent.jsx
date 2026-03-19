import React from "react";

export default function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-yellow-400 focus:text-black focus:rounded focus:font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-600"
    >
      Skip to main content
    </a>
  );
}