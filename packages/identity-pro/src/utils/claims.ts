import type { ClaimTypeDto } from '@lsw-abpvue/identity-pro/proxy';
import type {
  IdentityClaimSubject,
  IdentityClaimValueError,
  IdentitySubjectClaim,
} from '../models/claims.js';

export function getIdentityClaimValueError(
  value: string,
  type?: Pick<ClaimTypeDto, 'regex'> | undefined,
): IdentityClaimValueError | undefined {
  if (!value.trim()) return 'required';
  if (!type?.regex) return undefined;
  try {
    return new RegExp(type.regex).test(value) ? undefined : 'regex';
  } catch {
    return 'invalid-regex';
  }
}

export function getIdentityClaimValueType(type?: ClaimTypeDto | undefined): 0 | 1 | 2 | 3 {
  if (type && [0, 1, 2, 3].includes(type.valueType)) return type.valueType;
  return (
    ({ Int: 1, Boolean: 2, DateTime: 3 } as const)[
      type?.valueTypeAsString as 'Int' | 'Boolean' | 'DateTime'
    ] ?? 0
  );
}

export function hasIdentityClaim(
  claims: readonly IdentitySubjectClaim[],
  claimType: string,
  claimValue: string,
): boolean {
  return claims.some(claim => claim.claimType === claimType && claim.claimValue === claimValue);
}

export function createIdentityClaimsPayload(
  subject: IdentityClaimSubject,
  claims: readonly IdentitySubjectClaim[],
): IdentitySubjectClaim[] {
  return claims
    .filter(claim => claim.claimValue?.trim())
    .map(claim => ({
      ...(subject.provider === 'user'
        ? { userId: subject.entityId }
        : { roleId: subject.entityId }),
      claimType: claim.claimType,
      claimValue: claim.claimValue,
    }));
}
