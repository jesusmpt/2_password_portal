# Ruta base
$basePath = "C:\PortalPasswordless"

# Crear carpetas
New-Item -ItemType Directory -Path "$basePath\frontend\src" -Force
New-Item -ItemType Directory -Path "$basePath\api\methods" -Force

# =========================
# package.json frontend
# =========================
$frontendPackageJson = @"
{
  "name": "portal-passwordless",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@azure/msal-browser": "^2.48.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "vite": "^5.4.21",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
"@
$frontendPackageJson | Out-File "$basePath\frontend\package.json" -Encoding UTF8

# =========================
# index.html
# =========================
$indexHtml = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Portal Passwordless</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/App.jsx"></script>
</body>
</html>
"@
$indexHtml | Out-File "$basePath\frontend\index.html" -Encoding UTF8

# =========================
# App.jsx
# =========================
$appJs = @"
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
  if (data.error) return <p>Error al obtener información: {data.error}</p>;

  return (
    <div>
      <h1>Portal Passwordless</h1>
      <h2>Usuario:</h2>
      <p>{data.user.displayName} ({data.user.userPrincipalName})</p>
      <h2>Métodos de autenticación:</h2>
      <ul>
        {data.availableMethods.map(m => (
          <li key={m.type}>{m.type}: {m.displayName} {m.phoneNumber}</li>
        ))}
      </ul>
      <h2>Métodos Passwordless que faltan:</h2>
      <ul>
        {data.missingPasswordless.map(m => <li key={m}>{m}</li>)}
      </ul>
      <button onClick={() => window.location.reload()}>Comprobar de nuevo</button>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
"@
$appJs | Out-File "$basePath\frontend\src\App.jsx" -Encoding UTF8

# =========================
# API methods/index.js
# =========================
$apiIndexJs = @"
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

export default async function (context, req) {
  try {
    const tenantId = '9ff87f7c-8358-46b5-88bc-d73c09ce789f';
    const clientId = '8dcec823-8928-41f7-a9b5-e85db1dc6c12';
    const clientSecret = 'fcy8Q~E2wPa6u5EyxLOrbS4Pp8dePnFbMFkQXc7Y';

    const tokenResponse = await fetch(\`https://login.microsoftonline.com/\${tenantId}/oauth2/v2.0/token\`, {
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body: new URLSearchParams({
        client_id: clientId,
        scope: 'https://graph.microsoft.com/.default',
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      })
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const client = Client.init({ authProvider: done => done(null, accessToken) });

    const user = await client.api('/users/' + req.headers['x-ms-client-principal-id'])
      .select('displayName,givenName,surname,mail,userPrincipalName').get();

    const methodsResponse = await client.api(\`/users/\${user.id}/authentication/methods\`).get();

    const availableMethods = methodsResponse.value.map(m => ({
      type: m['@odata.type'].split('.').pop(),
      displayName: m.displayName || '',
      phoneNumber: m.phoneNumber || ''
    }));

    const passwordlessMethods = ['fido2AuthenticationMethod','microsoftAuthenticatorAuthenticationMethod'];
    const missing = passwordlessMethods.filter(m => !availableMethods.some(am => am.type.toLowerCase()===m.toLowerCase()));

    context.res = { status:200, body:{ user, availableMethods, missingPasswordless: missing } };
  } catch(error) {
    console.error(error);
    context.res = { status:500, body:{error: error.message} };
  }
}
"@
$apiIndexJs | Out-File "$basePath\api\methods\index.js" -Encoding UTF8

# =========================
# staticwebapp.config.json
# =========================
$staticConfig = @"
{
  ""navigationFallback"": { ""rewrite"": ""/index.html"", ""exclude"": [""/assets/*"", ""/api/*""] },
  ""auth"": {
    ""identityProviders"": {
      ""azureActiveDirectory"": {
        ""registration"": {
          ""openIdIssuer"": ""https://login.microsoftonline.com/9ff87f7c-8358-46b5-88bc-d73c09ce789f/v2.0"",
          ""clientIdSettingName"": ""AZURE_CLIENT_ID"",
          ""clientSecretSettingName"": ""AZURE_CLIENT_SECRET""
        }
      }
    }
  },
  ""routes"": [
    { ""route"": ""/login"", ""rewrite"": ""/.auth/login/aad"" },
    { ""route"": ""/logout"", ""rewrite"": ""/.auth/logout"" },
    { ""route"": ""/api/*"", ""allowedRoles"": [""authenticated""] }
  ]
}
"@
$staticConfig | Out-File "$basePath\frontend\staticwebapp.config.json" -Encoding UTF8

Write-Host "Estructura de portal passwordless creada en $basePath"