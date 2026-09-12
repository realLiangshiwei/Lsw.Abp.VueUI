import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';
import { workspaceAliases } from './scripts/workspace-aliases.ts';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    projects: [
      'packages/*',
      {
        // Tests for the build tooling itself: the architecture lint rules, the alias
        // resolution the playground depends on.
        test: {
          name: 'tooling',
          root,
          include: ['scripts/**/*.spec.ts'],
          environment: 'node',
        },
      },
      {
        // The generated proxy against the backend it was generated from: the one thing
        // no unit test can answer. `core` is reached through its source, components and
        // all, so the plugin that compiles them has to be here too.
        plugins: [vue()],
        resolve: { alias: workspaceAliases(resolve(root, 'packages')) },
        test: {
          name: 'e2e',
          root,
          include: ['e2e/specs/**/*.spec.ts'],
          environment: 'node',
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      // The second pattern is the secondary entry points (`core/router/src`), which the
      // first one silently missed — a whole entry point outside the gate.
      include: ['packages/*/src/**/*.{ts,vue}', 'packages/*/*/src/**/*.{ts,vue}'],
      exclude: ['**/*.spec.ts', '**/*.test-d.ts', '**/index.ts'],
      // Targets are core and components/extensible 80%, the DI kernel 95%, everything
      // else 60% (testing rules). Raised as each package lands, so the gate never blocks
      // work that has no implementation yet.
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        'packages/core/src/di/**': { lines: 95, functions: 95, branches: 95, statements: 95 },
        // The extension system carries every module page after it (testing rules).
        'packages/components/src/**': { lines: 80, functions: 80, branches: 80, statements: 80 },
      },
    },
  },
});
