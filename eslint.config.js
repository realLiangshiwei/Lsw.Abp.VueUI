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
const ALLOWED_IMPORTS = {
  utils: [],
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
const TEST_TOOLS = ['vitest', '@vue/test-utils', 'happy-dom'];

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

const layerRules = Object.entries(ALLOWED_IMPORTS).flatMap(([pkg, allowed]) => [
  layerRule(pkg, allowed, [`packages/${pkg}/**/*.{ts,mts,vue}`]),
  layerRule(
    pkg,
    [...allowed, ...TEST_TOOLS],
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
      'packages/*/proxy/**',
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
    files: ['packages/**/*.{ts,mts,vue}', 'playground/**/*.{ts,vue}'],
    plugins: { abp },
    rules: { 'abp/no-inject-after-await': 'error' },
  },

  {
    files: ['**/*.spec.ts', '**/*.test-d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      // A component test needs a handful of throwaway components around the one thing it
      // is about; splitting them across files would hide what is being tested.
      'vue/one-component-per-file': 'off',
    },
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
