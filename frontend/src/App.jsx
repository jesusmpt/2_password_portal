import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const methodNamesMap = {
  microsoftAuthenticatorAuthenticationMethod: 'Authenticator Application Method',
  fido2AuthenticationMethod: 'FIDO2 Security Keys Method',
  passwordAuthenticationMethod: 'Password Authentication',
  windowsHelloForBusinessAuthenticationMethod: 'Windows Hello for Business',
  phoneAuthenticationMethod: 'Phone Authentication'
};

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

  const requiredMethod = data.availableMethods.find(m => m.type === 'microsoftAuthenticatorAuthenticationMethod');
  const alternativeMethod = data.availableMethods.find(m => m.type === 'fido2AuthenticationMethod');
  const passwordMethod = data.availableMethods.find(m => m.type === 'passwordAuthenticationMethod');

  return (
    <div>
      <h1>Passwordless Portal</h1>

      <h2>User Info</h2>
      <p>Name: {data.user.givenName} {data.user.surname}</p>
      <p>Email: {data.user.mail || data.user.userPrincipalName}</p>
      <p>MFA Enabled: {data.hasMFA ? 'Yes' : 'No'}</p>
      <p>Windows Hello for Business: {data.hasWHfB ? 'Yes' : 'No'}</p>

      <h2>Available Authentication Methods</h2>
      <ul>
        {data.availableMethods.map(m => (
          <li key={m.type}>{methodNamesMap[m.type] || m.type}</li>
        ))}
      </ul>

      <h2>Required Authentication Method</h2>
      <p>{requiredMethod ? methodNamesMap[requiredMethod.type] : 'None'}</p>

      <h2>Alternative Authentication Method</h2>
      <p>{alternativeMethod ? methodNamesMap[alternativeMethod.type] : 'None'}</p>

      <h2>Password Method</h2>
      <p>{passwordMethod ? methodNamesMap[passwordMethod.type] : 'None'}</p>

      <h2>Missing Passwordless Methods</h2>
      <ul>
        {data.missingPasswordless.map(m => <li key={m}>{methodNamesMap[m] || m}</li>)}
      </ul>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
