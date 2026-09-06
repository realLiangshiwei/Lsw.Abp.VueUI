import { defineAbpLibConfig } from '../../scripts/vite-lib-preset.ts';

export default defineAbpLibConfig({
  packageUrl: import.meta.url,
  entries: { index: 'src/index.ts', 'extensible/index': 'extensible/src/index.ts' },
  external: [/^@tanstack\//],
});
