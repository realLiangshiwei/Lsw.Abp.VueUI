import { describe, expectTypeOf, it } from 'vitest';
import { deepMerge, type DeepPartial } from './object-utils';

interface Environment {
  application: { name: string; baseUrl: string };
  oAuthConfig: { clientId: string; scope: string[] };
}

describe('deepMerge 的类型', () => {
  it('合并两个片段仍然得到完整类型', () => {
    const merged = deepMerge<Environment>(
      { application: { name: 'BookStore' } },
      { application: { baseUrl: 'https://localhost:44384' } },
    );

    expectTypeOf(merged).toEqualTypeOf<Environment>();
  });

  it('DeepPartial 逐层放宽，但不拆开数组', () => {
    expectTypeOf<DeepPartial<Environment>['application']>().toEqualTypeOf<
      { name?: string | undefined; baseUrl?: string | undefined } | undefined
    >();
    expectTypeOf<NonNullable<DeepPartial<Environment>['oAuthConfig']>['scope']>().toEqualTypeOf<
      string[] | undefined
    >();
  });
});
