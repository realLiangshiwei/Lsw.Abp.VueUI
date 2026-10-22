import type {
  ClaimTypeDto,
  CreateClaimTypeDto,
  UpdateClaimTypeDto,
} from '@lsw-abpvue/identity-pro/proxy';
import { describe, expectTypeOf, it } from 'vitest';
import type { IdentityClaimSubject, IdentitySubjectClaim } from '../models/claims.js';
import type { IdentityProClaimsPageCommands } from '../tokens/claims-page.token.js';
import type { createIdentityClaimsPayload, getIdentityClaimValueType } from './claims.js';
import type {
  serializeIdentityClaimTypeCreate,
  serializeIdentityClaimTypeUpdate,
} from './claim-type-editor.js';

describe('commercial claim contracts', () => {
  it('distinguishes the user and role subject with a required entity id', () => {
    expectTypeOf<IdentityClaimSubject['provider']>().toEqualTypeOf<'user' | 'role'>();
    expectTypeOf<IdentityClaimSubject['entityId']>().toEqualTypeOf<string>();
    expectTypeOf<Parameters<typeof createIdentityClaimsPayload>>().toEqualTypeOf<
      [subject: IdentityClaimSubject, claims: readonly IdentitySubjectClaim[]]
    >();
    expectTypeOf<ReturnType<typeof getIdentityClaimValueType>>().toEqualTypeOf<0 | 1 | 2 | 3>();
  });
  it('contributes claim type operations using commercial DTOs', () => {
    expectTypeOf<Parameters<IdentityProClaimsPageCommands['edit']>>().toEqualTypeOf<
      [claimType: ClaimTypeDto]
    >();
    expectTypeOf<ReturnType<IdentityProClaimsPageCommands['remove']>>().toEqualTypeOf<
      Promise<void>
    >();
  });
  it('serializes only the commercial create and update DTO contracts', () => {
    expectTypeOf<
      ReturnType<typeof serializeIdentityClaimTypeCreate>
    >().toEqualTypeOf<CreateClaimTypeDto>();
    expectTypeOf<
      ReturnType<typeof serializeIdentityClaimTypeUpdate>
    >().toEqualTypeOf<UpdateClaimTypeDto>();
  });
});
