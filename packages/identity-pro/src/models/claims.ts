export interface IdentityClaimSubject {
  provider: 'user' | 'role';
  entityId: string;
  displayName?: string | undefined;
}

export interface IdentitySubjectClaim {
  claimType?: string | undefined;
  claimValue?: string | undefined;
  userId?: string | undefined;
  roleId?: string | undefined;
}

export type IdentityClaimValueError = 'required' | 'regex' | 'invalid-regex';
