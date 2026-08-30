import { isPlainObject } from '@lsw-abpvue/utils';

function decodeBase64Url(segment: string): string {
  const base64 = segment
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(segment.length + ((4 - (segment.length % 4)) % 4), '=');

  return atob(base64);
}

/**
 * Reads the claims out of a JWT. Nothing is verified -- the backend is what decides
 * whether a token is good, and a UI that pretended otherwise would only be guessing.
 * @param token The token to read
 */
export function decodeJwt(token: string): Record<string, unknown> | undefined {
  const payload = token.split('.')[1];
  if (!payload) return undefined;

  try {
    const claims: unknown = JSON.parse(decodeBase64Url(payload));
    return isPlainObject(claims) ? claims : undefined;
  } catch {
    // Anything that is not a JWT reads as "no claims"; the caller has a default for that.
    return undefined;
  }
}
