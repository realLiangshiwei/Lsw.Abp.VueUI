import js from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import abp from './scripts/eslint-rules/index.js';

const FRAMEWORK = ['vue', 'vue-router'];
const UTILS = '@lsw-abpvue/utils';
const CORE = '@lsw-abpvue/core';
const THEME_SHARED = '@lsw-abpvue/theme-shared';
const COMPONENTS = '@lsw-abpvue/components';
const ACCOUNT_CORE = '@lsw-abpvue/account-core';

const BUSINESS_MODULES = [
  '@lsw-abpvue/account',
  '@lsw-abpvue/feature-management',
  '@lsw-abpvue/identity',
  '@lsw-abpvue/permission-management',
  '@lsw-abpvue/setting-management',
  '@lsw-abpvue/tenant-management',
];

/**
 * The dependency matrix of design 03 §1, keyed by package directory. A package may only
 * import the bare specifiers listed for it; relative imports are always fine.
 *
 * The matrix in the design doc lists *declared* dependencies, the way ABP Angular does.
 * `core` is a transitive peer of everything above it and every layer uses its services,
 * so it is importable from `theme-basic` and the business modules even though their
 * declared dependency is `theme-shared`.
 */
const NODE_BUILTINS = [
  // `abp new` is another program, and its output is meant to be watched as it runs.
  'node:child_process',
  'node:fs',
  'node:fs/promises',
  // The tests write their proxies into a temporary directory.
  'node:os',
  'node:path',
  'node:process',
  'node:url',
];

const ALLOWED_IMPORTS = {
  utils: [],
  // A build-time tool, not part of any application bundle: no framework, no workspace
  // package, and the Node APIs it needs listed one by one.
  cli: [...NODE_BUILTINS, '@clack/prompts', 'citty', 'jsonc-parser', 'prettier'],
  core: [...FRAMEWORK, UTILS],
  oauth: [...FRAMEWORK, UTILS, CORE, 'oidc-client-ts'],
  'theme-shared': [...FRAMEWORK, UTILS, CORE],
  'account-core': [...FRAMEWORK, UTILS, CORE],
  components: [...FRAMEWORK, UTILS, CORE, THEME_SHARED, '@tanstack/vue-table'],
  'theme-basic': [
    ...FRAMEWORK,
    UTILS,
    CORE,
    THEME_SHARED,
    COMPONENTS,
    ACCOUNT_CORE,
    'reka-ui',
    'bootstrap',
    'bootstrap-icons',
  ],
  ...Object.fromEntries(
    BUSINESS_MODULES.map(name => [
      name.slice('@lsw-abpvue/'.length),
      [...FRAMEWORK, UTILS, CORE, THEME_SHARED, COMPONENTS, ACCOUNT_CORE, ...BUSINESS_MODULES],
    ]),
  ),
};

/**
 * `no-restricted-imports` only understands denylists, but the matrix is an allowlist, so
 * this denies every bare specifier and carves the allowed ones back out. Written as a
 * regex rather than a glob group because gitignore semantics refuse to re-include a path
 * whose parent directory is already excluded, which every `@scope/name` hits.
 */
function onlyAllow(allowed) {
  const escape = name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const exceptions = ['\\.', ...allowed.flatMap(name => [`${escape(name)}$`, `${escape(name)}/`])];

  return `^(?!${exceptions.join('|')})`;
}

/** Available to every package's tests, on top of whatever its layer allows. */
const TEST_TOOLS = ['vitest', '@vue/test-utils', 'happy-dom', 'axe-core'];

function layerRule(pkg, allowed, files) {
  return {
    files,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: onlyAllow(allowed),
              message: `packages/${pkg} may only import ${allowed.join(', ') || 'nothing'} (design 03 §1). Crossing a layer here is how the DI tokens end up duplicated.`,
            },
          ],
        },
      ],
    },
  };
}

