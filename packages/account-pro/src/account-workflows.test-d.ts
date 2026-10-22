import { expectTypeOf, test } from 'vitest';
import type { RouteRecordRaw } from 'vue-router';
import { createAccountProRoutes } from './index.js';
import type { AccountWorkflowsService } from './index.js';
import { provideAccountProConfig } from '@lsw-abpvue/account-pro/config';
import type { AccountProOptions } from '@lsw-abpvue/account-pro/config';
import type { EnvironmentProviders, ServiceOf } from '@lsw-abpvue/core';
test('exposes typed Identity-facing account entry points', () => {
  expectTypeOf(createAccountProRoutes()).toEqualTypeOf<RouteRecordRaw[]>();
  expectTypeOf(
    provideAccountProConfig({
      trustedOrigins: ['https://app.example'],
      tenantOrigins: { tenant: 'https://tenant.example' },
    }),
  ).toEqualTypeOf<EnvironmentProviders>();
  expectTypeOf<AccountProOptions['tenantOrigins']>().toEqualTypeOf<
    Readonly<Record<string, string>> | undefined
  >();
  expectTypeOf<ServiceOf<typeof AccountWorkflowsService>['beginLink']>()
    .parameter(0)
    .toEqualTypeOf<string>();
});
