import { defineAbpLibConfig } from '../../scripts/vite-lib-preset.ts';

export default defineAbpLibConfig({
  packageUrl: import.meta.url,
  external: ['qrcode'],
  entries: {
    index: 'src/index.ts',
    'config/index': 'config/src/index.ts',
    'proxy/index': 'proxy/src/index.ts',
    'admin/index': 'admin/src/index.ts',
    'admin/config/index': 'admin/config/src/index.ts',
  },
});
