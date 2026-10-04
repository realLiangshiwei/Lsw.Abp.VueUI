# @lsw-abpvue/cli

按导入入口列出公开导出。值导出存在于运行时；类型导出使用 `import type`。源码链接指向对应声明。

本参考跟随 **main**。npm 已发布通道是 **alpha**；使用尚未发布的变更前请查看[版本与兼容性](/zh/release/compatibility)。

## 导入

```ts
import { API_DEFINITION_PATH } from '@lsw-abpvue/cli';
```

## `@lsw-abpvue/cli`

| 导出                             | 类别 | 源码                                                                                                                    |
| -------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------- |
| `ActionDefinition`               | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/models.ts)            |
| `ApiDefinition`                  | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/models.ts)            |
| `BindingSourceId`                | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/models.ts)            |
| `BoundParameter`                 | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/models.ts)            |
| `ControllerDefinition`           | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/models.ts)            |
| `MethodParameter`                | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/models.ts)            |
| `ModuleDefinition`               | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/models.ts)            |
| `PropertyDefinition`             | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/models.ts)            |
| `ReturnValue`                    | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/models.ts)            |
| `TypeDefinition`                 | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/models.ts)            |
| `ApplicationConfiguration`       | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/object-extensions.ts) |
| `EntityExtension`                | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/object-extensions.ts) |
| `ExtensionProperty`              | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/object-extensions.ts) |
| `ExtensionPropertyAttribute`     | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/object-extensions.ts) |
| `ModuleExtension`                | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/object-extensions.ts) |
| `ObjectExtensions`               | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/object-extensions.ts) |
| `API_DEFINITION_PATH`            | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/source.ts)            |
| `APPLICATION_CONFIGURATION_PATH` | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/source.ts)            |
| `ApiDefinitionError`             | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/source.ts)            |
| `readApiDefinition`              | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/source.ts)            |
| `readApplicationConfiguration`   | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/source.ts)            |
| `ApiDefinitionSource`            | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/api-definition/source.ts)            |
| `main`                           | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/main.ts)                    |
| `doctorCommand`                  | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/doctor.ts)                  |
| `runDoctorCommand`               | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/doctor.ts)                  |
| `DoctorArgs`                     | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/doctor.ts)                  |
| `newCommand`                     | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/new.ts)                     |
| `runNew`                         | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/new.ts)                     |
| `NewOptions`                     | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/new.ts)                     |
| `NewResult`                      | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/new.ts)                     |
| `addPackageCommand`              | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/add-package.ts)             |
| `ejectCommand`                   | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/add-package.ts)             |
| `runAddPackage`                  | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/add-package.ts)             |
| `AddPackageArgs`                 | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/add-package.ts)             |
| `AddPackageResult`               | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/add-package.ts)             |
| `runSwitchUi`                    | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/switch-ui.ts)               |
| `switchUiCommand`                | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/switch-ui.ts)               |
| `Renamed`                        | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/switch-ui.ts)               |
| `SwitchUiArgs`                   | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/switch-ui.ts)               |
| `SwitchUiResult`                 | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/switch-ui.ts)               |
| `proxyCommand`                   | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/proxy.ts)                   |
| `runProxy`                       | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/proxy.ts)                   |
| `ProxyAction`                    | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/proxy.ts)                   |
| `ProxyArgs`                      | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/proxy.ts)                   |
| `ProxyRunResult`                 | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/commands/proxy.ts)                   |
| `inferBackendUrl`                | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/config/backend-url.ts)               |
| `readProjectEnvironment`         | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/config/project-env.ts)               |
| `ProjectEnvironment`             | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/config/project-env.ts)               |
| `EMPTY_PROXY_CONFIG`             | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/config/proxy-config.ts)              |
| `PROXY_CONFIG_FILE`              | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/config/proxy-config.ts)              |
| `readProxyConfig`                | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/config/proxy-config.ts)              |
| `serializeProxyConfig`           | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/config/proxy-config.ts)              |
| `writeProxyConfig`               | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/config/proxy-config.ts)              |
| `ProxyConfig`                    | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/config/proxy-config.ts)              |
| `ProxyConfigModule`              | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/config/proxy-config.ts)              |
| `ProxyConfigSource`              | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/config/proxy-config.ts)              |
| `Check`                          | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/checks.ts)               |
| `CheckStatus`                    | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/checks.ts)               |
| `failed`                         | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/checks.ts)               |
| `formatChecks`                   | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/checks.ts)               |
| `reachBackend`                   | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/backend.ts)              |
| `ReachResult`                    | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/backend.ts)              |
| `runDoctor`                      | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/doctor.ts)               |
| `DoctorOptions`                  | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/doctor.ts)               |
| `DoctorResult`                   | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/doctor.ts)               |
| `checkEnvironment`               | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/environment.ts)          |
| `extensionCoverage`              | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/object-extensions.ts)    |
| `RECOGNISED_TYPES`               | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/object-extensions.ts)    |
| `ExtensionCoverage`              | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/object-extensions.ts)    |
| `ExtensionPropertyReport`        | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/object-extensions.ts)    |
| `EnvironmentOptions`             | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/diagnostics/environment.ts)          |
| `CliError`                       | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/errors.ts)                           |
| `isUserFacingError`              | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/errors.ts)                           |
| `DuplicatePathError`             | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/generator/generate.ts)               |
| `generateProxy`                  | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/generator/generate.ts)               |
| `UnknownModuleError`             | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/generator/generate.ts)               |
| `GenerateOptions`                | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/generator/generate.ts)               |
| `GenerationResult`               | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/generator/generate.ts)               |
| `ServiceType`                    | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/generator/generate.ts)               |
| `EmittedFile`                    | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/generator/emit-models.ts)            |
| `GenerationReport`               | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/generator/report.ts)                 |
| `ReportEntry`                    | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/generator/report.ts)                 |
| `ReportKind`                     | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/generator/report.ts)                 |
| `moduleBlocks`                   | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/template/manifest.ts)                |
| `readTemplateManifest`           | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/template/manifest.ts)                |
| `TEMPLATE_MANIFEST_FILE`         | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/template/manifest.ts)                |
| `TemplateBlock`                  | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/template/manifest.ts)                |
| `TemplateManifest`               | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/template/manifest.ts)                |
| `templateRoot`                   | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/template/paths.ts)                   |
| `packageNameOf`                  | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/template/render.ts)                  |
| `renderTemplate`                 | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/template/render.ts)                  |
| `RenderOptions`                  | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/template/render.ts)                  |
| `RenderResult`                   | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/template/render.ts)                  |
| `TemplateValues`                 | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/template/render.ts)                  |
| `entriesOf`                      | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/entries.ts)              |
| `PackageManifest`                | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/entries.ts)              |
| `SourceEntry`                    | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/entries.ts)              |
| `readSourceCodeRecord`           | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/record.ts)               |
| `SOURCE_CODE_FILE`               | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/record.ts)               |
| `writeSourceCodeRecord`          | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/record.ts)               |
| `ReleasedPackage`                | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/record.ts)               |
| `SourceCodeRecord`               | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/record.ts)               |
| `releasablePackages`             | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/release.ts)              |
| `releaseSourceCode`              | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/release.ts)              |
| `ReleaseOptions`                 | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/release.ts)              |
| `ReleaseResult`                  | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/source-code/release.ts)              |
| `OutsideTargetError`             | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/writer.ts)                           |
| `writeProxy`                     | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/writer.ts)                           |
| `WriteOptions`                   | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/writer.ts)                           |
| `WriteResult`                    | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/cli/src/writer.ts)                           |
