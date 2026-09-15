import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const packagesRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'packages');

/**
 * What each package is allowed to declare, from the matrix of design 03 §1. The lint
 * rules police imports; this polices the manifest, which is what a consumer installs.
 *
 * `theme-shared` is the one that matters most: the moment a UI library appears in its
 * dependencies, the contract layer has stopped being one and the second theme starts
 * carrying something it can never use (design 06, rule 2).
 */
const ALLOWED = {
  utils: [],
  // A development tool that runs on Node and ships no runtime code, so nothing from the
  // workspace and nothing from the framework belongs in it.
  cli: ['@clack/prompts', 'citty', 'prettier'],
  core: ['@lsw-abpvue/utils', 'vue', 'vue-router'],
  oauth: ['@lsw-abpvue/core', '@lsw-abpvue/utils', 'oidc-client-ts', 'vue', 'vue-router'],
  'theme-shared': [
    '@lsw-abpvue/core',
    '@lsw-abpvue/utils',
    'vue',
    // The contract test suite ships from `./testing` and is never in an application
    // bundle; all three are optional peers a consumer only needs to run it.
    '@vue/test-utils',
    'axe-core',
    'vitest',
  ],
  account: [
    '@lsw-abpvue/account-core',
    '@lsw-abpvue/components',
    '@lsw-abpvue/core',
    '@lsw-abpvue/theme-shared',
    '@lsw-abpvue/utils',
    'vue',
    'vue-router',
  ],
  'account-core': ['@lsw-abpvue/core', '@lsw-abpvue/utils', 'vue', 'vue-router'],
  components: [
    '@lsw-abpvue/core',
    '@lsw-abpvue/theme-shared',
    '@lsw-abpvue/utils',
    // Headless, unstyled and with no visual opinion of its own, which is the whole
    // reason this package may have a table library at all (design 01 §3).
    '@tanstack/vue-table',
    'vue',
  ],
  identity: [
    '@lsw-abpvue/components',
    '@lsw-abpvue/core',
    // The grant dialog, opened from a row action on both pages (design 03 §1).
    '@lsw-abpvue/permission-management',
    '@lsw-abpvue/theme-shared',
    '@lsw-abpvue/utils',
    'vue',
    'vue-router',
  ],
  'permission-management': [
    '@lsw-abpvue/core',
    '@lsw-abpvue/theme-shared',
    '@lsw-abpvue/utils',
    'vue',
  ],
  'theme-basic': [
    // The account layout draws the tenant box and the card the account pages sit in, and
    // neither has any UI of its own to bring (design 03 §1).
    '@lsw-abpvue/account-core',
    '@lsw-abpvue/core',
    '@lsw-abpvue/theme-shared',
    '@lsw-abpvue/utils',
    'bootstrap',
    'bootstrap-icons',
    'reka-ui',
    'vue',
    'vue-router',
  ],
} as const satisfies Record<string, readonly string[]>;

interface Manifest {
  name: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

const directories = readdirSync(packagesRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name);

function manifestOf(name: string): Manifest {
  return JSON.parse(readFileSync(join(packagesRoot, name, 'package.json'), 'utf8')) as Manifest;
}

describe('what each package declares', () => {
  it.each(directories)('%s is in the matrix at all', name => {
    expect(Object.keys(ALLOWED)).toContain(name);
  });

  it.each(directories)('%s declares nothing outside the matrix', name => {
    const allowed = (ALLOWED as Record<string, readonly string[]>)[name] ?? [];
    const manifest = manifestOf(name);
    const declared = [
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.peerDependencies ?? {}),
    ];

    expect(declared.filter(entry => !allowed.includes(entry))).toEqual([]);
  });

  it.each(directories)('%s depends on its siblings as peers, never as dependencies', name => {
    const dependencies = Object.keys(manifestOf(name).dependencies ?? {});

    // One copy of a package means one copy of its DI tokens; two means every injection
    // through the second one fails to resolve (design 03 §2).
    expect(dependencies.filter(entry => entry.startsWith('@lsw-abpvue/'))).toEqual([]);
  });

  it('keeps every UI library out of the contract layer', () => {
    const manifest = manifestOf('theme-shared');
    const declared = [
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.peerDependencies ?? {}),
    ];

    for (const library of [
      'reka-ui',
      'bootstrap',
      '@fluentui/web-components',
      '@tanstack/vue-table',
    ]) {
      expect(declared).not.toContain(library);
    }
  });
});
