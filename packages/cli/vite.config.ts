import { defineAbpLibConfig } from '../../scripts/vite-lib-preset.ts';

export default defineAbpLibConfig({
  packageUrl: import.meta.url,
  entries: { index: 'src/index.ts', bin: 'src/bin.ts' },
  external: [/^citty$/, /^@clack\//, /^prettier$/],
  banner: chunk => (chunk === 'bin.js' ? '#!/usr/bin/env node\n' : ''),
});
