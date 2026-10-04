# Application startup

`createAbpApp` builds the injector, installs Vue integration and awaits application initializers. Mount only after it resolves; routes, permissions and localization depend on the initial configuration.

## Minimal application

The following files make up the application shell. The example uses the form page from [forms and validation](../utilities/forms) and the Identity configuration from [extending Users](../tutorials/extend-users).

<<< ../examples/startup.ts

`App.vue` places the current route inside the selected layout:

<<< ../examples/App.vue

`routes.ts` adds the application page and lazy module routes:

<<< ../examples/routes.ts

`provideAbpCore(withOptions({ environment }))` supplies configuration and framework services. `provideAbpRouter` installs routing and guards, `provideAbpOAuth` supplies the authentication token, and `provideAbpThemeBasic` supplies the Bootstrap theme, layouts, notifications and error handlers.

## Module configuration

Register `provideIdentityConfig()` from `@lsw-abpvue/identity/config` at startup. Add `lazyRoutes('/identity', ...)` to your routes to load its pages. The generated template performs both steps for the selected modules.

For settings, register `provideSettingManagementConfig()` before `provideFeatureManagementConfig()` so feature contributions can use the settings tab tree.

## Initializers and failures

Use `provideAppInitializer` for asynchronous startup work. Resolve injected services synchronously before an `await`. Keep service factories free of requests and DOM effects.

An initial backend failure rejects startup unless an application initialization error handler handles it. The generated template includes an error view with a retry action; retain that behavior when changing startup.
