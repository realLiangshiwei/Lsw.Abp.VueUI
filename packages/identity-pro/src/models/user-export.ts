import type { GetIdentityUsersInput } from '@lsw-abpvue/identity-pro/proxy';
import type { ComputedRef } from 'vue';

export type IdentityUserExportFormat = 'excel' | 'csv';

export type IdentityUserExportState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly format: IdentityUserExportFormat }
  | { readonly status: 'error'; readonly error: unknown };

export interface IdentityUserExportController {
  readonly state: ComputedRef<IdentityUserExportState>;
  export(format: IdentityUserExportFormat, query: GetIdentityUsersInput): Promise<void>;
  reset(): void;
}
