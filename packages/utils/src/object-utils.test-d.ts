import { describe, expectTypeOf, it } from 'vitest';
import { deepMerge, type DeepPartial } from './object-utils';

interface Environment {
  application: { name: string; baseUrl: string };
  oAuthConfig: { clientId: string; scope: string[] };
}

describe('deepMerge types', () => {
  it('merging two fragments still yields the complete type', () => {
    const merged = deepMerge<Environment>(
      { application: { name: 'BookStore' } },
      { application: { baseUrl: 'https://localhost:44384' } },
    );

    expectTypeOf(merged).toEqualTypeOf<Environment>();
  });

  it('DeepPartial relaxes every level but leaves arrays alone', () => {
    expectTypeOf<DeepPartial<Environment>['application']>().toEqualTypeOf<
      { name?: string | undefined; baseUrl?: string | undefined } | undefined
    >();
    expectTypeOf<NonNullable<DeepPartial<Environment>['oAuthConfig']>['scope']>().toEqualTypeOf<
      string[] | undefined
    >();
  });
});
