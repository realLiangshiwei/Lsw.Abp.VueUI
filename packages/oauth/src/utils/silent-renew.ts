import { UserManager } from 'oidc-client-ts';

/**
 * Answers the token renewal `oidc-client-ts` started in a hidden iframe, and does nothing
 * else. The page that calls it runs once per access token lifetime; booting the whole
 * shell there would be an application start for one message to the parent window.
 *
 * The page is `silent-renew.html` in the application template, and what points the
 * library at it is `oAuthConfig.silentRefreshRedirectUri`.
 */
export async function completeSilentRenew(): Promise<void> {
  const manager = new UserManager({
    // None of the protocol runs here -- the callback reads the URL and hands it to the
    // window that opened the iframe -- so the settings only have to be a valid shape.
    authority: '',
    client_id: '',
    redirect_uri: '',
    automaticSilentRenew: false,
  });

  await manager.signinSilentCallback();
}
