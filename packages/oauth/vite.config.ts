import { defineAbpLibConfig } from '../../scripts/vite-lib-preset.ts';

export default defineAbpLibConfig({
  packageUrl: import.meta.url,
  entries: { index: 'src/index.ts' },
  // Bundling it would give a host that already uses it two copies of the library.
  external: [/^oidc-client-ts$/],
});
