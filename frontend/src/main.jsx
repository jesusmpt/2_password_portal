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
  if (!data) return <p className="loading">Evaluando el estado de seguridad...</p>;
  if (data.error) return <p className="error">{data.error}</p>;

  const hasAuthenticator = data.availableMethods.some(
    (m) => m.type === "microsoftAuthenticatorAuthenticationMethod"
  );
  const hasFido2 = data.availableMethods.some(
    (m) => m.type === "fido2AuthenticationMethod"
  );
  const hasPhone = data.availableMethods.some(
    (m) => m.type === "phoneAuthenticationMethod"
  );
  const hasWHfB = data.hasWHfB;

  // --- Progreso Passwordless ---
  let score = 0;
  if (hasAuthenticator) score += 40;
  if (data.hasMFA || hasPhone) score += 20;
  if (hasWHfB) score += 20;
  if (hasFido2) score += 20;

  const ready = score >= 80;

  const missingSteps = [];
  if (!hasAuthenticator)
    missingSteps.push({
      name: "Registrar Authenticator App",
      desc: "Configura la aplicación Microsoft Authenticator en tu dispositivo móvil.",
      link: "https://aka.ms/mfasetup",
    });
  if (!data.hasMFA && !hasPhone)
    missingSteps.push({
      name: "Configurar MFA (Segundo factor)",
      desc: "Añade un método de verificación adicional, como teléfono o Authenticator.",
      link: "https://mysignins.microsoft.com/security-info",
    });
  if (!hasWHfB)
    missingSteps.push({
      name: "Configurar Windows Hello for Business",
      desc: "Activa la autenticación biométrica (PIN o rostro) en tu equipo Windows.",
      link: "https://learn.microsoft.com/windows/security/identity-protection/hello-for-business/",
    });
  if (!hasFido2)
    missingSteps.push({
      name: "Registrar clave de seguridad FIDO2",
      desc: "Agrega una llave física (YubiKey o similar) para un acceso 100% sin contraseña.",
      link: "https://aka.ms/mysecurityinfo",
    });

  return (
    <div className="container">
      <header>
        <img
          src="https://astara.com/themes/custom/astara/logo.svg"
          alt="Astara"
          className="logo"
        />
        <h1>Portal de Madurez Passwordless</h1>
      </header>

      <section className="card user">
        <h2>Identidad del usuario</h2>
        <p><strong>Nombre:</strong> {data.user.displayName}</p>
        <p><strong>UPN:</strong> {data.user.userPrincipalName}</p>
        {data.user.mail && <p><strong>Email:</strong> {data.user.mail}</p>}
      </section>

      <section className="card progress">
        <h2>Progreso hacia Passwordless</h2>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${score}%` }}>
            {score}%
          </div>
        </div>
        <p>
          {ready ? (
            <span className="ok">✅ Completado: Ya puedes iniciar sesión sin contraseña</span>
          ) : (
            <span className="warn">⚙️ En progreso: Completa los pasos siguientes para alcanzar el nivel Passwordless</span>
          )}
        </p>
      </section>

      {!ready && (
        <section className="card nextsteps">
          <h2>Pasos recomendados</h2>
          <ul>
            {missingSteps.map((s) => (
              <li key={s.name}>
                <strong>{s.name}</strong>: {s.desc}{" "}
                <a href={s.link} target="_blank" rel="noopener noreferrer">
                  Configurar →
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card status">
        <h2>Resumen de Seguridad</h2>
        <p><strong>MFA:</strong> {data.hasMFA ? "✅ Habilitado" : "❌ No habilitado"}</p>
        <p><strong>Authenticator:</strong> {hasAuthenticator ? "✅ Configurado" : "❌ Faltante"}</p>
        <p><strong>FIDO2:</strong> {hasFido2 ? "✅ Configurado" : "⚠️ Opcional"}</p>
        <p><strong>Windows Hello:</strong> {hasWHfB ? "✅ Activo" : "❌ No configurado"}</p>
      </section>

      <button className="refresh" onClick={() => window.location.reload()}>
        🔄 Re-evaluar
      </button>
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);