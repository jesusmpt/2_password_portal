import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/methods')
      .then(res => res.json())
      .then(setData)
      .catch(err => setData({ error: 'Unknown error' }));
  }, []);

  if (!data) return <p>Loading...</p>;
  if (data.error) return <p>Error fetching data: {data.error}</p>;

  // Filtrar los métodos faltantes
  const requiredAuthMethod = data.missingPasswordless.filter(
    m => m.toLowerCase() === 'microsoftauthenticatorauthenticationmethod'
  );
  const alternativeAuthMethod = data.missingPasswordless.filter(
    m => m.toLowerCase() === 'fido2authenticationmethod'
  );

 const methodNamesMap = {
  passwordAuthenticationMethod: 'Password Authentication',
  phoneAuthenticationMethod: 'Phone'
  // puedes añadir más métodos si los necesitas
};

  return (
    <div>
      <h1>Passwordless Portal</h1>
      <h2>User:</h2>
      <p>{data.user.displayName} ({data.user.userPrincipalName})</p>

      <h2>Authentication Methods:</h2>
      <ul>
        {data.availableMethods.map(m => (
          <li key={m.type}>{m.type}: {m.displayName} {m.phoneNumber}</li>
        ))}
      </ul>

<ul>
  {data.availableMethods.map(m => (
    <li key={m.type}>
      {methodNamesMap[m.type] || m.type}: {m.displayName} {m.phoneNumber}
    </li>
  ))}
</ul>

      <h2>Required Authentication Method:</h2>
      <ul>
        {requiredAuthMethod.map(m => <li key={m}>Authenticator Application Method</li>)}
      </ul>

      <h2>Alternative Authentication Method:</h2>
      <ul>
        {alternativeAuthMethod.map(m => <li key={m}>Fido2 Security Keys Method</li>)}
      </ul>

      <button onClick={() => window.location.reload()}>Check again</button>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);