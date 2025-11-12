import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/methods")
      .then((res) => res.json())
      .then(setData)
      .catch(() => setError("Cannot connect to API"));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="loading">Loading user security profile...</p>;
  if (data.error) return <p className="error">{data.error}</p>;

  const hasAuthenticator = data.availableMethods.some(
    (m) => m.type === "microsoftAuthenticatorAuthenticationMethod"
  );
  const hasFido2 = data.availableMethods.some(
    (m) => m.type === "fido2AuthenticationMethod"
  );

  const passwordlessReady = hasAuthenticator;
  const fidoSuggestion = !hasFido2 && passwordlessReady;

  return (
    <div className="container">
      <header>
        <img
          src="https://astara.com/themes/custom/astara/logo.svg"
          alt="Astara"
          className="logo"
        />
        <h1>Passwordless Readiness Portal</h1>
      </header>

      <section className="card user">
        <h2>User Identity</h2>
        <p><strong>Name:</strong> {data.user.displayName}</p>
        <p><strong>UPN:</strong> {data.user.userPrincipalName}</p>
        {data.user.mail && <p><strong>Email:</strong> {data.user.mail}</p>}
      </section>

      <section className="card status">
        <h2>Security Overview</h2>
        <p>
          <strong>MFA Enabled:</strong>{" "}
          {data.hasMFA ? (
            <span className="ok">✅ Enabled</span>
          ) : (
            <span className="fail">❌ Disabled</span>
          )}
        </p>
        {data.mfaDevice && <p><strong>MFA Device:</strong> {data.mfaDevice}</p>}
        {data.mfaPhone && <p><strong>Phone:</strong> {data.mfaPhone}</p>}
        <p>
          <strong>Windows Hello for Business:</strong>{" "}
          {data.hasWHfB ? (
            <span className="ok">✅ Registered</span>
          ) : (
            <span className="warn">⚠️ Not configured</span>
          )}
        </p>
      </section>

      <section className="card methods">
        <h2>Authentication Methods</h2>
        <ul>
          {data.availableMethods.map((m) => (
            <li key={m.type}>
              <strong>{m.name}</strong>{" "}
              {m.phoneNumber && `(${m.phoneNumber})`}
            </li>
          ))}
        </ul>
      </section>

      <section className="card readiness">
        <h2>Passwordless Readiness</h2>
        {passwordlessReady ? (
          <p className="ok">
            ✅ Passwordless capable. Authenticator App configured.
          </p>
        ) : (
          <p className="fail">
            ❌ Missing Authenticator App. Please register it in your security
            settings.
          </p>
        )}

        {fidoSuggestion && (
          <p className="warn">
            ⚠️ Consider adding a FIDO2 Security Key for enhanced security.
          </p>
        )}
      </section>

      <button className="refresh" onClick={() => window.location.reload()}>
        Refresh
      </button>
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);