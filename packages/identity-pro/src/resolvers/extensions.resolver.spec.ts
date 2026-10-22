import { EntityProp, ExtensionsService, FormProp, PropType } from '@lsw-abpvue/components';
import {
  ConfigStateService,
  createInjector,
  type ApplicationConfigurationDto,
} from '@lsw-abpvue/core';
import { IdentityComponents } from '@lsw-abpvue/identity';
import type {
  IdentityRoleDto,
  ClaimTypeDto,
  IdentityUserDto,
} from '@lsw-abpvue/identity-pro/proxy';
import { describe, expect, it } from 'vitest';
import configurationFixture from '../../../../e2e/fixtures/application-configuration.json';
import { provideIdentityPro } from '../providers/identity-pro.provider.js';
import { identityProExtensionsResolver } from './extensions.resolver.js';
import { IdentityProComponents } from '../enums/components.js';

const key = IdentityComponents.Users;

describe('commercial extension assembly', () => {
  it('assembles role and claim type contributors after commercial defaults and backend extensions', () => {
    const observed: string[][] = [];
    const injector = createInjector(
      provideIdentityPro({
        entityPropContributors: {
          [IdentityProComponents.Roles]: [
            list => {
              observed.push(list.toArray().map(prop => prop.name));
              list.addTail(
                EntityProp.create<IdentityRoleDto>({ name: 'roleHost', type: PropType.String }),
              );
            },
          ],
          [IdentityProComponents.Claims]: [
            list => {
              observed.push(list.toArray().map(prop => prop.name));
              list.addTail(
                EntityProp.create<ClaimTypeDto>({ name: 'claimHost', type: PropType.String }),
              );
            },
          ],
        },
      }),
    );
    injector
      .get(ConfigStateService)
      .setState(configurationFixture as unknown as ApplicationConfigurationDto);
    const extensions = injector.get(ExtensionsService);
    for (let run = 0; run < 2; run += 1) {
      injector.runInContext(identityProExtensionsResolver);
      expect(
        extensions.entityProps
          .get<IdentityRoleDto>(IdentityProComponents.Roles)
          .props.toArray()
          .map(prop => prop.name),
      ).toEqual(['name', 'userCount', 'Department', 'roleHost']);
      const claimNames = extensions.entityProps
        .get<ClaimTypeDto>(IdentityProComponents.Claims)
        .props.toArray()
        .map(prop => prop.name);
      expect(claimNames).toContain('valueType');
      expect(claimNames.filter(name => name === 'claimHost')).toHaveLength(1);
    }
    expect(observed[0]).toEqual(['name', 'userCount', 'Department']);
    expect(observed[2]).toEqual(observed[0]);
    injector.destroy();
  });

  it('runs backend extensions before host callbacks and never restores base user defaults', () => {
    const observed: string[][] = [];
    const injector = createInjector(
      provideIdentityPro({
        entityPropContributors: {
          [key]: [
            list => {
              observed.push(list.toArray().map(prop => prop.name));
              list.dropByValue('roleNames', (prop, name) => prop.name === name);
              list.addTail(
                EntityProp.create<IdentityUserDto>({ name: 'hostColumn', type: PropType.String }),
              );
            },
          ],
        },
        editFormPropContributors: {
          [key]: [
            list =>
              list.addTail(
                FormProp.create<IdentityUserDto>({ name: 'hostField', type: PropType.String }),
              ),
          ],
        },
        entityActionContributors: {
          [IdentityComponents.Roles]: [
            list => list.dropByValue('AbpUi::Delete', (action, text) => action.text === text),
          ],
        },
      }),
    );
    injector
      .get(ConfigStateService)
      .setState(configurationFixture as unknown as ApplicationConfigurationDto);
    const extensions = injector.get(ExtensionsService);
    for (let run = 0; run < 2; run += 1) {
      injector.runInContext(identityProExtensionsResolver);
      const columns = extensions.entityProps.get<IdentityUserDto>(key).props.toArray();
      expect(columns.map(prop => prop.name)).toContain('hostColumn');
      expect(columns.map(prop => prop.name)).not.toContain('roleNames');
      expect(columns.filter(prop => prop.name === 'hostColumn')).toHaveLength(1);
      const fields = extensions.editFormProps.get<IdentityUserDto>(key).props.toArray();
      expect(fields.map(prop => prop.name)).toContain('shouldChangePasswordOnNextLogin');
      expect(fields.map(prop => prop.name)).toContain('hostField');
      expect(fields.map(prop => prop.name)).not.toContain('password');
      expect(
        extensions.entityActions
          .get(IdentityComponents.Roles)
          .actions.toArray()
          .map(action => action.text),
      ).not.toContain('AbpUi::Delete');
    }
    expect(observed).toHaveLength(2);
    expect(observed[0]).toContain('SocialSecurityNumber');
    expect(observed[0]).toContain('twoFactorEnabled');
    expect(observed[1]).toEqual(observed[0]);
    injector.destroy();
  });

  it('can be invoked outside an injector context', () => {
    expect(identityProExtensionsResolver).not.toThrow();
  });
});
