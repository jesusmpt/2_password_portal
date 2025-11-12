import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

export default async function (context, req) {
  try {
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    const tokenResponse = await fetch(\https://login.microsoftonline.com/\/oauth2/v2.0/token\, {
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

    const methodsResponse = await client.api(\/users/\/authentication/methods\).get();

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
