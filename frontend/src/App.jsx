import React, { useEffect, useState } from "react";

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // -----------------------------
  // LOAD DATA FROM API
  // -----------------------------
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

  // -----------------------------
  // METHOD DETECTION
  // -----------------------------
  const hasAuthenticator = methods.some(
    (m) => m.type === "microsoftAuthenticatorAuthenticationMethod"
  );

  const hasPhone = methods.some((m) => m.type === "phoneAuthenticationMethod");

  const hasWHfB = data.hasWHfB;
  const hasMFA = data.hasMFA;

  // -----------------------------
  // PASSWORDLESS REAL VALIDATION
  // -----------------------------

  // Passwordless through Microsoft Authenticator Phone Sign-in
  const authenticatorPasswordless = methods.some(
    (m) =>
      m.type === "microsoftAuthenticatorAuthenticationMethod" &&
      m.isPhoneSignInEnabled === true
  );

  // Passwordless via Windows Hello for Business
  const whfbPasswordless = methods.some(
    (m) =>
      m.type === "windowsHelloForBusinessAuthenticationMethod" &&
      (m.keyStrength === "normal" || m.keyStrength === "strong")
  );

  const passwordlessActive = authenticatorPasswordless || whfbPasswordless;

  // -----------------------------
  // PROGRESS BAR
  // -----------------------------
  let score = 0;
  if (hasAuthenticator) score += 40;
  if (hasMFA || hasPhone) score += 20;
  if (hasWHfB) score += 40;

  const ready = passwordlessActive && hasWHfB;

  // -----------------------------
  // WINDOWS HELLO DETAILS
  // -----------------------------
  let whfbTypeText = "-";
  if (hasWHfB) {
    const whfbMethod = methods.find(
      (m) => m.type === "windowsHelloForBusinessAuthenticationMethod"
    );
    whfbTypeText =
      whfbMethod?.keyStrength ||
      whfbMethod?.credentialType ||
      "Configured";
  }

  // -----------------------------
  // DEFAULT METHOD
  // -----------------------------
  const defaultMethod = methods.find((m) => m.isDefault);
  const recommendedPrimary = "microsoftAuthenticatorAuthenticationMethod";
  const isRecommendedDefault = defaultMethod?.type === recommendedPrimary;

  // -----------------------------
  // AUTHENTICATOR DEVICES
  // -----------------------------
  const authenticatorDevices = methods.filter(
    (m) => m.type === "microsoftAuthenticatorAuthenticationMethod"
  );

  // -----------------------------
  // RECOMMENDED STEPS
  // -----------------------------
  const steps = [];

  if (!hasAuthenticator) {
    steps.push({
      id: "auth-app",
      title: "Register Microsoft Authenticator",
      desc: "Install and register Microsoft Authenticator (recommended primary passwordless method).",
      link: "https://mysignins.microsoft.com/security-info"
    });
  }

  if (!hasMFA && !hasPhone) {
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
      link:
        "https://learn.microsoft.com/windows/security/identity-protection/hello-for-business/"
    });
  }

  return (
    <div className="page">
      {/* HEADER */}
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

        {/* USER INFO */}
        <section className="card fade-in">
          <h2>User Information</h2>
          <p>
            <strong>Name:</strong> {user.givenName || "-"} {user.surname || "-"}
          </p>
          <p><strong>UPN:</strong> {user.userPrincipalName}</p>
          {user.mail && <p><strong>Email:</strong> {user.mail}</p>}
        </section>

        {/* PROGRESS BAR */}
        <section className="card fade-in">
          <h2>Passwordless Progress</h2>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${score}%` }}>
              {score}%
            </div>
          </div>

          <p className={`progress-status ${ready ? "ok" : "warn"}`}>
            {ready
              ? "🔐 Fully compliant – passwordless eligible"
              : "⚙️ In progress: complete recommended steps"}
          </p>
        </section>

        {/* SUCCESS: PASSWORDLESS ENABLED */}
        {passwordlessActive && (
          <section className="card fade-in success-banner">
            <div className="success-icon">🔒✨</div>
            <h2>Passwordless Sign-in Enabled</h2>
            <p className="success-text">
              Congratulations! You are now fully enabled for secure, passwordless
              authentication using modern, phishing-resistant technology.
            </p>

            <p className="success-subdetail">
              Active method:
              {authenticatorPasswordless && " Microsoft Authenticator Phone Sign-in"}
              {whfbPasswordless && " Windows Hello for Business"}
            </p>
          </section>
        )}

        {/* SECURITY SUMMARY */}
        <section className="card fade-in">
          <h2>Security Summary</h2>
          <ul>
            <li>
              <strong>Default Method:</strong>{" "}
              {defaultMethod ? defaultMethod.type : "Unknown"}{" "}
              {defaultMethod && (
                <span>
                  {isRecommendedDefault
                    ? " ✅ Recommended"
                    : " ⚠️ Consider switching to Microsoft Authenticator"}
                </span>
              )}
            </li>

            <li><strong>MFA Enabled:</strong> {hasMFA ? "Yes" : "No"}</li>

            <li>
              <strong>Authenticator App:</strong>{" "}
              {hasAuthenticator ? "Registered" : "Not registered"}
              {authenticatorDevices.map((a, idx) => (
                <ul key={idx} className="sub-list">
                  <li>Device: {a.displayName || "-"}</li>
                  <li>
                    Registered On:{" "}
                    {a.createdDateTime
                      ? new Date(a.createdDateTime).toLocaleString()
                      : "-"}
                  </li>
                  <li>
                    Notifications Enabled:{" "}
                    {a.isNotificationEnabled ? "Yes" : "Unknown"}
                  </li>
                </ul>
              ))}
            </li>

            <li>
              <strong>Phone (mobile):</strong>{" "}
              {hasPhone ? (
                methods.find((m) => m.type === "phoneAuthenticationMethod")
                  .phoneNumber
              ) : (
                <>
                  ⚠️ Not registered. Recommended to register for additional MFA
                  options.{" "}
                  <a
                    href="https://mysignins.microsoft.com/security-info"
                    className="link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Register here
                  </a>
                </>
              )}
            </li>

            <li>
              <strong>Windows Hello:</strong>{" "}
              {hasWHfB ? `${whfbTypeText}` : "Not configured"}
            </li>
          </ul>
        </section>

        {/* RECOMMENDED ACTIONS */}
        {!ready && (
          <section className="card fade-in">
            <h2>Recommended Actions</h2>
            <ul>
              {steps.map((s) => (
                <li key={s.id} className="step">
                  <div className="step-left">
                    <strong>{s.title}</strong>
                    <div className="desc">{s.desc}</div>
                  </div>
                  <div className="step-right">
                    <a
                      href={s.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-link"
                    >
                      Configure →
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* BACKUP */}
        {ready && (
          <section className="card fade-in">
            <h2>Backup & Recovery</h2>
            <p>
              To avoid loss of access if you change or lose your phone,
              configure a backup of your authentication methods:{" "}
              <a
                href="https://learn.microsoft.com/azure/active-directory/user-help/security-info-setup"
                target="_blank"
                rel="noopener noreferrer"
              >
                Security Info Backup
              </a>
            </p>
          </section>
        )}

        <div style={{ textAlign: "center", marginTop: 18 }}>
          <button className="refresh" onClick={() => window.location.reload()}>
            Re-evaluate
          </button>
        </div>
      </main>
    </div>
  );
}