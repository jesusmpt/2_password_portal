import React, { useEffect, useState } from "react";

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/methods")
      .then((res) => res.json())
      .then((info) => {
        setData(info);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setData({ error: "Unable to fetch data" });
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-8 text-gray-700">Loading...</p>;
  if (data?.error)
    return <p className="p-8 text-red-600">Error: {data.error}</p>;

  const user = data.user || {};
  const methods = data.availableMethods || [];

  // Detectar métodos
  const authenticator = methods.find(
    (m) => m.type === "microsoftAuthenticatorAuthenticationMethod"
  );
  const phone = methods.find((m) => m.type === "phoneAuthenticationMethod");
  const password = methods.find((m) => m.type === "passwordAuthenticationMethod");

  // Método por defecto
  const defaultMethod = methods.find((m) => m.isDefault);
  const defaultMethodName = defaultMethod
    ? defaultMethod.type === "microsoftAuthenticatorAuthenticationMethod"
      ? "Authenticator App"
      : defaultMethod.type === "phoneAuthenticationMethod"
      ? "Phone"
      : defaultMethod.type === "passwordAuthenticationMethod"
      ? "Password"
      : defaultMethod.type
    : "-";

  // Detectar si Passwordless está activo
  const passwordlessActive = data.hasMFA && authenticator;

  // Barra de progreso
  const totalSteps = 2; // MFA + Passwordless
  let completedSteps = 0;
  if (data.hasMFA) completedSteps++;
  if (passwordlessActive) completedSteps++;

  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center bg-white p-4 shadow-sm gap-3">
        <img
          src="https://astara.com/themes/custom/astara/logo.svg"
          alt="Astara Logo"
          className="h-8"
        />
        <h1 className="text-2xl font-semibold text-gray-800">
          Passwordless Portal
        </h1>
      </header>

      <main className="flex-1 p-6 max-w-3xl mx-auto bg-white rounded-xl shadow-sm mt-6">
        {/* Información del usuario */}
        <section className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-bold mb-2 text-gray-800">User Summary</h2>
          <p>
            <strong>Name:</strong> {user.givenName || "-"} {user.surname || ""}
          </p>
          <p>
            <strong>Email:</strong> {user.mail || user.userPrincipalName}
          </p>
          <p>
            <strong>Phone:</strong> {phone ? phone.phoneNumber : "-"}
          </p>
          <p>
            <strong>Default Authentication:</strong> {defaultMethodName}
          </p>
          <p>
            <strong>MFA Enabled:</strong> {data.hasMFA ? "Yes" : "No"}
          </p>
          <p>
            <strong>Windows Hello for Business:</strong>{" "}
            {data.hasWHfB ? "Enabled" : "Not enabled"}
          </p>
        </section>

        {/* Passwordless Progress */}
        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2 text-gray-800">Passwordless Progress</h2>
          <div className="w-full h-6 bg-gray-300 rounded-lg overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="mt-2">{completedSteps} of {totalSteps} steps completed</p>
          {passwordlessActive && <p className="text-green-600 mt-1">✅ Passwordless is ACTIVE</p>}
        </section>

        {/* Authenticator Method */}
        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2 text-gray-800">Required Authentication Method</h2>
          {authenticator ? (
            <ul className="list-disc ml-6 text-gray-700">
              <li>
                Authenticator App Method (Device: {authenticator.displayName || "Unknown"})
              </li>
            </ul>
          ) : (
            <p className="text-yellow-600">
              ❗ Microsoft Authenticator not yet configured.{" "}
              <a
                href="https://mysignins.microsoft.com/security-info"
                className="underline text-blue-600"
                target="_blank"
                rel="noreferrer"
              >
                Configure it here
              </a>
              .
            </p>
          )}
        </section>

        {/* Password / Passwordless status */}
        <section>
          <h2 className="text-xl font-bold mb-2 text-gray-800">Traditional Sign-in Method</h2>
          {password ? (
            <p className="text-gray-700">Password authentication method detected.</p>
          ) : (
            <p className="text-green-600">✅ Passwordless mode active. You’re secure!</p>
          )}
        </section>

        {/* Next steps */}
        {!passwordlessActive && (
          <section className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-bold mb-2 text-gray-800">Next Steps</h2>
            <ul className="list-disc ml-6 text-gray-700">
              {!data.hasMFA && (
                <li>
                  Enable MFA:{" "}
                  <a
                    href="https://myaccount.microsoft.com/security-info"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600"
                  >
                    Go to Security Info
                  </a>
                </li>
              )}
              {!authenticator && (
                <li>
                  Register Authenticator App:{" "}
                  <a
                    href="https://aka.ms/mfasetup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600"
                  >
                    Setup Authenticator
                  </a>
                </li>
              )}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}