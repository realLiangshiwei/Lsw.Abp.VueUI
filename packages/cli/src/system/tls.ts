import process from 'node:process';

const LOCAL = /^https:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i;

/**
 * A backend on this machine serves the ASP.NET development certificate, which Node does
 * not trust and which `dotnet dev-certs https --trust` only fixes for browsers. Anything
 * else keeps its verification: a certificate that fails on a real host is a real problem.
 *
 * Nothing in this process outlives the command that called it.
 *
 * @param url The backend about to be asked something
 */
export function acceptDevelopmentCertificate(url: string | undefined): boolean {
  if (!url || !LOCAL.test(url)) return false;

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  return true;
}
