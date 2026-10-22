export interface AccountLinkHandoff {
  sourceOrigin: string;
  sourceUserId: string;
  sourceTenantId?: string | null | undefined;
  sourceTenantName?: string | null | undefined;
  targetUserId: string;
  targetTenantId?: string | null | undefined;
  nonce: string;
  issuedAt: number;
}
const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function trustedAccountOrigin(
  value: string,
  allowed: readonly string[],
): string | undefined {
  try {
    const url = new URL(value);
    if (
      url.username ||
      url.password ||
      (url.protocol !== 'https:' &&
        !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))
    )
      return undefined;
    return allowed.some(origin => {
      try {
        return new URL(origin).origin === url.origin;
      } catch {
        return false;
      }
    })
      ? url.origin
      : undefined;
  } catch {
    return undefined;
  }
}
export function parseAccountLinkHandoff(
  value: string,
  allowedOrigins: readonly string[],
  now = Date.now(),
): AccountLinkHandoff | undefined {
  try {
    if (value.length > 4096) return undefined;
    const data: unknown = JSON.parse(value);
    if (!data || typeof data !== 'object') return undefined;
    const source = data as Record<string, unknown>;
    if (
      typeof source.sourceOrigin !== 'string' ||
      trustedAccountOrigin(source.sourceOrigin, allowedOrigins) !== source.sourceOrigin ||
      typeof source.sourceUserId !== 'string' ||
      !guid.test(source.sourceUserId) ||
      typeof source.targetUserId !== 'string' ||
      !guid.test(source.targetUserId) ||
      typeof source.nonce !== 'string' ||
      !guid.test(source.nonce) ||
      Object.keys(source).some(key => /token/i.test(key)) ||
      typeof source.issuedAt !== 'number' ||
      !Number.isSafeInteger(source.issuedAt) ||
      source.issuedAt > now + 30000 ||
      now - source.issuedAt > 300000
    )
      return undefined;
    for (const field of ['sourceTenantId', 'targetTenantId'])
      if (source[field] != null && (typeof source[field] !== 'string' || !guid.test(source[field])))
        return undefined;
    if (
      source.sourceTenantId != null &&
      (typeof source.sourceTenantName !== 'string' ||
        !source.sourceTenantName.trim() ||
        source.sourceTenantName.length > 128 ||
        [...source.sourceTenantName].some(
          character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
        ))
    )
      return undefined;
    if (source.sourceTenantId == null && source.sourceTenantName != null) return undefined;
    return {
      sourceOrigin: source.sourceOrigin,
      sourceUserId: source.sourceUserId,
      sourceTenantId: source.sourceTenantId as string | null | undefined,
      sourceTenantName: source.sourceTenantName as string | null | undefined,
      targetUserId: source.targetUserId,
      targetTenantId: source.targetTenantId as string | null | undefined,
      nonce: source.nonce,
      issuedAt: source.issuedAt,
    };
  } catch {
    return undefined;
  }
}
export function delegationStatus(
  startTime: string,
  endTime: string,
  now = Date.now(),
): 'Future' | 'Active' | 'Expired' {
  const start = Date.parse(startTime);
  const end = Date.parse(endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || now >= end) return 'Expired';
  return now < start ? 'Future' : 'Active';
}
