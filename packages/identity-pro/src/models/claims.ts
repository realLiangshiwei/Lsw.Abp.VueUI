import type { IdentityRoleClaimDto, IdentityUserClaimDto } from '@lsw-abpvue/identity-pro/proxy';

export interface IdentityClaimSubject {
  provider: 'user' | 'role';
  entityId: string;
  displayName?: string | undefined;
}

export type IdentitySubjectClaim = IdentityUserClaimDto & IdentityRoleClaimDto;

export type IdentityClaimValueError = 'required' | 'regex' | 'invalid-regex';
