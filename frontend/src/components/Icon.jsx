import React from "react";

export default function Icon({ name, className = "" }) {
  const common = { className: `icon ${className}`, 'aria-hidden': true };

  switch (name) {
    case "check":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "warning":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 9v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 17h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "phone":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.86 19.86 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.86 19.86 0 013.08 4.18 2 2 0 015 2h3a2 2 0 012 1.72c.12 1.05.38 2.08.76 3.05a2 2 0 01-.45 2.11L9.91 10.9a14.5 14.5 0 006 6l1.02-1.02a2 2 0 012.11-.45c.97.38 2 .64 3.05.76A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "shield":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none">
          <path d="M12 2l7 3v5c0 5-3.4 9.7-7 11-3.6-1.3-7-6-7-11V5l7-3z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    default:
      return null;
  }
}