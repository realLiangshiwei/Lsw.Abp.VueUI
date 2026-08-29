import { builtinModules } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig, type UserConfig } from 'vite';

export interface AbpLibOptions {
  /** Package root, always the caller's `import.meta.url` */
  packageUrl: string;
  /**
   * The entry map. Keys are the output paths under `dist/` without an extension, values are
   * relative to the package root. A secondary entry follows the convention of design 03:
   * `{ index: 'src/index.ts', 'config/index': 'config/src/index.ts' }`
   */
  entries: Record<string, string>;
  /** What to keep external beyond the framework and `@lsw-abpvue/*` */
  external?: (string | RegExp)[];
}

const FRAMEWORK_EXTERNALS = [/^vue$/, /^vue-router$/, /^@vue\//];
const WORKSPACE_EXTERNALS = [/^@lsw-abpvue\//];
const NODE_EXTERNALS = [...builtinModules.map(m => new RegExp(`^${m}$`)), /^node:/];

/**
 * The shared library-mode configuration. ESM only -- in the age of Vue 3.5 and Vite 8 there
 * is no call for CJS; if anyone asks, it can be added.
 *
 * Declarations are not emitted here: `vue-tsc -p tsconfig.build.json` produces them, and
 * M0 measured vue-tsc emitting correct `.d.ts` for both `.ts` and `.vue`;
 * one plugin fewer is one fewer thing to get stuck on across a major Vite or TS release.
 */
export function defineAbpLibConfig(options: AbpLibOptions): UserConfig {
  const root = dirname(fileURLToPath(options.packageUrl));
  const entry = Object.fromEntries(
    Object.entries(options.entries).map(([name, file]) => [name, resolve(root, file)]),
  );

  return defineConfig({
    plugins: [vue()],
    build: {
      target: 'es2022',
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true,
      minify: false,
      lib: {
        entry,
        formats: ['es'],
        fileName: (_format, entryName) => `${entryName}.js`,
      },
      rollupOptions: {
        external: [
          ...FRAMEWORK_EXTERNALS,
          ...WORKSPACE_EXTERNALS,
          ...NODE_EXTERNALS,
          ...(options.external ?? []),
        ],
        output: {
          chunkFileNames: 'chunks/[name]-[hash].js',
        },
      },
    },
  });
}
