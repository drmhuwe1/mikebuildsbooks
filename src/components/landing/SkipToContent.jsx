import React from "react";

export default function SkipToContent() {
  const handleClick = (e) => {
    e.preventDefault();
    const target = document.getElementById('main-content');
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-yellow-400 focus:text-black focus:rounded focus:font-semibold focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-black"
    >
      Skip to main content
    </a>
  );
}