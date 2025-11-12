// frontend/src/main.jsx
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/methods")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => setError("Cannot connect to API"));
  }, []);

  // Enviar log de progreso (opcional) cuando hay datos
  useEffect(() => {
    if (data && !data.error) {
      const hasAuthenticator = data.availableMethods.some(
        (m) => m.type === "microsoftAuthenticatorAuthenticationMethod"
      );
      const hasPhone = data.availableMethods.some(
        (m) => m.type === "phoneAuthenticationMethod"
      );
      const hasWHfB = data.hasWHfB;

      // score calc (matching frontend logic)
      let score = 0;
      if (hasAuthenticator) score += 60;
      if (data.hasMFA || hasPhone) score += 25;
      if (hasWHfB) score += 15;

      const payload = {
        user: data.user,
        score,
        hasAuthenticator,
        hasPhone,
        hasMFA: data.hasMFA,
        hasWHfB,
      };

      fetch("/api/logUserProgress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {
        /* logging failure is non-blocking */
      });
    }
  }, [data]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="loading">Evaluating security posture...</p>;
  if (data.error) return <p className="error">{data.error}</p>;

  const hasAuthenticator = data.availableMethods.some(
    (m) => m.type === "microsoftAuthenticatorAuthenticationMethod"
  );
  const hasPhone = data.availableMethods.some(
    (m) => m.type === "phoneAuthenticationMethod"
  );
  const hasWHfB = data.hasWHfB;

  // Score (ponderaciones)
  let score = 0;
  if (hasAuthenticator) score += 60;
  if (data.hasMFA || hasPhone) score += 25;
  if (hasWHfB) score += 15;
  const ready = score >= 80;

  // Pasos recomendados (sin FIDO2)
  const steps = [];
  if (!hasAuthenticator) {
    steps.push({
      id: "auth-app",
      title: "Register Microsoft Authenticator",
      desc: "Install and register Microsoft Authenticator (recommended primary passwordless method).",
      link: "https://mysignins.microsoft.com/security-info"
    });
  }
  if (!data.hasMFA && !hasPhone) {
    steps.push({
      id: "mfa",
      title: "Enable Multi-Factor Authentication (MFA)",
      desc: "Add an extra verification method (phone or authenticator).",
      link: "https://mysignins.microsoft.com/security-info"
    });
  }
  if (!hasWHfB) {
    steps.push({
      id: "whfb",
      title: "Configure Windows Hello for Business",
      desc: "Set up Windows Hello (PIN/biometrics) on your Windows device.",
      link: "https://learn.microsoft.com/windows/security/identity-protection/hello-for-business/"
    });
  }

  return (
    <div className="page">
      <header className="header">
        <div className="branding">
          <img src="https://astara.com/themes/custom/astara/logo.svg" alt="Astara" className="logo" />
          <h1>Passwordless Readiness</h1>
        </div>
        <div className="header-actions">
          <LogoutButton />
        </div>
      </header>

      <main className="main">
        <section className="card">
          <h2>User</h2>
          <p><strong>Name:</strong> {data.user.displayName}</p>
          <p><strong>UPN:</strong> {data.user.userPrincipalName}</p>
          {data.user.mail && <p><strong>Email:</strong> {data.user.mail}</p>}
        </section>

        <section className="card">
          <h2>Passwordless Progress</h2>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${score}%` }}>{score}%</div>
          </div>
          <p>
            {ready ? (
              <span className="ok">✅ Compliant: you can sign in passwordless</span>
            ) : (
              <span className="warn">⚙️ In progress: complete the recommended steps</span>
            )}
          </p>
        </section>

        <section className="card">
          <h2>Security Summary</h2>
          <ul>
            <li><strong>MFA:</strong> {data.hasMFA ? "Enabled" : "Disabled"}</li>
            <li><strong>Authenticator App:</strong> {hasAuthenticator ? "Registered" : "Not registered"}</li>
            <li><strong>Phone (mobile):</strong> {data.mfaPhone || (hasPhone ? "Registered" : "Not registered")}</li>
            <li><strong>Windows Hello:</strong> {hasWHfB ? "Configured" : "Not configured"}</li>
          </ul>
        </section>

        {!ready && (
          <section className="card">
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

        <div style={{ textAlign: "center", marginTop: 18 }}>
          <button className="refresh" onClick={() => window.location.reload()}>Re-evaluate</button>
        </div>
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);