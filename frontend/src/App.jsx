import React, { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/methods")
      .then(res => res.json())
      .then(setData)
      .catch(() => setData({ error: "Unknown error" }));
  }, []);

  if (!data) return <p style={{textAlign:"center"}}>Loading...</p>;
  if (data.error) return <p style={{color:"red", textAlign:"center"}}>Error: {data.error}</p>;

  // Filtrar FIDO2 para no mostrarlo en availableMethods
  const availableMethods = data.availableMethods.filter(
    m => m.type.toLowerCase() !== "fido2authenticationmethod"
  );

  return (
    <div>
      <header>
        <img src="https://astara.com/themes/custom/astara/logo.svg" alt="Astara Logo" />
        <h1>Portal Passwordless</h1>
      </header>

      <div className="container">
        <h2>User Info</h2>
        <p><strong>Name:</strong> {data.user.givenName} {data.user.surname}</p>
        <p><strong>Email:</strong> {data.user.userPrincipalName}</p>
        <p><strong>MFA Enabled:</strong> {data.user.mfaEnabled ? "Yes" : "No"}</p>
        <p><strong>Windows Hello for Business:</strong> {data.user.windowsHelloEnabled ? "Yes" : "No"}</p>

        <h2>Required Authentication Method</h2>
        {availableMethods.map(m => m.type.toLowerCase() === "microsoftauthenticatorauthenticationmethod" &&
          <div key={m.type} className="method-card required">
            Authenticator Application Method
          </div>
        )}

        <h2>Alternative Authentication Method</h2>
        {data.availableMethods.some(m => m.type.toLowerCase() === "fido2authenticationmethod") &&
          <div className="method-card alternative">
            FIDO2 Security Keys Method
          </div>
        }

        <h2>Missing Passwordless Methods</h2>
        {data.missingPasswordless.map(m => {
          if (m.toLowerCase() !== "fido2authenticationmethod") {
            return <div key={m} className="method-card missing">{m}</div>;
          }
          return null;
        })}

        <h2>Recommended Actions</h2>
        <ul>
          {!data.user.mfaEnabled && <li>Enable MFA in your account</li>}
          {!data.user.windowsHelloEnabled && <li>Configure Windows Hello for Business</li>}
          {!data.availableMethods.some(m => m.type.toLowerCase() === "microsoftauthenticatorauthenticationmethod") &&
            <li>Set up Microsoft Authenticator App</li>
          }
          {!data.availableMethods.some(m => m.type.toLowerCase() === "fido2authenticationmethod") &&
            <li>Register a FIDO2 Security Key</li>
          }
        </ul>

        <button onClick={() => window.location.reload()}>Check Again</button>
      </div>
    </div>
  );
}

export default App;