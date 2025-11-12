import React, { useEffect, useState } from "react";
import "./style.css";

const STATUS_ICONS = {
  ok: "✅",
  warn: "⚠️",
  error: "❌"
};

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/methods")
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Cannot connect to API");
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="loading">Evaluating security posture...</p>;
  if (error) return <p className="error">{error}</p>;
  if (data?.error) return <p className="error">{data.error}</p>;

  const user = data.user;
  const methods = data.availableMethods || [];

  // Detect Authenticator and Phone
  const authenticator = methods.filter(m => m.type === "microsoftAuthenticatorAuthenticationMethod");
  const phone = methods.find(m => m.type === "phoneAuthenticationMethod");
  const hasWHfB = data.hasWHfB;
  const hasMFA = data.hasMFA;

  // Score y progreso
  let score = 0;
  if (authenticator.length > 0) score += 60;
  if (hasMFA || phone) score += 25;
  if (hasWHfB) score += 15;
  const ready = score >= 80;

  // Pasos recomendados
  const steps = [];
  if (authenticator.length === 0) steps.push({
    id: "auth-app",
    title: "Register Microsoft Authenticator",
    desc: "Install and register Microsoft Authenticator (primary passwordless method).",
    link: "https://mysignins.microsoft.com/security-info"
  });
  if (!hasMFA && !phone) steps.push({
    id: "mfa",
    title: "Enable Multi-Factor Authentication (MFA)",
    desc: "Add an extra verification method (phone or authenticator).",
    link: "https://mysignins.microsoft.com/security-info"
  });
  if (!hasWHfB) steps.push({
    id: "whfb",
    title: "Configure Windows Hello for Business",
    desc: "Set up Windows Hello (PIN/biometrics) on your Windows device.",
    link: "https://learn.microsoft.com/windows/security/identity-protection/hello-for-business/"
  });

  const getStatusIcon = (enabled) => enabled ? STATUS_ICONS.ok : STATUS_ICONS.warn;

  return (
    <div className="page">
      <header className="header">
        <div className="branding">
          <img src="https://astara.com/themes/custom/astara/logo.svg" alt="Astara" className="logo" />
          <h1>Passwordless Readiness</h1>
        </div>
      </header>

      <main className="main">

        {/* User Info */}
        <section className="card fade-in">
          <h2>User Information</h2>
          <p>{STATUS_ICONS.ok} <strong>Name:</strong> {user.givenName || "-"} {user.surname || ""}</p>
          <p>{STATUS_ICONS.ok} <strong>UPN:</strong> {user.userPrincipalName}</p>
          {user.mail && <p>{STATUS_ICONS.ok} <strong>Email:</strong> {user.mail}</p>}
        </section>

        {/* Progress Bar */}
        <section className="card fade-in">
          <h2>Passwordless Progress</h2>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${score}%` }}>{score}%</div>
          </div>
          <p className={ready ? "ok" : "warn"}>
            {ready ? "✅ Compliant: you can sign in passwordless" : "⚙️ In progress: complete the recommended steps"}
          </p>
        </section>

        {/* Security Summary */}
        <section className="card fade-in">
          <h2>Security Summary</h2>
          <ul>
            <li>{getStatusIcon(hasMFA)} <strong>MFA:</strong> {hasMFA ? "Enabled" : "Disabled"}</li>
            <li>{getStatusIcon(authenticator.length > 0)} <strong>Authenticator App:</strong></li>
            {authenticator.map((a, idx) => (
              <ul key={idx} className="sub-list">
                <li>Device: {a.displayName || "-"}</li>
                <li>Method Type: {a.methodType || "Authenticator"}</li>
                {a.createdDateTime && <li>Registered On: {new Date(a.createdDateTime).toLocaleString()}</li>}
              </ul>
            ))}
            <li>{getStatusIcon(phone)} <strong>Phone (mobile):</strong> {phone ? `${phone.phoneNumber} (${phone.methodType || "mobile"})` : "Not registered"}</li>
            <li>{getStatusIcon(hasWHfB)} <strong>Windows Hello:</strong> {hasWHfB ? "Configured" : "Not configured"}</li>
            <li><strong>Default Sign-in Method:</strong> {methods.find(m => m.isDefault)?.type || "Unknown"}</li>
          </ul>
        </section>

        {/* Recommended Actions */}
        {!ready && (
          <section className="card fade-in">
            <h2>Recommended Actions</h2>
            <ul>
              {steps.map(s => (
                <li key={s.id} className="step">
                  <div className="step-left">
                    <strong>{s.title}</strong>
                    <div className="desc">{s.desc}</div>
                  </div>
                  <div className="step-right">
                    <a href={s.link} target="_blank" rel="noopener noreferrer" className="btn-link">Configure →</a>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Re-evaluate button */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button className="refresh" onClick={() => window.location.reload()}>Re-evaluate</button>
        </div>
      </main>
    </div>
  );
}