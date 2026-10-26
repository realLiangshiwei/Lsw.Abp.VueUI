import { EntityProp, ExtensionsService, PropType, ToolbarAction } from '@lsw-abpvue/components';
import { ConfigStateService, createInjector } from '@lsw-abpvue/core';
import type { TemplateDefinitionDto } from '@lsw-abpvue/text-template-management/proxy';
import { describe, expect, it } from 'vitest';
import { TextTemplateManagementComponents as Keys } from '../enums/components.js';
import { provideTextTemplateManagement } from '../providers/text-template-management.provider.js';
import { textTemplateManagementExtensionsResolver } from './extensions.resolver.js';

describe('text template extensions', () => {
  it('assembles TextDefinition backend columns before host contributions', () => {
    const seen: string[][] = [];
    const injector = createInjector(
      provideTextTemplateManagement({
        entityPropContributors: {
          [Keys.TextTemplates]: [
            props => {
              seen.push(props.toArray().map(prop => prop.name));
              props.dropByValue('ServerLabel', (prop, name) => prop.name === name);
              props.addHead(
                EntityProp.create<TemplateDefinitionDto>({
                  name: 'ServerLabel',
                  displayName: 'Host label',
                  type: PropType.String,
                  isExtra: true,
                }),
              );
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
            TextTemplateManagement: {
              entities: {
                TextDefinition: {
                  properties: {
                    ServerLabel: {
                      type: 'System.String',
                      typeSimple: 'string',
                      ui: { onTable: { isVisible: true } },
                    },
                  },
                },
                TemplateDefinition: {
                  properties: {
                    WrongEntity: {
                      type: 'System.String',
                      typeSimple: 'string',
                      ui: { onTable: { isVisible: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });
      injector.runInContext(textTemplateManagementExtensionsResolver);
      const columns = injector
        .get(ExtensionsService)
        .entityProps.get<TemplateDefinitionDto>(Keys.TextTemplates)
        .props.toArray();
      expect(seen).toEqual([
        [
          'displayName',
          'isInlineLocalized',
          'isLayout',
          'layout',
          'defaultCultureName',
          'ServerLabel',
        ],
      ]);
      expect(columns[0]).toMatchObject({
        name: 'ServerLabel',
        displayName: 'Host label',
        isExtra: true,
      });
    } finally {
      injector.destroy();
    }
  });

  it('lets the host change all three default sets without duplicating contributions', () => {
    const injector = createInjector(
      provideTextTemplateManagement({
        entityActionContributors: {
          [Keys.TextTemplates]: [
            actions =>
              actions.dropByValue(
                'TextTemplateManagement::EditContents',
                (action, text) => action.text === text,
              ),
          ],
        },
        entityPropContributors: {
          [Keys.TextTemplates]: [
            props =>
              props.addTail(
                EntityProp.create<TemplateDefinitionDto>({
                  name: 'renderEngine',
                  type: PropType.String,
                }),
              ),
          ],
        },
        toolbarActionContributors: {
          [Keys.TextTemplates]: [
            actions =>
              actions.addTail(
                ToolbarAction.create<readonly TemplateDefinitionDto[]>({
                  text: 'Custom action',
                  action: () => {},
                }),
              ),
          ],
        },
      }),
    );
    try {
      injector.runInContext(textTemplateManagementExtensionsResolver);
      injector.runInContext(textTemplateManagementExtensionsResolver);
      const extensions = injector.get(ExtensionsService);
      expect(
        extensions.entityActions.get<TemplateDefinitionDto>(Keys.TextTemplates).actions.toArray(),
      ).toEqual([]);
      expect(
        extensions.entityProps
          .get<TemplateDefinitionDto>(Keys.TextTemplates)
          .props.toArray()
          .map(prop => prop.name),
      ).toEqual([
        'displayName',
        'isInlineLocalized',
        'isLayout',
        'layout',
        'defaultCultureName',
        'renderEngine',
      ]);
      expect(
        extensions.toolbarActions
          .get<readonly TemplateDefinitionDto[]>(Keys.TextTemplates)
          .actions.toArray()
          .map(action => action.text),
      ).toEqual(['Custom action']);
    } finally {
      injector.destroy();
    }
  });
});
