// frontend/src/pages/SessionExpired.jsx
import React from "react";
import Icon from "../components/Icon";

export default function SessionExpired({ onLogin }) {
  return (
    <div className="page">
      <div className="card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🔒</div>
        <h2>Your session expired</h2>
        <p style={{ color: "#666", marginTop: 8 }}>
          For security reasons your session has ended. Please sign in again to continue.
        </p>

        <div style={{ marginTop: 18, display: "flex", justifyContent: "center", gap: 12 }}>
          <button
            className="refresh"
            onClick={() => {
              // Redirect to SWA / Entra login
              window.location.href = "/.auth/login/aad?post_login_redirect_url=/";
              if (typeof onLogin === "function") onLogin();
            }}
          >
            Sign in
          </button>

          <a className="btn-link" href="/" onClick={() => window.location.reload()}>
            Reload
          </a>
        </div>
      </div>
    </div>
  );
}