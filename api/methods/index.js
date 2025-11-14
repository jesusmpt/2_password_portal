import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

export default async function (context, req) {
  try {
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    // Obtener token de aplicación
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

    const userId = req.headers['x-ms-client-principal-id'];

    // Información básica del usuario
    const user = await client
      .api(`/users/${userId}`)
      .select('displayName,givenName,surname,mail,userPrincipalName')
      .get();

    // Métodos de autenticación
    const methodsResponse = await client.api(`/users/${userId}/authentication/methods`).get();

    // Métodos de teléfono
    const phoneResponse = await client.api(`/users/${userId}/authentication/phoneMethods`).get();

    // Unimos resultados
    const availableMethods = [
      ...methodsResponse.value.map(m => ({
        type: m['@odata.type'].split('.').pop(),
        displayName: m.displayName || '',
        phoneNumber: m.phoneNumber || '',
        isDefault: m.isDefault || false,
        methodType: m.methodType || ''
      })),
      ...phoneResponse.value.map(p => ({
        type: 'phoneAuthenticationMethod',
        displayName: p.displayName || '',
        phoneNumber: p.phoneNumber || '',
        methodType: p.phoneType || ''
      }))
    ];

    // Identificar MFA activo
    const mfaMethods = availableMethods.filter(m =>
      ['microsoftAuthenticatorAuthenticationMethod', 'phoneAuthenticationMethod', 'softwareOathAuthenticationMethod'].includes(m.type)
    );
    const hasMFA = mfaMethods.length > 0;

    // Detectar Windows Hello
    const hasWHfB = availableMethods.some(m => m.type === 'windowsHelloForBusinessAuthenticationMethod');

    // Passwordless principal: solo Authenticator (FIDO2 removido)
    const passwordlessMethods = ['microsoftAuthenticatorAuthenticationMethod'];
    const missingPasswordless = passwordlessMethods.filter(
      m => !availableMethods.some(am => am.type.toLowerCase() === m.toLowerCase())
    );

    // Información extra: dispositivo Authenticator y número de móvil
    const authenticatorDevices = availableMethods
      .filter(m => m.type === 'microsoftAuthenticatorAuthenticationMethod')
      .map(m => m.displayName);

    const phoneNumbers = availableMethods
      .filter(m => m.type === 'phoneAuthenticationMethod' && m.phoneNumber)
      .map(m => ({ number: m.phoneNumber, type: m.methodType }));

    context.res = {
      status: 200,
      body: {
        user,
        availableMethods,
        missingPasswordless,
        hasMFA,
        hasWHfB,
        authenticatorDevices,
        phoneNumbers
      }
    };
  } catch (error) {
    console.error(error);
    context.res = { status: 500, body: { error: error.message } };
  }
}