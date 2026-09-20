/**
 * The last of the three levels `loadRuntimeConfig` walks, after `public/dynamic-env.json`
 * and the `VITE_*` variables: what this build was born with (decision D11).
 *
 * `responseType` is what picks the authentication flow, exactly as in an ABP Angular
 * application: `code` hands the visitor to the identity server, anything else uses the
 * account module's own login form.
 */
export const defaultEnvironment = {
  apis: { default: { url: '__API_URL__' } },
  application: { name: '__APP_NAME__', baseUrl: '__APP_URL__' },
  production: false,
  oAuthConfig: {
    issuer: '__AUTH_URL__',
    clientId: '__CLIENT_ID__',
    scope: 'offline_access __APP_NAME__',
    responseType: 'code',
    redirectUri: '__APP_URL__',
    postLogoutRedirectUri: '__APP_URL__',
    silentRefreshRedirectUri: '__APP_URL__/silent-renew.html',
  },
};
