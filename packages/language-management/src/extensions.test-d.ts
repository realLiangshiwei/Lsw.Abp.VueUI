import type {
  EntityActionContributorCallback,
  EntityPropContributorCallback,
  FormPropContributorCallback,
  ToolbarActionContributorCallback,
} from '@lsw-abpvue/components';
import type { LanguageDto, LanguageTextDto } from '@lsw-abpvue/language-management/proxy';
import { describe, expectTypeOf, it } from 'vitest';
import type { LanguageManagementConfigOptions } from './tokens/extensions.token.js';

describe('language contribution types', () => {
  it('preserves the record type of each component key', () => {
    type Actions = NonNullable<LanguageManagementConfigOptions['entityActionContributors']>;
    type Props = NonNullable<LanguageManagementConfigOptions['entityPropContributors']>;
    type Create = NonNullable<LanguageManagementConfigOptions['createFormPropContributors']>;
    type Edit = NonNullable<LanguageManagementConfigOptions['editFormPropContributors']>;
    type Toolbar = NonNullable<LanguageManagementConfigOptions['toolbarActionContributors']>;
    expectTypeOf<
      NonNullable<Actions['LanguageManagement.LanguagesComponent']>[number]
    >().toEqualTypeOf<EntityActionContributorCallback<LanguageDto>>();
    expectTypeOf<
      NonNullable<Actions['LanguageManagement.LanguageTextsComponent']>[number]
    >().toEqualTypeOf<EntityActionContributorCallback<LanguageTextDto>>();
    expectTypeOf<
      NonNullable<Props['LanguageManagement.LanguageTextsComponent']>[number]
    >().toEqualTypeOf<EntityPropContributorCallback<LanguageTextDto>>();
    expectTypeOf<
      NonNullable<Create['LanguageManagement.LanguagesComponent']>[number]
    >().toEqualTypeOf<FormPropContributorCallback<LanguageDto>>();
    expectTypeOf<
      NonNullable<Edit['LanguageManagement.LanguagesComponent']>[number]
    >().toEqualTypeOf<FormPropContributorCallback<LanguageDto>>();
    expectTypeOf<
      NonNullable<Toolbar['LanguageManagement.LanguagesComponent']>[number]
    >().toEqualTypeOf<ToolbarActionContributorCallback<readonly LanguageDto[]>>();
  });
});
