// frontend/src/components/Icon.jsx
import React from "react";

export default function Icon({ name = "info", size = 18, className = "" }) {
  const style = { width: size, height: size, display: "inline-block" };

  switch (name) {
    case "check":
      return (
        <svg style={style} className={className} viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "warning":
      return (
        <svg style={style} className={className} viewBox="0 0 24 24" fill="none">
          <path d="M12 9v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 17h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    default:
      return <span style={style} className={className} aria-hidden>●</span>;
  }
}