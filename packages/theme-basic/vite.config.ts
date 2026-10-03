import { defineAbpLibConfig } from '../../scripts/vite-lib-preset.ts';

export default defineAbpLibConfig({
  packageUrl: import.meta.url,
  entries: { index: 'src/index.ts' },
  external: [/^reka-ui$/, /^@internationalized\/date$/, /^bootstrap/],
  cssFileName: 'style',
});
