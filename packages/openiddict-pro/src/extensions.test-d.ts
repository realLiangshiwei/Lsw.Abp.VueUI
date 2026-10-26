import type {
  EntityActionContributorCallback,
  EntityPropContributorCallback,
  FormPropContributorCallback,
  ToolbarActionContributorCallback,
} from '@lsw-abpvue/components';
import type { ApplicationDto, ScopeDto } from '@lsw-abpvue/openiddict-pro/proxy';
import { describe, expectTypeOf, it } from 'vitest';
import type { OpenIddictProConfigOptions } from './tokens/extensions.token.js';

describe('OpenIddict contribution types', () => {
  it('preserves the record type of each component key', () => {
    type Actions = NonNullable<OpenIddictProConfigOptions['entityActionContributors']>;
    type Props = NonNullable<OpenIddictProConfigOptions['entityPropContributors']>;
    type Create = NonNullable<OpenIddictProConfigOptions['createFormPropContributors']>;
    type Edit = NonNullable<OpenIddictProConfigOptions['editFormPropContributors']>;
    type Toolbar = NonNullable<OpenIddictProConfigOptions['toolbarActionContributors']>;
    expectTypeOf<NonNullable<Actions['OpenIddictPro.Applications']>[number]>().toEqualTypeOf<
      EntityActionContributorCallback<ApplicationDto>
    >();
    expectTypeOf<NonNullable<Actions['OpenIddictPro.Scopes']>[number]>().toEqualTypeOf<
      EntityActionContributorCallback<ScopeDto>
    >();
    expectTypeOf<NonNullable<Props['OpenIddictPro.Scopes']>[number]>().toEqualTypeOf<
      EntityPropContributorCallback<ScopeDto>
    >();
    expectTypeOf<NonNullable<Create['OpenIddictPro.Applications']>[number]>().toEqualTypeOf<
      FormPropContributorCallback<ApplicationDto>
    >();
    expectTypeOf<NonNullable<Edit['OpenIddictPro.Applications']>[number]>().toEqualTypeOf<
      FormPropContributorCallback<ApplicationDto>
    >();
    expectTypeOf<NonNullable<Toolbar['OpenIddictPro.Applications']>[number]>().toEqualTypeOf<
      ToolbarActionContributorCallback<readonly ApplicationDto[]>
    >();
  });
});
