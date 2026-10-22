import type { ImportUsersFromFileOutput } from '@lsw-abpvue/identity-pro/proxy';
import type { ComputedRef } from 'vue';

export type IdentityUserImportFormat = 'excel' | 'csv';

export type IdentityUserImportOperation = 'sample' | 'upload' | 'invalid';

export interface IdentityUserImportResult {
  readonly format: IdentityUserImportFormat;
  readonly output: ImportUsersFromFileOutput;
}

export interface IdentityUserImportState {
  readonly status: 'idle' | 'loading' | 'error';
  readonly operation?: IdentityUserImportOperation | undefined;
  readonly result?: IdentityUserImportResult | undefined;
  readonly error?: unknown;
}

export interface IdentityUserImportController {
  readonly state: ComputedRef<IdentityUserImportState>;
  downloadSample(format: IdentityUserImportFormat): Promise<void>;
  importFile(
    file: File,
    format: IdentityUserImportFormat,
  ): Promise<IdentityUserImportResult | undefined>;
  downloadInvalid(): Promise<void>;
  reset(): void;
}
