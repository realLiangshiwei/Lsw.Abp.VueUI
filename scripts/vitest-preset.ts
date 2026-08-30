import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig, type ViteUserConfig } from 'vitest/config';
import { workspaceAliases } from './workspace-aliases.ts';

export interface AbpTestOptions {
  /** Package root, always the caller's `import.meta.url` */
  packageUrl: string;
  /**
   * `node` for packages that are pure logic, `happy-dom` from the first component
   * onwards. Nothing in `core` should need the DOM one — that is the SSR rule showing up
   * in the test config.
   */
  environment?: 'node' | 'happy-dom';
}

/**
 * Shared Vitest config. Specs live next to the source as `*.spec.ts`, type tests as
 * `*.test-d.ts` (testing rules), and both run in the same command.
 */
export function defineAbpTestConfig(options: AbpTestOptions): ViteUserConfig {
  const root = dirname(fileURLToPath(options.packageUrl));

  return defineConfig({
    plugins: [vue()],
    // Siblings resolve to their source, so a test run needs no build step and a stack
    // trace points at the file being edited.
    resolve: { alias: workspaceAliases(resolve(root, '..')) },
    test: {
      root,
      environment: options.environment ?? 'node',
      // `*/src/**` covers secondary entry points such as `router/src` (design 03 §2).
      include: ['src/**/*.spec.ts', '*/src/**/*.spec.ts'],
      typecheck: {
        enabled: true,
        include: ['src/**/*.test-d.ts', '*/src/**/*.test-d.ts'],
        tsconfig: 'tsconfig.json',
        // Plain `tsc` cannot resolve a `.vue` import, and every package above `core`
        // has components.
        checker: 'vue-tsc',
      },
    },
  });
}
