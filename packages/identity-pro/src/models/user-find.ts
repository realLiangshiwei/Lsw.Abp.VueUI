import type { IdentityUserDto } from '@lsw-abpvue/identity-pro/proxy';
import type { ComputedRef } from 'vue';

export type IdentityUserFindMode = 'id' | 'userName' | 'email';

export interface IdentityUserFindInput {
  readonly mode: IdentityUserFindMode;
  readonly value: string;
}

export type IdentityUserFindValidationError = 'required' | 'id' | 'path';

export type IdentityUserFindState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly input: IdentityUserFindInput }
  | { readonly status: 'not-found'; readonly input: IdentityUserFindInput }
  | { readonly status: 'found'; readonly user: IdentityUserDto }
  | { readonly status: 'error'; readonly error: unknown };

export interface IdentityUserFindLoader {
  readonly state: ComputedRef<IdentityUserFindState>;
  find(input: IdentityUserFindInput): Promise<IdentityUserDto | undefined>;
  reset(): void;
}
