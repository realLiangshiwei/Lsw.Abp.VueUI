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
      include: ['packages/*/src/**/*.{ts,vue}'],
      exclude: ['**/*.spec.ts', '**/*.test-d.ts', '**/index.ts'],
      // Targets are core and components/extensible 80%, the DI kernel 95%, everything
      // else 60% (testing rules). Held at zero through M0 and raised as each package
      // lands, so the gate never blocks work that has no implementation yet.
      thresholds: { lines: 0, functions: 0, branches: 0, statements: 0 },
    },
  },
});
