import { APPLICATION_CONFIGURATION_PATH } from '../api-definition/source.js';
import { acceptDevelopmentCertificate } from '../system/tls.js';

export interface ReachResult {
  reachable: boolean;
  /** What happened, in the words the caller can print. */
  detail: string;
  /** True when it only answered after the development certificate was accepted. */
  developmentCertificate?: boolean | undefined;
}

/** Node's name for a certificate it will not take, whichever way it is untrustworthy. */
const CERTIFICATE = /^(SELF_SIGNED|UNABLE_TO_VERIFY|DEPTH_ZERO_SELF_SIGNED|CERT_)/;

function causeOf(error: unknown): string {
  return String((error as { cause?: { code?: string } }).cause?.code ?? '');
}

async function ask(url: string, timeoutMs: number): Promise<ReachResult> {
  const target = `${url.replace(/\/+$/, '')}${APPLICATION_CONFIGURATION_PATH}`;

  try {
    const response = await fetch(target, { signal: AbortSignal.timeout(timeoutMs) });

    return response.ok
      ? { reachable: true, detail: url }
      : { reachable: false, detail: `${url} answered ${response.status} ${response.statusText}` };
  } catch (error) {
    const code = causeOf(error);

    return {
      reachable: false,
      detail: `${url} did not answer (${code || (error as Error).message})`,
      developmentCertificate: CERTIFICATE.test(code),
    };
  }
}

/**
 * Whether the backend answers the endpoint every ABP frontend reads before it renders
 * anything. Anonymous by design, so no token is involved.
 *
 * A backend on this machine serves the ASP.NET development certificate, which Node does
 * not trust. That is tried second rather than first, so the common case -- a backend that
 * is simply not running yet -- never turns certificate verification off.
 *
 * @param url The backend's base address
 * @param timeoutMs How long to wait; a backend still starting up is not worth blocking on
 */
export async function reachBackend(url: string, timeoutMs = 5000): Promise<ReachResult> {
  const first = await ask(url, timeoutMs);
  if (first.reachable || !first.developmentCertificate) return first;

  if (!acceptDevelopmentCertificate(url)) return first;

  const second = await ask(url, timeoutMs);

  return { ...second, developmentCertificate: true };
}
