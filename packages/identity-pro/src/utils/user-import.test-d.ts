import type { ImportUsersFromFileOutput } from '@lsw-abpvue/identity-pro/proxy';
import type { ComputedRef } from 'vue';
import { describe, expectTypeOf, it } from 'vitest';
import type {
  IdentityUserImportController,
  IdentityUserImportFormat,
  IdentityUserImportOperation,
  IdentityUserImportResult,
  IdentityUserImportState,
} from '../models/user-import.js';
import type {
  createIdentityUserImportController,
  getIdentityUserImportFileError,
} from './user-import.js';

describe('commercial user import types', () => {
  it('accepts only Excel or CSV and a native file for uploads', () => {
    expectTypeOf<IdentityUserImportFormat>().toEqualTypeOf<'excel' | 'csv'>();
    expectTypeOf<IdentityUserImportOperation>().toEqualTypeOf<'sample' | 'upload' | 'invalid'>();
    expectTypeOf<Parameters<IdentityUserImportController['importFile']>>().toEqualTypeOf<
      [file: File, format: IdentityUserImportFormat]
    >();
    expectTypeOf<ReturnType<IdentityUserImportController['importFile']>>().toEqualTypeOf<
      Promise<IdentityUserImportResult | undefined>
    >();
  });

  it('retains the commercial output with the upload format in readonly operation state', () => {
    expectTypeOf<IdentityUserImportResult['output']>().toEqualTypeOf<ImportUsersFromFileOutput>();
    expectTypeOf<IdentityUserImportController['state']>().toEqualTypeOf<
      ComputedRef<IdentityUserImportState>
    >();
    expectTypeOf<
      ReturnType<typeof createIdentityUserImportController>
    >().toEqualTypeOf<IdentityUserImportController>();
    expectTypeOf<IdentityUserImportState>().not.toHaveProperty('token');
    expectTypeOf<IdentityUserImportState>().not.toHaveProperty('file');
  });

  it('requires no new token or format when downloading the failed batch file', () => {
    expectTypeOf<Parameters<IdentityUserImportController['downloadInvalid']>>().toEqualTypeOf<[]>();
    expectTypeOf<ReturnType<IdentityUserImportController['downloadInvalid']>>().toEqualTypeOf<
      Promise<void>
    >();
    expectTypeOf<ReturnType<typeof getIdentityUserImportFileError>>().toEqualTypeOf<
      'required' | 'type' | 'empty' | undefined
    >();
  });
});
