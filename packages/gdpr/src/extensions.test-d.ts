import type {
  EntityPropContributorCallback,
  ToolbarActionContributorCallback,
} from '@lsw-abpvue/components';
import type { GdprRequestDto } from '@lsw-abpvue/gdpr/proxy';
import { describe, expectTypeOf, it } from 'vitest';
import type { GdprConfigOptions } from './tokens/extensions.token.js';

describe('GDPR contribution types', () => {
  it('keeps the official option name and types toolbar records as the current page', () => {
    type Props = NonNullable<GdprConfigOptions['createFormPropContributors']>;
    type Toolbar = NonNullable<GdprConfigOptions['toolbarActionContributors']>;
    expectTypeOf<NonNullable<Props['Gdpr.GdprComponent']>[number]>().toEqualTypeOf<
      EntityPropContributorCallback<GdprRequestDto>
    >();
    expectTypeOf<NonNullable<Toolbar['Gdpr.GdprComponent']>[number]>().toEqualTypeOf<
      ToolbarActionContributorCallback<readonly GdprRequestDto[]>
    >();
  });
});
