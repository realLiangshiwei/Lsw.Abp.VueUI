/** What the identity server adds on the way back, which is not the application's URL. */
const CALLBACK_PARAMS = ['code', 'state', 'session_state', 'iss', 'error', 'error_description'];
const CULTURE_PARAMS = ['culture', 'ui-culture'];

/** True for the URL the identity server redirected back to, successful or not. */
export function isAuthorizationCallback(url: URL): boolean {
  return url.searchParams.has('code') || url.searchParams.has('error');
}

/**
 * The same URL with the round trip's traces gone, as a path -- what the address bar
 * should read once the callback has been dealt with.
 */
export function withoutCallbackParams(url: URL): string {
  const cleaned = new URL(url.href);
  for (const name of [...CALLBACK_PARAMS, ...CULTURE_PARAMS]) cleaned.searchParams.delete(name);

  return `${cleaned.pathname}${cleaned.search}${cleaned.hash}`;
}

/** ABP reports the culture its login page actually used, which may not be the one asked for. */
export function cultureFromCallback(url: URL): string | undefined {
  return url.searchParams.get('ui-culture') ?? undefined;
}

/** Asks ABP's login page for the language the user is already reading the UI in. */
export function cultureParams(language: string | null): Record<string, string> {
  return language ? { culture: language, 'ui-culture': language } : {};
}
