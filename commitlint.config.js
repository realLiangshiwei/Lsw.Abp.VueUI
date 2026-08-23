import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

/** The package list of design 03 §3, so a commit can create the package it names. */
const plannedPackages = [
  'account',
  'account-core',
  'cli',
  'components',
  'core',
  'feature-management',
  'identity',
  'oauth',
  'permission-management',
  'setting-management',
  'tenant-management',
  'theme-basic',
  'theme-fluent',
  'theme-shared',
  'utils',
];

const existingPackages = readdirSync(join(root, 'packages'), { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name);

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        ...new Set([...plannedPackages, ...existingPackages]),
        'repo',
        'ci',
        'deps',
        'docs',
        'e2e',
        'playground',
        'templates',
      ],
    ],
  },
};
