import { EntityProp, ExtensionsService, FormProp, PropType } from '@lsw-abpvue/components';
import { ConfigStateService, createInjector } from '@lsw-abpvue/core';
import type { EditionDto, SaasTenantDto } from '@lsw-abpvue/saas/proxy';
import { describe, expect, it } from 'vitest';
import { SaasComponents } from '../enums/components.js';
import { provideSaas } from '../providers/saas.provider.js';
import { saasExtensionsResolver } from './extensions.resolver.js';

describe('SaaS extension assembly', () => {
  it('keeps all official actions and fields and assembles backend extensions before host contributions', () => {
    const seen: string[][] = [];
    const injector = createInjector(
      provideSaas({
        entityPropContributors: {
          [SaasComponents.Tenants]: [
            props => {
              seen.push(props.toArray().map(prop => prop.name));
              props.addTail(
                EntityProp.create<SaasTenantDto>({ name: 'Host', type: PropType.String }),
              );
            },
          ],
          [SaasComponents.Editions]: [
            props =>
              props.addTail(
                EntityProp.create<EditionDto>({ name: 'HostEdition', type: PropType.String }),
              ),
          ],
        },
        createFormPropContributors: {
          [SaasComponents.Tenants]: [
            props =>
              props.addTail(
                FormProp.create<SaasTenantDto>({ name: 'CreateOnly', type: PropType.String }),
              ),
          ],
        },
        editFormPropContributors: {
          [SaasComponents.Editions]: [
            props =>
              props.addTail(
                FormProp.create<EditionDto>({ name: 'EditOnly', type: PropType.String }),
              ),
          ],
        },
        entityActionContributors: {
          [SaasComponents.Tenants]: [
            actions => actions.dropByValue('Saas::Delete', (action, text) => action.text === text),
          ],
        },
        toolbarActionContributors: {
          [SaasComponents.Editions]: [
            actions =>
              actions.dropByValue('Saas::NewEdition', (action, text) => action.text === text),
          ],
        },
      }),
    );
    const config = injector.get(ConfigStateService);
    config.setState({
      ...config.snapshot(),
      objectExtensions: {
        modules: {
          Saas: {
            entities: {
              Tenant: {
                properties: {
                  Region: {
                    type: 'System.String',
                    typeSimple: 'string',
                    api: {
                      onGet: { isAvailable: true },
                      onCreate: { isAvailable: true },
                      onUpdate: { isAvailable: true },
                    },
                    ui: {
                      onTable: { isVisible: true },
                      onCreateForm: { isVisible: true },
                      onEditForm: { isVisible: true },
                    },
                  },
                },
              },
              Edition: {
                properties: {
                  Tier: {
                    type: 'System.String',
                    typeSimple: 'string',
                    api: {
                      onGet: { isAvailable: true },
                      onCreate: { isAvailable: true },
                      onUpdate: { isAvailable: true },
                    },
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
    const extensions = injector.get(ExtensionsService);
    for (let run = 0; run < 2; run++) {
      injector.runInContext(saasExtensionsResolver);
      expect(
        extensions.entityProps
          .get<SaasTenantDto>(SaasComponents.Tenants)
          .props.toArray()
          .map(prop => prop.name),
      ).toEqual(['name', 'editionName', 'editionEndDateUtc', 'activationState', 'Region', 'Host']);
      expect(
        extensions.entityProps
          .get<EditionDto>(SaasComponents.Editions)
          .props.toArray()
          .map(prop => prop.name),
      ).toEqual(['displayName', 'tenantCount', 'Tier', 'HostEdition']);
      expect(
        extensions.entityActions
          .get(SaasComponents.Tenants)
          .actions.toArray()
          .map(action => action.text),
      ).toEqual([
        'Saas::Edit',
        'Saas::ConnectionStrings',
        'Saas::ApplyDatabaseMigrations',
        'Saas::Features',
        'Saas::ChangeHistory',
        'Saas::LoginWithThisTenant',
        'Saas::SetPassword',
        'Saas::InviteUser',
      ]);
      expect(
        extensions.entityActions
          .get(SaasComponents.Editions)
          .actions.toArray()
          .map(action => action.text),
      ).toEqual([
        'Saas::Edit',
        'Saas::Features',
        'Saas::ChangeHistory',
        'Saas::Delete',
        'Saas::MoveAllTenants',
      ]);
      expect(
        extensions.createFormProps
          .get(SaasComponents.Tenants)
          .props.toArray()
          .map(prop => prop.name),
      ).toContain('CreateOnly');
      expect(
        extensions.editFormProps
          .get(SaasComponents.Tenants)
          .props.toArray()
          .map(prop => prop.name),
      ).not.toContain('adminPassword');
      expect(
        extensions.editFormProps
          .get(SaasComponents.Editions)
          .props.toArray()
          .map(prop => prop.name),
      ).toContain('EditOnly');
      expect(extensions.toolbarActions.get(SaasComponents.Editions).actions.toArray()).toEqual([]);
    }
    expect(seen).toEqual([
      ['name', 'editionName', 'editionEndDateUtc', 'activationState', 'Region'],
      ['name', 'editionName', 'editionEndDateUtc', 'activationState', 'Region'],
    ]);
    injector.destroy();
  });
  it('can run without an active injector', () => expect(saasExtensionsResolver).not.toThrow());
});
