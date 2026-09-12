import type { ApiDefinition } from '../api-definition/models.js';
import type { EmittedFile } from './emit-models.js';
import { pascalCase } from './names.js';
import type { GenerationReport } from './report.js';

const HEADER = [
  '// The permission names the backend declares, so a check is a name the compiler knows',
  '// rather than a string that quietly answers no when it is misspelled.',
  '//',
  '// To have a mistyped name stop compiling, merge the union into core once, anywhere in',
  '// the application:',
  '//',
  "//   declare module '@lsw-abpvue/core' {",
  '//     interface AbpKnownPolicyName extends Record<AbpIdentityPolicyName, true> {}',
  '//   }',
  '//',
  '// Merging nothing is fine: `isGranted` keeps taking any string until something is',
  '// merged in.',
].join('\n');

/**
 * The permission names an `api-definition` states. ABP only fills this in for endpoints
 * whose controller carries `[Authorize]`, which is the application's own app services;
 * its own modules authorize in the application layer, behind an HTTP API controller that
 * says nothing.
 */
export function policyNamesFromDefinition(definition: ApiDefinition, modules: string[]): string[] {
  const names = new Set<string>();

  for (const name of modules) {
    const module = definition.modules[name];
    if (!module) continue;

    for (const controller of Object.values(module.controllers)) {
      for (const action of Object.values(controller.actions)) {
        for (const authorization of action.authorizeDatas ?? []) {
          if (authorization.policy) names.add(authorization.policy);
        }
      }
    }
  }

  return [...names];
}

/** `AbpIdentity.Users.Create` is `UsersCreate` in the group `AbpIdentity`. */
function memberNameOf(policy: string, group: string): string {
  const rest = policy.slice(group.length).replace(/^\./, '');

  return rest ? pascalCase(rest.split('.').join(' ')) : 'Default';
}

function groupOf(policy: string): string {
  return policy.split('.')[0] ?? policy;
}

/**
 * One constant per permission group, which is the only grouping the backend states: the
 * names share a prefix and nothing says which npm package they will end up in.
 *
 * @param names Every permission name that was found, in any order
 * @param report Where it is recorded that there were none, and why that happens
 */
export function emitPolicyNames(names: string[], report: GenerationReport): EmittedFile[] {
  if (names.length === 0) {
    report.add(
      'skipped',
      'No permission names were found. ABP fills in the authorization of an endpoint only when ' +
        'the controller itself carries [Authorize], which its own modules do not -- they authorize ' +
        'in the application service behind it. Pass --token to read the names from ' +
        'application-configuration instead.',
    );
    return [];
  }

  const byGroup = new Map<string, string[]>();
  for (const policy of [...new Set(names)].sort()) {
    const group = groupOf(policy);
    byGroup.set(group, [...(byGroup.get(group) ?? []), policy]);
  }

  const constants = [...byGroup]
    .sort(([left], [right]) => (left < right ? -1 : 1))
    .map(([group, policies]) => {
      const identifier = `${pascalCase(group)}PolicyNames`;
      const members = policies.map(policy => `  ${memberNameOf(policy, group)}: '${policy}',`);

      return [
        `export const ${identifier} = {`,
        ...members,
        '} as const;',
        '',
        `export type ${pascalCase(group)}PolicyName =`,
        `  (typeof ${identifier})[keyof typeof ${identifier}];`,
      ].join('\n');
    });

  return [{ path: 'policy-names.ts', content: `${HEADER}\n\n${constants.join('\n\n')}\n` }];
}
