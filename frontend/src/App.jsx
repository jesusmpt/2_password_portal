import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/methods")
      .then((res) => res.json())
      .then((info) => {
        setData(info);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Cannot connect to API");
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="loading">Evaluating security posture...</p>;
  if (error) return <p className="error">{error}</p>;
  if (data.error) return <p className="error">{data.error}</p>;

  const user = data.user || {};
  const methods = data.availableMethods || [];

  const hasAuthenticator = methods.some(
    (m) => m.type === "microsoftAuthenticatorAuthenticationMethod"
  );
  const hasPhone = methods.some((m) => m.type === "phoneAuthenticationMethod");
  const hasWHfB = data.hasWHfB;
  const hasMFA = data.hasMFA;

  // Barra de progreso ponderada
  let score = 0;
  if (hasAuthenticator) score += 60;
  if (hasMFA || hasPhone) score += 25;
  if (hasWHfB) score += 15;
  const ready = score >= 80;

  // Método por defecto
  const defaultMethod = methods.find((m) => m.isDefault);
  const recommendedPrimary = "microsoftAuthenticatorAuthenticationMethod";
  const isRecommendedDefault = defaultMethod?.type === recommendedPrimary;

  // Authenticator devices
  const authenticatorDevices = methods.filter(
    (m) => m.type === "microsoftAuthenticatorAuthenticationMethod"
  );

  // Pasos recomendados
  const steps = [];
  if (!hasAuthenticator) {
    steps.push({
      id: "auth-app",
      title: "Register Microsoft Authenticator",
      desc: "Install and register Microsoft Authenticator (recommended primary passwordless method).",
      link: "https://mysignins.microsoft.com/security-info",
    });
  }
  if (!hasMFA && !hasPhone) {
    steps.push({
      id: "mfa",
      title: "Enable Multi-Factor Authentication (MFA)",
      desc: "Add an extra verification method (phone or authenticator).",
      link: "https://mysignins.microsoft.com/security-info",
    });
  }
  if (!hasWHfB) {
    steps.push({
      id: "whfb",
      title: "Configure Windows Hello for Business",
      desc: "Set up Windows Hello (PIN/biometrics) on your Windows device.",
      link: "https://learn.microsoft.com/windows/security/identity-protection/hello-for-business/",
    });
  }

  return (
    <div className="page">
      <header className="header">
        <div className="branding">
          <img
            src="https://astara.com/themes/custom/astara/logo.svg"
            alt="Astara"
            className="logo"
          />
          <h1>Passwordless Readiness Dashboard</h1>
        </div>
      </header>

      <main className="main">
        {/* Información del usuario */}
        <section className="card fade-in">
          <h2>User Information</h2>
          <p><strong>Name:</strong> {user.givenName || "-"} {user.surname || "-"}</p>
          <p><strong>UPN:</strong> {user.userPrincipalName}</p>
          {user.mail && <p><strong>Email:</strong> {user.mail}</p>}
        </section>

        {/* Barra de progreso */}
        <section className="card fade-in">
          <h2>Passwordless Progress</h2>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${score}%` }}>
              {score}%
            </div>
          </div>
          <p className={`progress-status ${ready ? "ok" : "warn"}`}>
            {ready ? "✅ Passwordless ready" : "⚙️ In progress: complete recommended steps"}
          </p>
        </section>

        {/* Resumen de seguridad */}
        <section className="card fade-in">
          <h2>Security Summary</h2>
          <ul>
            <li>
              <strong>Default Sign-in Method:</strong> {defaultMethod ? defaultMethod.type : "Unknown"}
              {defaultMethod && (
                <span>
                  {isRecommendedDefault ? " ✅ Recommended" : " ⚠️ Consider switching to Microsoft Authenticator"}
                </span>
              )}
            </li>
            <li><strong>MFA Enabled:</strong> {hasMFA ? "Yes" : "No"}</li>
            <li>
              <strong>Authenticator App:</strong> {hasAuthenticator ? "Registered" : "Not registered"}
              {authenticatorDevices.map((a, idx) => (
                <ul key={idx} className="sub-list">
                  <li>Device: {a.displayName || "-"}</li>
                  <li>Registered On: {a.createdDateTime ? new Date(a.createdDateTime).toLocaleString() : "-"}</li>
                  <li>Notifications Enabled: {a.isNotificationEnabled ? "Yes" : "Unknown"}</li>
                </ul>
              ))}
            </li>
            <li>
                <strong>Phone (mobile):</strong>{" "}
  {hasPhone ? (
    methods.find(m => m.type === "phoneAuthenticationMethod").phoneNumber
  ) : (
    <>
      ⚠️ Not registered. Recommended to register for additional MFA options.{" "}
      <a
        href="https://mysignins.microsoft.com/security-info"
        target="_blank"
        rel="noopener noreferrer"
        className="link"
      >
        Register here
      </a>
    </>
  )}
            </li>
            <li><strong>Windows Hello:</strong> {hasWHfB ? "Configured" : "Not configured"}</li>
          </ul>
        </section>

        {/* Recomendaciones */}
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

        {/* Backup */}
        {ready && (
          <section className="card fade-in">
            <h2>Backup & Recovery</h2>
            <p>
              ✅ Passwordless ready. It's recommended to set up a backup of all authentication methods
              in case of phone loss or replacement. Learn more:{" "}
              <a href="https://learn.microsoft.com/azure/active-directory/user-help/security-info-setup" target="_blank" rel="noopener noreferrer">
                Security Info Backup
              </a>
            </p>
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