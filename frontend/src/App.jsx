import React, { useEffect, useState } from "react";
import Icon from "./components/Icon";

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
  if (data?.error) return <p className="error">{data.error}</p>;

  const user = data.user || {};
  const methods = data.availableMethods || [];

  // detecciones básicas
  const hasAuthenticator = methods.some(m => m.type === "microsoftAuthenticatorAuthenticationMethod");
  const hasPhone = methods.some(m => m.type === "phoneAuthenticationMethod");
  const hasWHfB = data.hasWHfB;
  const hasMFA = data.hasMFA;

  // DETECCIÓN REAL de passwordless
  const authenticatorPasswordless = methods.some(
    (m) =>
      m.type === "microsoftAuthenticatorAuthenticationMethod" &&
      // some Graph objects use isPhoneSignInEnabled, fallback unknown => treat as false
      (m.isPhoneSignInEnabled === true)
  );

  const whfbPasswordless = methods.some(
    (m) =>
      m.type === "windowsHelloForBusinessAuthenticationMethod" &&
      (m.keyStrength === "normal" || m.keyStrength === "strong" || m.credentialType === "certificate")
  );

  const passwordlessActive = authenticatorPasswordless || whfbPasswordless;

  // progreso: pesos (WHfB obligatorio para ready)
  let score = 0;
  if (hasAuthenticator) score += 40;
  if (hasMFA || hasPhone) score += 20;
  if (hasWHfB) score += 40;

  const ready = passwordlessActive && hasWHfB;

  // WHfB type text
  let whfbTypeText = "-";
  if (hasWHfB) {
    const whfb = methods.find(m => m.type === "windowsHelloForBusinessAuthenticationMethod");
    whfbTypeText = whfb?.keyStrength || whfb?.credentialType || "Configured";
  }

  // default method
  const defaultMethod = methods.find(m => m.isDefault);
  const recommendedPrimary = "microsoftAuthenticatorAuthenticationMethod";
  const isRecommendedDefault = defaultMethod?.type === recommendedPrimary;

  // authenticator devices list
  const authenticatorDevices = methods.filter(m => m.type === "microsoftAuthenticatorAuthenticationMethod");

  // recommended steps
  const steps = [];
  if (!hasAuthenticator) steps.push({
    id: "auth-app",
    title: "Register Microsoft Authenticator",
    desc: "Install and register Microsoft Authenticator (recommended primary passwordless method).",
    link: "https://mysignins.microsoft.com/security-info"
  });
  if (!hasMFA && !hasPhone) steps.push({
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

  // if no steps -> show friendly english message
  const noActionsMessage = steps.length === 0;

  return (
    <div className="page">
      <header className="header">
        <div className="branding">
          <img src="https://astara.com/themes/custom/astara/logo.svg" alt="Astara" className="logo" />
          <h1>Passwordless Readiness Dashboard</h1>
        </div>
        <div>
          <LogoutButton />
        </div>
      </header>

      <main className="main">

        {/* user card */}
        <section className="card">
          <h2>User Information</h2>
          <div className="user-info">
            <p><strong>Name:</strong> {user.givenName || "-"} {user.surname || "-"}</p>
            <p><strong>UPN:</strong> {user.userPrincipalName || "-"}</p>
            {user.mail && <p><strong>Email:</strong> {user.mail}</p>}
          </div>
        </section>

        {/* progress */}
        <section className="card">
          <h2>Passwordless Progress</h2>
          <div className="progress-bar" aria-hidden>
            <div className="progress-fill" style={{ width: `${score}%` }}>
              {score}%
            </div>
          </div>

          {!ready ? (
            <p className="warn"><Icon name="shield" /> ⚙️ In progress: complete recommended steps</p>
          ) : (
            <p className="ok"><Icon name="check" /> 🎉 Congratulations — passwordless sign-in is enabled</p>
          )}
        </section>

        {/* success banner when passwordless active */}
        {passwordlessActive && (
          <section className="card success-banner">
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:36}}>🔒✨</div>
              <div>
                <h3 style={{marginBottom:6}}>Passwordless Sign-in Enabled</h3>
                <p style={{margin:0}}>
                  Congratulations! You are now enabled for secure, passwordless authentication.
                </p>
                <p style={{margin: "6px 0 0 0", color:"#0a8f33", fontWeight:600}}>
                  Active method:
                  {authenticatorPasswordless && " Microsoft Authenticator (Phone Sign-in)"}
                  {whfbPasswordless && (authenticatorPasswordless ? " & Windows Hello for Business" : " Windows Hello for Business")}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* security summary - improved visual */}
        <section className="card">
          <h2>Security Summary</h2>

          <div className="auth-method">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div className="auth-method-title">Default Sign-in Method</div>
                <div style={{color:"#333", marginTop:6, fontWeight:600}}>
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
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div className="auth-method-title">MFA Enabled</div>
                <div style={{marginTop:6, fontWeight:600}}>{hasMFA ? "Yes" : "No"}</div>
              </div>
              <div>
                {hasMFA ? <span className="badge badge-success">OK</span> : <span className="badge badge-warning">Recommended</span>}
              </div>
            </div>
          </div>

          <div className="auth-method">
            <div>
              <div className="auth-method-title">Authenticator App</div>
              <div style={{marginTop:8}}>
                {hasAuthenticator ? <span className="badge badge-success">Registered</span> : <span className="badge badge-warning">Not registered</span>}
              </div>

              {authenticatorDevices.length > 0 && authenticatorDevices.map((d, i) => (
                <div key={i} style={{marginTop:12, padding:12, background:"#fff", borderRadius:8, boxShadow:"inset 0 1px 0 rgba(0,0,0,0.02)"}}>
                  <div style={{fontWeight:700}}>{d.displayName || "Authenticator device"}</div>
                  <div style={{color:"#666", marginTop:6}}>Device model: <strong>{d.displayName || "-"}</strong></div>
                  <div style={{color:"#666", marginTop:4}}>Registered on: <strong>{d.createdDateTime ? new Date(d.createdDateTime).toLocaleString() : "-"}</strong></div>
                  <div style={{color:"#666", marginTop:4}}>Notifications enabled: <strong>{d.isNotificationEnabled ? "Yes" : "Unknown"}</strong></div>
                  <div style={{color:"#666", marginTop:4}}>PhoneSignIn Enabled: <strong>{d.isPhoneSignInEnabled ? "Yes" : "No"}</strong></div>
                </div>
              ))}
            </div>
          </div>

          <div className="auth-method" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div className="auth-method-title">Phone (mobile)</div>
              <div style={{marginTop:8, fontWeight:700}}>
                {hasPhone ? methods.find(m => m.type === "phoneAuthenticationMethod").phoneNumber : "Not registered"}
              </div>
            </div>
            <div>
              {hasPhone ? <span className="badge badge-success">Registered</span> : <span className="badge badge-warning">Recommended</span>}
            </div>
          </div>

          <div className="auth-method" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div className="auth-method-title">Windows Hello for Business</div>
              <div style={{marginTop:8,fontWeight:700}}>{hasWHfB ? whfbTypeText : "Not configured"}</div>
            </div>
            <div>
              {hasWHfB ? <span className="badge badge-success">Configured</span> : <a className="btn-link" href="https://learn.microsoft.com/windows/security/identity-protection/hello-for-business/hello-identity-verification" target="_blank" rel="noreferrer">Configure WHfB</a>}
            </div>
          </div>
        </section>

        {/* recommended actions */}
        <section className="card">
          <h2>Recommended Actions</h2>

          {noActionsMessage ? (
            <div style={{padding:16}}>
              <p style={{fontWeight:700}}>No actions required</p>
              <p style={{color:"#444"}}>Your account currently has no recommended actions. If you think this is incorrect, click <strong>Re-evaluate</strong>.</p>
            </div>
          ) : (
            steps.map(s => (
              <div key={s.id} className="step" role="group" aria-label={s.title}>
                <div className="step-left">
                  <div style={{fontWeight:700}}>{s.title}</div>
                  <div className="desc">{s.desc}</div>
                </div>
                <div className="step-right">
                  <a className="btn-link" href={s.link} target="_blank" rel="noreferrer">Configure →</a>
                </div>
              </div>
            ))
          )}
        </section>

        {/* backup */}
        {ready && (
          <section className="card">
            <h2>Backup & Recovery</h2>
            <p>To avoid losing access if you change or lose your device, follow the recommended backup steps for security info. <a href="https://learn.microsoft.com/azure/active-directory/user-help/security-info-setup" target="_blank" rel="noreferrer">Learn how to backup recovery methods</a>.</p>
          </section>
        )}

        <div style={{textAlign:"center", marginTop:18}}>
          <button className="refresh" onClick={() => window.location.reload()}>Re-evaluate</button>
        </div>
      </main>
    </div>
  );
}

// small helper Icon wrapper to support inline Icon usage in JSX
function Icon({ name }) {
  // simple inline icons or reuse the Icon component file above
  // here we inline minimal shapes to avoid additional imports
  if (name === "check") return <svg className="icon" viewBox="0 0 24 24" width="18" height="18"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (name === "shield") return <svg className="icon" viewBox="0 0 24 24" width="18" height="18"><path d="M12 2l7 3v5c0 5-3.4 9.7-7 11-3.6-1.3-7-6-7-11V5l7-3z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>;
  return null;
}