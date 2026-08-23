import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { workspaceAliases } from '../scripts/workspace-aliases.ts';

const root = dirname(fileURLToPath(import.meta.url));
const packagesRoot = resolve(root, '../packages');

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // Straight to `src`, so editing a package hot-reloads here with no build step.
    alias: workspaceAliases(packagesRoot),
  },
  server: {
    port: 4200,
    fs: {
      // The aliases point outside the playground root.
      allow: [resolve(root, '..')],
    },
  },
});
