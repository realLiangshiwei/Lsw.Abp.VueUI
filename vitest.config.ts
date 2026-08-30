import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

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
      },
    },
  },
});
