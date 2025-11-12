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

      <h2>Missing Passwordless Methods:</h2>
      <ul>
        {data.missingPasswordless.map(m => <li key={m}>{m}</li>)}
      </ul>

      <button onClick={() => window.location.reload()}>Check Again</button>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);