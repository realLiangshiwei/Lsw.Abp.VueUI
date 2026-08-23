import { builtinModules } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig, type UserConfig } from 'vite';

export interface AbpLibOptions {
  /** 包根目录，一律传调用方的 `import.meta.url` */
  packageUrl: string;
  /**
   * 入口表。键是产物在 `dist/` 下的相对路径（不含扩展名），
   * 值是相对包根的源文件路径。二级入口照设计 03 的约定命名：
   * `{ index: 'src/index.ts', 'config/index': 'config/src/index.ts' }`
   */
  entries: Record<string, string>;
  /** 除框架与 `@lsw-abpvue/*` 之外还要 external 的依赖 */
  external?: (string | RegExp)[];
}

const FRAMEWORK_EXTERNALS = [/^vue$/, /^vue-router$/, /^@vue\//];
const WORKSPACE_EXTERNALS = [/^@lsw-abpvue\//];
const NODE_EXTERNALS = [...builtinModules.map(m => new RegExp(`^${m}$`)), /^node:/];

/**
 * 库模式的共享配置。产物只有 ESM——Vue 3.5 + Vite 8 时代没有 CJS 的必要，
 * 有人反馈需要再加。
 *
 * 类型声明不在这里出：由 `vue-tsc -p tsconfig.build.json` 单独产出。
 * M0 实测过 vue-tsc 对 `.ts` 与 `.vue` 都能正确生成 `.d.ts`，
 * 少一个插件就少一处会在 Vite/TS 大版本上卡住的地方。
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
