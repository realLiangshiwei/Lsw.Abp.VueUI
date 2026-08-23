import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig, type ViteUserConfig } from 'vitest/config';

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
    test: {
      root,
      environment: options.environment ?? 'node',
      include: ['src/**/*.spec.ts'],
      typecheck: {
        enabled: true,
        include: ['src/**/*.test-d.ts'],
        tsconfig: 'tsconfig.json',
      },
    },
  });
}
