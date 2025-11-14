// frontend/src/App.jsx
import React, { useEffect, useState, useCallback } from "react";
import Icon from "./components/Icon";
import SessionExpired from "./pages/SessionExpired";
import "./style.css";

/**
 * App.jsx - versión rectificada
 * - safeFetch: maneja 401/403 (session expired) y errores de red
 * - reintenta / recarga cuando la ventana gana foco o visibilitychange
 * - ready/paswordlessActive: validación real
 */

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  // errorType: null | 'network' | 'sessionExpired'
  const [errorType, setErrorType] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // safeFetch que detecta 401/403
  const safeFetch = useCallback(async (url, opts = {}) => {
    try {
      const res = await fetch(url, opts);
      if (res.status === 401 || res.status === 403) {
        setErrorType("sessionExpired");
        setLoading(false);
        return null;
      }
      if (!res.ok) {
        // other http errors
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setErrorType(null);
      return json;
    } catch (err) {
      // network or parse errors
      console.error("safeFetch error:", err);
      setErrorType("network");
      setErrorMessage(err.message || "Network error");
      setLoading(false);
      return null;
    }
  }, []);

  // main load function
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    const result = await safeFetch("/api/methods");
    if (result) {
      setData(result);
      setErrorType(null);
    }
    setLoading(false);
    return result;
  }, [safeFetch]);

  // initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // reload when window/tab becomes active (after login)
  useEffect(() => {
    const onFocus = () => {
      // If we had a sessionExpired or network error, try to reload
      loadData();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") loadData();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    // also poll every 90s to refresh status if desired
    const interval = setInterval(() => {
      loadData();
    }, 90000);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(interval);
    };
  }, [loadData]);

  // --- Error UI: Session expired
  if (errorType === "sessionExpired") {
    return (
      <SessionExpired
        onLogin={() => {
          // redirect to SWA / Azure login endpoint; after login user returns to /
          window.location.href = "/.auth/login/aad?post_login_redirect_url=/";
        }}
      />
    );
  }

  // network error page (with retry)
  if (errorType === "network" && !data) {
    return (
      <div className="page">
        <div className="card">
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Icon name="warning" />
            <div>
              <h2>Connection problem</h2>
              <p>We couldn't reach the service. Check your network or try again.</p>
              <p style={{ color: "#666", marginTop: 8 }}>
                {errorMessage ? `Details: ${errorMessage}` : ""}
              </p>
              <div style={{ marginTop: 12 }}>
                <button className="refresh" onClick={() => loadData()}>
                  Retry
                </button>{" "}
                <button
                  className="btn-link"
                  onClick={() => (window.location.href = "/.auth/login/aad?post_login_redirect_url=/")}
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // loading state
  if (loading) {
    return <p className="loading">Evaluating security posture...</p>;
  }

  // handle API-level error returned in data
  if (data?.error) {
    return (
      <div className="page">
        <div className="card">
          <h2>Error</h2>
          <p>{data.error}</p>
          <div style={{ marginTop: 12 }}>
            <button className="refresh" onClick={() => loadData()}>
              Re-evaluate
            </button>
            <button className="btn-link" onClick={() => (window.location.href = "/.auth/login/aad?post_login_redirect_url=/")}>
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Normal rendering with security checks

  const user = data.user || {};
  const methods = data.availableMethods || [];

  // basic detections
  const hasAuthenticator = methods.some((m) => m.type === "microsoftAuthenticatorAuthenticationMethod");
  const hasPhone = methods.some((m) => m.type === "phoneAuthenticationMethod");
  const hasWHfB = Boolean(data.hasWHfB);
  const hasMFA = Boolean(data.hasMFA);

  // REAL passwordless detection
  const authenticatorPasswordless = methods.some(
    (m) =>
      m.type === "microsoftAuthenticatorAuthenticationMethod" &&
      m.isPhoneSignInEnabled === true
  );

  const whfbPasswordless = methods.some(
    (m) =>
      m.type === "windowsHelloForBusinessAuthenticationMethod" &&
      (m.keyStrength === "normal" || m.keyStrength === "strong" || m.credentialType === "certificate")
  );

  const passwordlessActive = authenticatorPasswordless || whfbPasswordless;

  // Progress weights (WHfB mandatory policy)
  let score = 0;
  if (hasAuthenticator) score += 40;
  if (hasMFA || hasPhone) score += 20;
  if (hasWHfB) score += 40;

  // 'ready' requires passwordlessActive AND WHfB (policy)
  const ready = passwordlessActive && hasWHfB;

  // WHfB detail
  let whfbTypeText = "-";
  if (hasWHfB) {
    const whfb = methods.find((m) => m.type === "windowsHelloForBusinessAuthenticationMethod");
    whfbTypeText = whfb?.keyStrength || whfb?.credentialType || "Configured";
  }

  const defaultMethod = methods.find((m) => m.isDefault);
  const recommendedPrimary = "microsoftAuthenticatorAuthenticationMethod";
  const isRecommendedDefault = defaultMethod?.type === recommendedPrimary;

  const authenticatorDevices = methods.filter((m) => m.type === "microsoftAuthenticatorAuthenticationMethod");

  // recommended steps only if passwordlessActive is false (do not show if already active)
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

  const noActionsMessage = steps.length === 0 && !passwordlessActive;

  return (
    <div className="page">
      <header className="header">
        <div className="branding">
          <img src="https://astara.com/themes/custom/astara/logo.svg" alt="Astara" className="logo" />
          <h1>Passwordless Readiness Dashboard</h1>
        </div>
        <div>{typeof LogoutButton === "function" && <LogoutButton />}</div>
      </header>

      <main className="main">
        {/* User */}
        <section className="card">
          <h2>User Information</h2>
          <div className="user-info">
            <p><strong>Name:</strong> {user.givenName || "-"} {user.surname || "-"}</p>
            <p><strong>UPN:</strong> {user.userPrincipalName || "-"}</p>
            {user.mail && <p><strong>Email:</strong> {user.mail}</p>}
          </div>
        </section>

        {/* Progress */}
        <section className="card">
          <h2>Passwordless Progress</h2>
          <div className="progress-bar" aria-hidden>
            <div className="progress-fill" style={{ width: `${score}%` }}>{score}%</div>
          </div>

          {!ready ? (
            <p className="warn"><Icon name="warning" /> ⚙️ In progress: complete recommended steps</p>
          ) : (
            <p className="ok"><Icon name="check" /> 🎉 Congratulations — passwordless sign-in is enabled</p>
          )}
        </section>

        {/* Success banner when passwordlessActive */}
        {passwordlessActive && (
          <section className="card success-banner">
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ fontSize: 36 }}>🔒✨</div>
              <div>
                <h3 style={{ margin: 0 }}>Passwordless Sign-in Enabled</h3>
                <p style={{ marginTop: 6 }}>
                  Congratulations! Your account is enabled for passwordless authentication.
                </p>
                <p style={{ marginTop: 6, color: "#0a8f33", fontWeight: 600 }}>
                  Active method:
                  {authenticatorPasswordless && " Microsoft Authenticator (Phone Sign-in)"}
                  {whfbPasswordless && (authenticatorPasswordless ? " & Windows Hello for Business" : " Windows Hello for Business")}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Security Summary */}
        <section className="card">
          <h2>Security Summary</h2>

          <div className="auth-method">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="auth-method-title">Default Sign-in Method</div>
                <div style={{ marginTop: 6, fontWeight: 700 }}>
                  {defaultMethod ? (defaultMethod.typeReadable || defaultMethod.type) : "Unknown"}
                </div>
              </div>
              <div>
                {defaultMethod ? (
                  isRecommendedDefault ? <span className="badge badge-success">Recommended</span> : <span className="badge badge-warning">Review</span>
                ) : <span className="badge badge-info">Unknown</span>}
              </div>
            </div>
          </div>

          <div className="auth-method">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="auth-method-title">MFA Enabled</div>
                <div style={{ marginTop: 6, fontWeight: 700 }}>{hasMFA ? "Yes" : "No"}</div>
              </div>
              <div>{hasMFA ? <span className="badge badge-success">OK</span> : <span className="badge badge-warning">Recommended</span>}</div>
            </div>
          </div>

          <div className="auth-method">
            <div>
              <div className="auth-method-title">Authenticator App</div>
              <div style={{ marginTop: 8 }}>
                {hasAuthenticator ? <span className="badge badge-success">Registered</span> : <span className="badge badge-warning">Not registered</span>}
              </div>

              {authenticatorDevices.length > 0 && authenticatorDevices.map((d, i) => (
                <div key={i} style={{ marginTop: 12, padding: 12, background: "#fff", borderRadius: 8 }}>
                  <div style={{ fontWeight: 700 }}>{d.displayName || "Authenticator device"}</div>
                  <div style={{ color: "#666", marginTop: 6 }}>Device model: <strong>{d.displayName || "-"}</strong></div>
                  <div style={{ color: "#666", marginTop: 4 }}>Registered on: <strong>{d.createdDateTime ? new Date(d.createdDateTime).toLocaleString() : "-"}</strong></div>
                  <div style={{ color: "#666", marginTop: 4 }}>Notifications enabled: <strong>{d.isNotificationEnabled ? "Yes" : "Unknown"}</strong></div>
                  <div style={{ color: "#666", marginTop: 4 }}>PhoneSignIn Enabled: <strong>{d.isPhoneSignInEnabled ? "Yes" : "No"}</strong></div>
                </div>
              ))}
            </div>
          </div>

          <div className="auth-method" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="auth-method-title">Phone (mobile)</div>
              <div style={{ marginTop: 8, fontWeight: 700 }}>
                {hasPhone ? methods.find(m => m.type === "phoneAuthenticationMethod").phoneNumber : "Not registered"}
              </div>
            </div>
            <div>{hasPhone ? <span className="badge badge-success">Registered</span> : <span className="badge badge-warning">Recommended</span>}</div>
          </div>

          <div className="auth-method" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="auth-method-title">Windows Hello for Business</div>
              <div style={{ marginTop: 8, fontWeight: 700 }}>{hasWHfB ? whfbTypeText : "Not configured"}</div>
            </div>
            <div>{hasWHfB ? <span className="badge badge-success">Configured</span> : <a className="btn-link" href="https://learn.microsoft.com/windows/security/identity-protection/hello-for-business/hello-identity-verification" target="_blank" rel="noopener noreferrer">Configure WHfB</a>}</div>
          </div>
        </section>

        {/* Recommended actions - only show if not passwordlessActive */}
        <section className="card">
          <h2>Recommended Actions</h2>
          {passwordlessActive ? (
            <div style={{ padding: 16 }}>
              <p style={{ fontWeight: 700 }}>No actions required</p>
              <p style={{ color: "#444" }}>Your account currently has no recommended actions. If you think this is incorrect, click <strong>Re-evaluate</strong>.</p>
            </div>
          ) : (
            steps.map(s => (
              <div key={s.id} className="step" role="group" aria-label={s.title}>
                <div className="step-left">
                  <div style={{ fontWeight: 700 }}>{s.title}</div>
                  <div className="desc">{s.desc}</div>
                </div>
                <div className="step-right">
                  <a className="btn-link" href={s.link} target="_blank" rel="noopener noreferrer">Configure →</a>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Backup */}
        {ready && (
          <section className="card">
            <h2>Backup & Recovery</h2>
            <p>To avoid losing access if you change or lose your device, configure backups of your security info. <a href="https://learn.microsoft.com/azure/active-directory/user-help/security-info-setup" target="_blank" rel="noopener noreferrer">Learn how</a>.</p>
          </section>
        )}

        <div style={{ textAlign: "center", marginTop: 18 }}>
          <button className="refresh" onClick={() => loadData()}>Re-evaluate</button>
        </div>
      </main>
    </div>
  );
}