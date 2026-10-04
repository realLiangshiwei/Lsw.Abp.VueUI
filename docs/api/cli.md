# @lsw-abpvue/cli

Public exports grouped by import entry. Value exports exist at runtime; type exports are used with `import type`. Source links lead to their declarations.

This reference follows **main**. The published npm channel is **alpha**; consult [versions and compatibility](/release/compatibility) before relying on a change that has not been published.

## Import

```ts
import { API_DEFINITION_PATH } from '@lsw-abpvue/cli';
```

## `@lsw-abpvue/cli`

| Export                           | Kind  | Source                                                                                                                    |
| -------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------- |
| `ActionDefinition`               | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/models.ts)            |
| `ApiDefinition`                  | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/models.ts)            |
| `BindingSourceId`                | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/models.ts)            |
| `BoundParameter`                 | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/models.ts)            |
| `ControllerDefinition`           | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/models.ts)            |
| `MethodParameter`                | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/models.ts)            |
| `ModuleDefinition`               | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/models.ts)            |
| `PropertyDefinition`             | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/models.ts)            |
| `ReturnValue`                    | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/models.ts)            |
| `TypeDefinition`                 | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/models.ts)            |
| `ApplicationConfiguration`       | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/object-extensions.ts) |
| `EntityExtension`                | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/object-extensions.ts) |
| `ExtensionProperty`              | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/object-extensions.ts) |
| `ExtensionPropertyAttribute`     | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/object-extensions.ts) |
| `ModuleExtension`                | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/object-extensions.ts) |
| `ObjectExtensions`               | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/object-extensions.ts) |
| `API_DEFINITION_PATH`            | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/source.ts)            |
| `APPLICATION_CONFIGURATION_PATH` | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/source.ts)            |
| `ApiDefinitionError`             | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/source.ts)            |
| `readApiDefinition`              | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/source.ts)            |
| `readApplicationConfiguration`   | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/source.ts)            |
| `ApiDefinitionSource`            | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/source.ts)            |
| `main`                           | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/main.ts)                    |
| `doctorCommand`                  | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/doctor.ts)                  |
| `runDoctorCommand`               | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/doctor.ts)                  |
| `DoctorArgs`                     | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/doctor.ts)                  |
| `newCommand`                     | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/new.ts)                     |
| `runNew`                         | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/new.ts)                     |
| `NewOptions`                     | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/new.ts)                     |
| `NewResult`                      | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/new.ts)                     |
| `addPackageCommand`              | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/add-package.ts)             |
| `ejectCommand`                   | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/add-package.ts)             |
| `runAddPackage`                  | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/add-package.ts)             |
| `AddPackageArgs`                 | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/add-package.ts)             |
| `AddPackageResult`               | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/add-package.ts)             |
| `runSwitchUi`                    | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/switch-ui.ts)               |
| `switchUiCommand`                | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/switch-ui.ts)               |
| `Renamed`                        | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/switch-ui.ts)               |
| `SwitchUiArgs`                   | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/switch-ui.ts)               |
| `SwitchUiResult`                 | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/switch-ui.ts)               |
| `proxyCommand`                   | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/proxy.ts)                   |
| `runProxy`                       | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/proxy.ts)                   |
| `ProxyAction`                    | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/proxy.ts)                   |
| `ProxyArgs`                      | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/proxy.ts)                   |
| `ProxyRunResult`                 | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/proxy.ts)                   |
| `inferBackendUrl`                | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/config/backend-url.ts)               |
| `readProjectEnvironment`         | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/config/project-env.ts)               |
| `ProjectEnvironment`             | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/config/project-env.ts)               |
| `EMPTY_PROXY_CONFIG`             | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/config/proxy-config.ts)              |
| `PROXY_CONFIG_FILE`              | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/config/proxy-config.ts)              |
| `readProxyConfig`                | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/config/proxy-config.ts)              |
| `serializeProxyConfig`           | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/config/proxy-config.ts)              |
| `writeProxyConfig`               | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/config/proxy-config.ts)              |
| `ProxyConfig`                    | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/config/proxy-config.ts)              |
| `ProxyConfigModule`              | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/config/proxy-config.ts)              |
| `ProxyConfigSource`              | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/config/proxy-config.ts)              |
| `Check`                          | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/checks.ts)               |
| `CheckStatus`                    | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/checks.ts)               |
| `failed`                         | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/checks.ts)               |
| `formatChecks`                   | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/checks.ts)               |
| `reachBackend`                   | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/backend.ts)              |
| `ReachResult`                    | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/backend.ts)              |
| `runDoctor`                      | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/doctor.ts)               |
| `DoctorOptions`                  | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/doctor.ts)               |
| `DoctorResult`                   | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/doctor.ts)               |
| `checkEnvironment`               | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/environment.ts)          |
| `extensionCoverage`              | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/object-extensions.ts)    |
| `RECOGNISED_TYPES`               | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/object-extensions.ts)    |
| `ExtensionCoverage`              | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/object-extensions.ts)    |
| `ExtensionPropertyReport`        | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/object-extensions.ts)    |
| `EnvironmentOptions`             | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/environment.ts)          |
| `CliError`                       | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/errors.ts)                           |
| `isUserFacingError`              | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/errors.ts)                           |
| `DuplicatePathError`             | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/generator/generate.ts)               |
| `generateProxy`                  | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/generator/generate.ts)               |
| `UnknownModuleError`             | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/generator/generate.ts)               |
| `GenerateOptions`                | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/generator/generate.ts)               |
| `GenerationResult`               | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/generator/generate.ts)               |
| `ServiceType`                    | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/generator/generate.ts)               |
| `EmittedFile`                    | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/generator/emit-models.ts)            |
| `GenerationReport`               | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/generator/report.ts)                 |
| `ReportEntry`                    | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/generator/report.ts)                 |
| `ReportKind`                     | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/generator/report.ts)                 |
| `moduleBlocks`                   | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/template/manifest.ts)                |
| `readTemplateManifest`           | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/template/manifest.ts)                |
| `TEMPLATE_MANIFEST_FILE`         | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/template/manifest.ts)                |
| `TemplateBlock`                  | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/template/manifest.ts)                |
| `TemplateManifest`               | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/template/manifest.ts)                |
| `templateRoot`                   | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/template/paths.ts)                   |
| `packageNameOf`                  | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/template/render.ts)                  |
| `renderTemplate`                 | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/template/render.ts)                  |
| `RenderOptions`                  | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/template/render.ts)                  |
| `RenderResult`                   | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/template/render.ts)                  |
| `TemplateValues`                 | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/template/render.ts)                  |
| `entriesOf`                      | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/entries.ts)              |
| `PackageManifest`                | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/entries.ts)              |
| `SourceEntry`                    | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/entries.ts)              |
| `readSourceCodeRecord`           | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/record.ts)               |
| `SOURCE_CODE_FILE`               | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/record.ts)               |
| `writeSourceCodeRecord`          | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/record.ts)               |
| `ReleasedPackage`                | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/record.ts)               |
| `SourceCodeRecord`               | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/record.ts)               |
| `releasablePackages`             | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/release.ts)              |
| `releaseSourceCode`              | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/release.ts)              |
| `ReleaseOptions`                 | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/release.ts)              |
| `ReleaseResult`                  | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/release.ts)              |
| `OutsideTargetError`             | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/writer.ts)                           |
| `writeProxy`                     | Value | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/writer.ts)                           |
| `WriteOptions`                   | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/writer.ts)                           |
| `WriteResult`                    | Type  | [Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/writer.ts)                           |
