import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

export default async function (context, req) {
  try {
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    // === Token ===
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
    if (!tokenData.access_token) throw new Error('No se pudo obtener el token de acceso');

    const client = Client.init({ authProvider: done => done(null, tokenData.access_token) });

    const userId = req.headers['x-ms-client-principal-id'];
    if (!userId) throw new Error('Falta x-ms-client-principal-id');

    // === Info del usuario ===
    const user = await client
      .api(`/users/${userId}`)
      .select('displayName,givenName,surname,mail,userPrincipalName')
      .get();

    // === Métodos de autenticación ===
    const [methodsResponse, phoneResponse] = await Promise.all([
      client.api(`/users/${userId}/authentication/methods`).get().catch(() => ({ value: [] })),
      client.api(`/users/${userId}/authentication/phoneMethods`).get().catch(() => ({ value: [] }))
    ]);

    // === Unir métodos ===
    const rawMethods = [
      ...methodsResponse.value,
      ...phoneResponse.value
    ];

    // === Limpieza y etiquetas amigables ===
    const availableMethods = rawMethods.map(m => {
      const type = m['@odata.type'] ? m['@odata.type'].split('.').pop() : 'unknown';
      const friendlyNames = {
        passwordAuthenticationMethod: 'Password (Legacy)',
        microsoftAuthenticatorAuthenticationMethod: 'Authenticator Application',
        phoneAuthenticationMethod: 'Mobile Phone',
        fido2AuthenticationMethod: 'FIDO2 Security Key',
        softwareOathAuthenticationMethod: 'Software Token (OATH)',
        windowsHelloForBusinessAuthenticationMethod: 'Windows Hello for Business'
      };
      return {
        type,
        name: friendlyNames[type] || type,
        phoneNumber: m.phoneNumber || '',
        model: m.model || '',
        isDefault: m.isDefault || false,
        methodType: m.phoneType || ''
      };
    });

    // === Eliminar duplicados de teléfono ===
    const uniqueMethods = availableMethods.filter(
      (m, i, self) => !(m.type === 'phoneAuthenticationMethod' && i !== self.findIndex(x => x.phoneNumber === m.phoneNumber))
    );

    // === MFA ===
    const mfaRelated = ['microsoftAuthenticatorAuthenticationMethod', 'phoneAuthenticationMethod', 'softwareOathAuthenticationMethod'];
    const hasMFA = uniqueMethods.some(m => mfaRelated.includes(m.type));
    const mfaDevice = uniqueMethods.find(m => m.type === 'microsoftAuthenticatorAuthenticationMethod')?.model || null;
    const mfaPhone = uniqueMethods.find(m => m.type === 'phoneAuthenticationMethod')?.phoneNumber || null;

    // === WHfB ===
    const hasWHfB = uniqueMethods.some(m => m.type === 'windowsHelloForBusinessAuthenticationMethod');

    // === Métodos faltantes para passwordless ===
    const passwordlessMethods = ['microsoftAuthenticatorAuthenticationMethod', 'fido2AuthenticationMethod'];
    const missingPasswordless = passwordlessMethods.filter(
      m => !uniqueMethods.some(am => am.type.toLowerCase() === m.toLowerCase())
    );

    // === Respuesta ===
    context.res = {
      status: 200,
      body: {
        user,
        availableMethods: uniqueMethods,
        hasMFA,
        mfaDevice,
        mfaPhone,
        hasWHfB,
        missingPasswordless
      }
    };

  } catch (error) {
    console.error('Error en /api/methods:', error);
    context.res = { status: 500, body: { error: error.message } };
  }
}