import { defineAbpLibConfig } from '../../scripts/vite-lib-preset.ts';

export default defineAbpLibConfig({
  packageUrl: import.meta.url,
  entries: { index: 'src/index.ts', 'testing/index': 'testing/src/index.ts' },
  external: [/^vitest$/, /^@vue\/test-utils$/, /^axe-core$/],
});
