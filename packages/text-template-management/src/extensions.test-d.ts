import type {
  EntityActionContributorCallback,
  EntityPropContributorCallback,
  ToolbarActionContributorCallback,
} from '@lsw-abpvue/components';
import type { TemplateDefinitionDto } from '@lsw-abpvue/text-template-management/proxy';
import { describe, expectTypeOf, it } from 'vitest';
import type { TextTemplateManagementConfigOptions } from './tokens/extensions.token.js';

describe('text template contribution types', () => {
  it('preserves the official template definition type for all three contribution sets', () => {
    type Options = TextTemplateManagementConfigOptions;
    type Key = 'TextTemplateManagement.TextTemplates';
    expectTypeOf<
      NonNullable<NonNullable<Options['entityActionContributors']>[Key]>[number]
    >().toEqualTypeOf<EntityActionContributorCallback<TemplateDefinitionDto>>();
    expectTypeOf<
      NonNullable<NonNullable<Options['entityPropContributors']>[Key]>[number]
    >().toEqualTypeOf<EntityPropContributorCallback<TemplateDefinitionDto>>();
    expectTypeOf<
      NonNullable<NonNullable<Options['toolbarActionContributors']>[Key]>[number]
    >().toEqualTypeOf<ToolbarActionContributorCallback<readonly TemplateDefinitionDto[]>>();
  });
});
