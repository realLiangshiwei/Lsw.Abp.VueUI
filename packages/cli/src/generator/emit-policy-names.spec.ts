import { describe, expect, it } from 'vitest';
import type { ApiDefinition } from '../api-definition/models.js';
import { emitPolicyNames, policyNamesFromDefinition } from './emit-policy-names.js';
import { GenerationReport } from './report.js';

function emit(names: string[]) {
  const report = new GenerationReport();
  const files = emitPolicyNames(names, report);

  return { report, content: files[0]?.content ?? '', path: files[0]?.path };
}

describe('the permission names', () => {
  const { content, path } = emit([
    'AbpIdentity.Users.Create',
    'AbpIdentity.Users',
    'AbpIdentity.Users.Update.ManageRoles',
    'SettingManagement.Emailing',
  ]);

  it('are one file, grouped the way the backend groups them', () => {
    expect(path).toBe('policy-names.ts');
    expect(content).toContain('export const AbpIdentityPolicyNames = {');
    expect(content).toContain('export const SettingManagementPolicyNames = {');
  });

  it('name each member after what follows the group', () => {
    expect(content).toContain("Users: 'AbpIdentity.Users',");
    expect(content).toContain("UsersCreate: 'AbpIdentity.Users.Create',");
    expect(content).toContain("UsersUpdateManageRoles: 'AbpIdentity.Users.Update.ManageRoles',");
  });

  it('come with the union a project merges into core', () => {
    expect(content).toContain(
      'export type AbpIdentityPolicyName =\n  (typeof AbpIdentityPolicyNames)[keyof typeof AbpIdentityPolicyNames];',
    );
  });

  it('say in the file itself how to merge them', () => {
    expect(content).toContain("declare module '@lsw-abpvue/core'");
  });
});

describe('a backend that states no authorization', () => {
  it('writes no file, and says why there was nothing to write', () => {
    const report = new GenerationReport();

    expect(emitPolicyNames([], report)).toEqual([]);
    expect(report.of('skipped')[0]).toMatch(/--token/);
  });
});

describe('reading them off the actions', () => {
  const definition = {
    modules: {
      app: {
        rootPath: 'app',
        remoteServiceName: 'Default',
        controllers: {
          'Acme.BookController': {
            controllerName: 'Book',
            isRemoteService: true,
            isIntegrationService: false,
            type: 'Acme.BookController',
            actions: {
              GetListAsync: {
                uniqueName: 'GetListAsync',
                name: 'GetListAsync',
                httpMethod: 'GET',
                url: 'api/app/book',
                parametersOnMethod: [],
                parameters: [],
                returnValue: { type: 'System.Void', typeSimple: 'System.Void' },
                authorizeDatas: [{ policy: 'BookStore.Books' }, { policy: null }],
              },
            },
          },
        },
      },
    },
    types: {},
  } satisfies ApiDefinition;

  it('takes the policy of every action that carries one', () => {
    expect(policyNamesFromDefinition(definition, ['app'])).toEqual(['BookStore.Books']);
  });

  it('ignores a module that was not asked for', () => {
    expect(policyNamesFromDefinition(definition, ['identity'])).toEqual([]);
  });
});
