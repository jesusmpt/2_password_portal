import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/methods')
      .then(res => res.json())
      .then(setData)
      .catch(err => setData({ error: 'Error desconocido' }));
  }, []);

  if (!data) return <p>Cargando...</p>;
  if (data.error) return <p>Error al obtener informaciÃ³n: {data.error}</p>;

  return (
    <div>
      <h1>Portal Passwordless</h1>
      <h2>Usuario:</h2>
      <p>{data.user.displayName} ({data.user.userPrincipalName})</p>
      <h2>MÃ©todos de autenticaciÃ³n:</h2>
      <ul>
        {data.availableMethods.map(m => (
          <li key={m.type}>{m.type}: {m.displayName} {m.phoneNumber}</li>
        ))}
      </ul>
      <h2>MÃ©todos Passwordless que faltan:</h2>
      <ul>
        {data.missingPasswordless.map(m => <li key={m}>{m}</li>)}
      </ul>
      <button onClick={() => window.location.reload()}>Comprobar de nuevo</button>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
