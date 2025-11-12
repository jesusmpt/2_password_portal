import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

export default async function (context, req) {
  try {
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    // === Obtener token de acceso ===
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
    if (!tokenData.access_token) {
      throw new Error('No se pudo obtener el token de acceso');
    }

    const accessToken = tokenData.access_token;

    const client = Client.init({ authProvider: done => done(null, accessToken) });

    const userId = req.headers['x-ms-client-principal-id'];
    if (!userId) {
      throw new Error('No se pudo determinar el usuario autenticado (x-ms-client-principal-id ausente)');
    }

    // === Información básica del usuario ===
    const user = await client
      .api(`/users/${userId}`)
      .select('displayName,givenName,surname,mail,userPrincipalName')
      .get();

    // === Métodos de autenticación ===
    const [methodsResponse, phoneResponse] = await Promise.all([
      client.api(`/users/${userId}/authentication/methods`).get().catch(() => ({ value: [] })),
      client.api(`/users/${userId}/authentication/phoneMethods`).get().catch(() => ({ value: [] }))
    ]);

    // === Unir resultados ===
    const availableMethods = [
      ...methodsResponse.value.map(m => ({
        type: m['@odata.type'].split('.').pop(),
        displayName: m.displayName || '',
        phoneNumber: m.phoneNumber || '',
        isDefault: m.isDefault || false
      })),
      ...phoneResponse.value.map(p => ({
        type: 'phoneAuthenticationMethod',
        displayName: p.displayName || '',
        phoneNumber: p.phoneNumber || '',
        methodType: p.phoneType || ''
      }))
    ];

    // === Detectar MFA habilitado ===
    const mfaMethods = availableMethods.filter(m =>
      ['microsoftAuthenticatorAuthenticationMethod', 'phoneAuthenticationMethod', 'softwareOathAuthenticationMethod'].includes(m.type)
    );
    const hasMFA = mfaMethods.length > 0;

    // === Detectar Windows Hello for Business ===
    const hasWHfB = availableMethods.some(m => m.type === 'windowsHelloForBusinessAuthenticationMethod');

    // === Detectar métodos passwordless ausentes ===
    const passwordlessMethods = ['microsoftAuthenticatorAuthenticationMethod', 'fido2AuthenticationMethod'];
    const missingPasswordless = passwordlessMethods.filter(
      m => !availableMethods.some(am => am.type.toLowerCase() === m.toLowerCase())
    );

    // === Respuesta final ===
    context.res = {
      status: 200,
      body: {
        user,
        availableMethods,
        hasMFA,
        hasWHfB,
        missingPasswordless
      }
    };
  } catch (error) {
    console.error('Error en /api/methods:', error);
    context.res = { status: 500, body: { error: error.message } };
  }
}