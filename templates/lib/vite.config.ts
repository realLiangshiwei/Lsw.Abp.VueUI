import { builtinModules } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const root = dirname(fileURLToPath(import.meta.url));

// The framework, the ABP Vue packages and Node's own modules stay external: this is a
// library, and its consumer resolves them once for the whole application.
const external = [
  /^vue$/,
  /^vue-router$/,
  /^@vue\//,
  /^@lsw-abpvue\//,
  /^node:/,
  ...builtinModules.map(name => new RegExp(`^${name}$`)),
];

export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    lib: {
      // Three entry points, as design 03 lays them out: the pages, the menu entries the
      // application needs at startup, and the generated proxy.
      entry: {
        index: resolve(root, 'src/index.ts'),
        'config/index': resolve(root, 'config/src/index.ts'),
        'proxy/index': resolve(root, 'proxy/src/index.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: { external, output: { chunkFileNames: 'chunks/[name]-[hash].js' } },
  },
});
