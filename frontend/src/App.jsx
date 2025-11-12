import React, { useEffect, useState } from "react";
import LogoutButton from "./components/LogoutButton";

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

  const requiredAuth = methods.filter(
    (m) => m.type === "microsoftAuthenticatorAuthenticationMethod"
  );
  const alternativeAuth = methods.filter(
    (m) => m.type === "fido2AuthenticationMethod"
  );

  const phone = methods.find((m) => m.type === "phoneAuthenticationMethod");
  const password = methods.find((m) => m.type === "passwordAuthenticationMethod");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <img
            src="https://astara.com/themes/custom/astara/logo.svg"
            alt="Astara Logo"
            className="h-8"
          />
          <h1 className="text-2xl font-semibold text-gray-800">
            Passwordless Portal
          </h1>
        </div>
        <LogoutButton />
      </header>

      {/* Content */}
      <main className="flex-1 p-6 max-w-3xl mx-auto bg-white rounded-xl shadow-sm mt-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          User Information
        </h2>
        <div className="space-y-2 text-gray-700">
          <p>
            <strong>Name:</strong> {user.givenName || "-"} {user.surname || ""}
          </p>
          <p>
            <strong>Email:</strong> {user.mail || user.userPrincipalName}
          </p>
          <p>
            <strong>MFA Enabled:</strong> {data.hasMFA ? "Yes" : "No"}
          </p>
          <p>
            <strong>Windows Hello for Business:</strong>{" "}
            {data.hasWHfB ? "Enabled" : "Not enabled"}
          </p>
          {phone && (
            <p>
              <strong>Phone Number:</strong> {phone.phoneNumber}
            </p>
          )}
        </div>

        <hr className="my-6" />

        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Required Authentication Method
        </h2>
        {requiredAuth.length > 0 ? (
          <ul className="list-disc ml-6 text-gray-700">
            <li>Authenticator Application Method</li>
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

        <h2 className="text-xl font-bold mt-8 mb-4 text-gray-800">
          Alternative Authentication Method
        </h2>
        {alternativeAuth.length > 0 ? (
          <ul className="list-disc ml-6 text-gray-700">
            <li>FIDO2 Security Keys Method</li>
          </ul>
        ) : (
          <p className="text-yellow-600">
            ⚙️ You can also add FIDO2 security keys.{" "}
            <a
              href="https://mysignins.microsoft.com/security-info"
              className="underline text-blue-600"
              target="_blank"
              rel="noreferrer"
            >
              Add a key
            </a>
            .
          </p>
        )}

        <h2 className="text-xl font-bold mt-8 mb-4 text-gray-800">
          Traditional Sign-in Method
        </h2>
        {password ? (
          <p className="text-gray-700">
            Password authentication method detected.
          </p>
        ) : (
          <p className="text-green-600">
            ✅ Passwordless mode active. You’re secure!
          </p>
        )}
      </main>
    </div>
  );
}