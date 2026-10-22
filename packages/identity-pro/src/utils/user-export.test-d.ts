import type { GetIdentityUsersInput } from '@lsw-abpvue/identity-pro/proxy';
import type { ComputedRef } from 'vue';
import { describe, expectTypeOf, it } from 'vitest';
import type {
  IdentityUserExportController,
  IdentityUserExportFormat,
  IdentityUserExportState,
} from '../models/user-export.js';
import type { createIdentityUserExportController } from './user-export.js';

describe('commercial user export types', () => {
  it('accepts only the two backend file formats and an applied commercial list query', () => {
    expectTypeOf<IdentityUserExportFormat>().toEqualTypeOf<'excel' | 'csv'>();
    expectTypeOf<Parameters<IdentityUserExportController['export']>>().toEqualTypeOf<
      [format: IdentityUserExportFormat, query: GetIdentityUsersInput]
    >();
    expectTypeOf<ReturnType<IdentityUserExportController['export']>>().toEqualTypeOf<
      Promise<void>
    >();
  });

  it('exposes readonly operation state without exposing a download token', () => {
    expectTypeOf<IdentityUserExportController['state']>().toEqualTypeOf<
      ComputedRef<IdentityUserExportState>
    >();
    expectTypeOf<IdentityUserExportState>().not.toHaveProperty('token');
    expectTypeOf<
      ReturnType<typeof createIdentityUserExportController>
    >().toEqualTypeOf<IdentityUserExportController>();
  });
});
