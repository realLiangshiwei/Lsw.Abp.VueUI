import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { workspaceAliases } from '../../scripts/workspace-aliases.ts';

export default defineConfig({
  root: import.meta.dirname,
  plugins: [vue()],
  resolve: { alias: workspaceAliases(resolve(import.meta.dirname, '../../packages')) },
  preview: { port: 4201, strictPort: true },
});
