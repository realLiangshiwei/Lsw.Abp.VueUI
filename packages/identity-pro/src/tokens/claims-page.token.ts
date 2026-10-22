import { defineToken } from '@lsw-abpvue/core';
import type { ClaimTypeDto } from '@lsw-abpvue/identity-pro/proxy';

/** The operations exposed to claim type extension contributors. */
export interface IdentityProClaimsPageCommands {
  add(): void;
  edit(claimType: ClaimTypeDto): Promise<void>;
  remove(claimType: ClaimTypeDto): Promise<void>;
}

export const IDENTITY_PRO_CLAIMS_PAGE = defineToken<IdentityProClaimsPageCommands>(
  'IDENTITY_PRO_CLAIMS_PAGE',
);