/**
 * A secondary entry point reaches the package's main entry by package name, because it
 * is built and typed on its own (design 03 §2). That is not a layer crossing.
 */
const layerRules = Object.entries(ALLOWED_IMPORTS).flatMap(([pkg, allowed]) => [
  layerRule(pkg, [...allowed, `@lsw-abpvue/${pkg}`], [`packages/${pkg}/**/*.{ts,mts,vue}`]),
  layerRule(
    pkg,
    [...allowed, `@lsw-abpvue/${pkg}`, ...TEST_TOOLS],
    [`packages/${pkg}/**/*.spec.ts`, `packages/${pkg}/**/*.test-d.ts`],
  ),
]);

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/.turbo/**',
      'e2e/backend/**',
      // Generated proxies: `abpvue proxy add` writes what the backend describes, enums
      // included, and the rules here are about code someone writes.
      'packages/*/proxy/**',
      'packages/*/src/proxy/**',
      'playground/src/proxy/**',
      'e2e/proxy/**',
    ],
  },

  js.configs.recommended,
  tseslint.configs.recommended,
  pluginVue.configs['flat/recommended'],

  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { parser: tseslint.parser },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      // `interface X extends Y {}` is how a union is merged into an augmentable
      // interface, which is what a generated `policy-names.ts` asks an application to do.
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'with-single-extends' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message:
            'Use a `const` object with `as const`, or a string literal union. Enums are not erasable and do not tree-shake (code-style). Generated proxy code is exempt.',
        },
      ],
      'vue/no-v-html': 'error',
      'vue/multi-word-component-names': ['error', { ignores: ['App'] }],
    },
  },

  ...layerRules,

  // The `testing` entry point of theme-shared is the theme contract suite, so it imports
  // the test tools the way a spec does. That is what it is (design 06 §6).
  layerRule(
    'theme-shared/testing',
    [...ALLOWED_IMPORTS['theme-shared'], '@lsw-abpvue/theme-shared', ...TEST_TOOLS],
    ['packages/theme-shared/testing/**/*.{ts,mts,vue}'],
  ),

  {
    // SSR discipline: the platform services are the one place allowed to reach for the
    // browser, so `core` stays importable from a server renderer (design 01, T0.4).
    files: ['packages/core/**/*.{ts,mts,vue}'],
    ignores: ['packages/core/src/services/platform/**'],
    rules: {
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'localStorage', 'sessionStorage', 'navigator', 'location'].map(
          name => ({
            name,
            message: `Go through WindowService / DocumentService / StorageService / CookieService instead. Only core/src/services/platform may touch \`${name}\`.`,
          }),
        ),
      ],
    },
  },

  {
    // The injection context does not survive an await, and the runtime error it produces
    // names the wrong place, so the mistake is caught here instead (design 02 §5).
    files: ['packages/**/*.{ts,mts,vue}', 'playground/**/*.{ts,vue}', 'templates/**/*.{ts,vue}'],
    plugins: { abp },
    rules: { 'abp/no-inject-after-await': 'error' },
  },

  {
    files: ['**/*.spec.ts', '**/*.test-d.ts', 'packages/theme-shared/testing/src/plain-*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      // A component test needs a handful of throwaway components around the one thing it
      // is about; splitting them across files would hide what is being tested. The same
      // goes for the reference theme, which is one file precisely so it can be read as
      // one answer to "what does a theme have to implement".
      'vue/one-component-per-file': 'off',
    },
  },

  {
    // The CLI runs on Node, and the console it writes to is Node's.
    files: ['packages/cli/**/*.ts'],
    languageOptions: { globals: globals.node },
  },

  {
    files: [
      'scripts/**/*.{ts,mts,mjs,js}',
      '*.config.{js,ts}',
      '**/vite.config.ts',
      '**/vitest.config.ts',
    ],
    languageOptions: { globals: globals.node },
    rules: { 'no-restricted-imports': 'off' },
  },

  prettier,
);
