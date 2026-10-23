import { EntityProp, ExtensionsService, FormProp, PropType } from '@lsw-abpvue/components';
import { ConfigStateService, createInjector } from '@lsw-abpvue/core';
import type { LanguageDto, LanguageTextDto } from '@lsw-abpvue/language-management/proxy';
import { describe, expect, it } from 'vitest';
import { LanguageManagementComponents as Keys } from '../enums/components.js';
import { provideLanguageManagement } from '../providers/language-management.provider.js';
import { languageManagementExtensionsResolver } from './extensions.resolver.js';

describe('language extensions', () => {
  it('assembles backend language properties before the application override', () => {
    const seen: string[][] = [];
    const injector = createInjector(
      provideLanguageManagement({
        createFormPropContributors: {
          [Keys.Languages]: [
            props => {
              seen.push(props.toArray().map(prop => prop.name));
            },
          ],
        },
      }),
    );
    try {
      const config = injector.get(ConfigStateService);
      config.setState({
        ...config.snapshot(),
        objectExtensions: {
          modules: {
            LanguageManagement: {
              entities: {
                Language: {
                  properties: {
                    ServerExtra: {
                      type: 'System.String',
                      ui: {
                        onTable: { isVisible: true },
                        onCreateForm: { isVisible: true },
                        onEditForm: { isVisible: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
      injector.runInContext(languageManagementExtensionsResolver);
      const extensions = injector.get(ExtensionsService);
      const fields = extensions.createFormProps.get<LanguageDto>(Keys.Languages).props.toArray();
      expect(seen).toEqual([
        ['cultureName', 'uiCultureName', 'displayName', 'isEnabled', 'ServerExtra'],
      ]);
      expect(fields.find(prop => prop.name === 'ServerExtra')?.isExtra).toBe(true);
      expect(
        extensions.entityProps
          .get<LanguageDto>(Keys.Languages)
          .props.toArray()
          .some(prop => prop.name === 'ServerExtra'),
      ).toBe(true);
    } finally {
      injector.destroy();
    }
  });

  it('applies all five contributions without duplicating them on navigation', () => {
    const injector = createInjector(
      provideLanguageManagement({
        entityPropContributors: {
          [Keys.Languages]: [
            props =>
              props.addTail(
                EntityProp.create<LanguageDto>({ name: 'Custom', type: PropType.String }),
              ),
          ],
          [Keys.LanguageTexts]: [
            props =>
              props.addTail(
                EntityProp.create<LanguageTextDto>({ name: 'cultureName', type: PropType.String }),
              ),
          ],
        },
        createFormPropContributors: {
          [Keys.Languages]: [
            props =>
              props.addTail(
                FormProp.create<LanguageDto>({ name: 'CreateExtra', type: PropType.String }),
              ),
          ],
        },
        editFormPropContributors: {
          [Keys.Languages]: [
            props =>
              props.addTail(
                FormProp.create<LanguageDto>({ name: 'EditExtra', type: PropType.String }),
              ),
          ],
        },
        entityActionContributors: {
          [Keys.LanguageTexts]: [
            actions =>
              actions.dropByValue(
                'LanguageManagement::Edit',
                (action, name) => action.text === name,
              ),
          ],
        },
        toolbarActionContributors: {
          [Keys.Languages]: [
            actions =>
              actions.dropByValue(
                'LanguageManagement::CreateNewLanguage',
                (action, name) => action.text === name,
              ),
          ],
        },
      }),
    );
    try {
      injector.runInContext(languageManagementExtensionsResolver);
      injector.runInContext(languageManagementExtensionsResolver);
      const extensions = injector.get(ExtensionsService);
      expect(
        extensions.entityProps
          .get<LanguageDto>(Keys.Languages)
          .props.toArray()
          .map(prop => prop.name),
      ).toEqual(['displayName', 'cultureName', 'uiCultureName', 'isEnabled', 'Custom']);
      expect(
        extensions.entityProps
          .get<LanguageTextDto>(Keys.LanguageTexts)
          .props.toArray()
          .map(prop => prop.name),
      ).toEqual(['name', 'baseValue', 'value', 'resourceName', 'cultureName']);
      expect(
        extensions.createFormProps
          .get<LanguageDto>(Keys.Languages)
          .props.toArray()
          .map(prop => prop.name),
      ).toContain('CreateExtra');
      expect(
        extensions.editFormProps
          .get<LanguageDto>(Keys.Languages)
          .props.toArray()
          .map(prop => prop.name),
      ).toContain('EditExtra');
      expect(
        extensions.entityActions.get<LanguageTextDto>(Keys.LanguageTexts).actions.toArray(),
      ).toEqual([]);
      expect(
        extensions.toolbarActions.get<readonly LanguageDto[]>(Keys.Languages).actions.toArray(),
      ).toEqual([]);
    } finally {
      injector.destroy();
    }
  });
});
