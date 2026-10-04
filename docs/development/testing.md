# Testing applications

Use Vitest and Vue Test Utils for component/service behavior, then test authentication and CRUD against your real backend. The generated application currently includes typecheck/build scripts; it does not include an application Vitest setup.

## Install and configure

From `vue/`:

~~~bash
pnpm add -D vitest @vue/test-utils happy-dom @vitejs/plugin-vue
~~~

Add `vitest.config.ts`:

~~~ts
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.spec.ts'],
    clearMocks: true,
  },
});
~~~

This isolated configuration does not use the CLI's app-auto-import plugin. Use explicit imports in tested components, or reproduce your application's auto-import configuration when testing generated pages that rely on it. Do not start the real application's `main.ts` in a unit test.

Add `"test": "vitest"` and `"test:run": "vitest run"` to package.json scripts.

## Test a reactive permission

Create `src/components/PermissionButton.vue`:

<<< ../examples/PermissionButton.vue

Create `src/components/PermissionButton.spec.ts` next to it:

<<< ../examples/PermissionButton.spec.ts

The test creates an injector with Core configuration but does not run application initializers. No backend request is made. It mounts the component with the public `ABP_INJECTOR_KEY` bridge, starts with an empty policy set, grants one policy and waits for Vue's next render.

The assertion concerns the visible button, not a private component property. It checks both initial denial and reactive grant in one scenario.

## Replace a dependency

Provide a service token with `useValue` in the test injector:

~~~ts
const injector = createInjector([
  { provide: MyReportService, useValue: { load: async () => ({ total: 3 }) } },
]);
~~~

`MyReportService` is your own exported token; the replacement must implement its public service type. Resolve services using `injector.get(Token)` or `injector.runInContext(() => ...)`. Composables using Vue lifecycle hooks should run in setup or an effect scope, not as unscoped test calls.

For component tests that need `$t`, routing or theme hosts, use `createAbpApp` with deliberately configured providers or mount with the necessary global properties/plugins. Starting `createAbpApp` with the normal Core initializers will load backend configuration; make that an integration test or replace its backend configuration services intentionally.

## Cleanup and asynchronous work

Unmount wrappers before destroying their injector. Remove containers you appended to `document.body`; Teleport dialogs can otherwise leak into the next test. Await Vue updates and the actual request Promise; avoid fixed sleeps as synchronization.

A unit test can replace a service. A backend integration test should use real endpoints with a dedicated account/data set and preserve ABP validation, tenant and concurrency behavior.

## Run

~~~bash
pnpm test:run
pnpm typecheck
pnpm build
~~~

For browser checks, cover login callback, refresh, My account, logout, denied policies, tenant changes and CRUD. Give created records a recognizable prefix and clean up those records after the run.

## Framework-specific boundaries

Use the public injector and service tokens for application tests. Theme authors can use `@lsw-abpvue/theme-shared/testing` and `runThemeContractTests` to verify keyboard, focus and control behavior across a theme's components.

Complete documentation examples are checked for types and selected examples are executed in the repository. This does not replace running your own backend and browser tests.
