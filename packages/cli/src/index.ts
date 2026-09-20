export type {
  ActionDefinition,
  ApiDefinition,
  BindingSourceId,
  BoundParameter,
  ControllerDefinition,
  MethodParameter,
  ModuleDefinition,
  PropertyDefinition,
  ReturnValue,
  TypeDefinition,
} from './api-definition/models.js';
export type {
  ApplicationConfiguration,
  EntityExtension,
  ExtensionProperty,
  ExtensionPropertyAttribute,
  ModuleExtension,
  ObjectExtensions,
} from './api-definition/object-extensions.js';
export {
  API_DEFINITION_PATH,
  APPLICATION_CONFIGURATION_PATH,
  ApiDefinitionError,
  readApiDefinition,
  readApplicationConfiguration,
} from './api-definition/source.js';
export type { ApiDefinitionSource } from './api-definition/source.js';

export { main } from './commands/main.js';
export { doctorCommand, runDoctorCommand } from './commands/doctor.js';
export type { DoctorArgs } from './commands/doctor.js';
export { newCommand, runNew } from './commands/new.js';
export type { NewOptions, NewResult } from './commands/new.js';
export { addPackageCommand, ejectCommand, runAddPackage } from './commands/add-package.js';
export type { AddPackageArgs, AddPackageResult } from './commands/add-package.js';
export { runSwitchUi, switchUiCommand } from './commands/switch-ui.js';
export type { Renamed, SwitchUiArgs, SwitchUiResult } from './commands/switch-ui.js';
export { proxyCommand, runProxy } from './commands/proxy.js';
export type { ProxyAction, ProxyArgs, ProxyRunResult } from './commands/proxy.js';

export { inferBackendUrl } from './config/backend-url.js';
export { readProjectEnvironment } from './config/project-env.js';
export type { ProjectEnvironment } from './config/project-env.js';
export {
  EMPTY_PROXY_CONFIG,
  PROXY_CONFIG_FILE,
  readProxyConfig,
  serializeProxyConfig,
  writeProxyConfig,
} from './config/proxy-config.js';
export type { ProxyConfig, ProxyConfigModule, ProxyConfigSource } from './config/proxy-config.js';

export type { Check, CheckStatus } from './diagnostics/checks.js';
export { failed, formatChecks } from './diagnostics/checks.js';
export { reachBackend } from './diagnostics/backend.js';
export type { ReachResult } from './diagnostics/backend.js';
export { runDoctor } from './diagnostics/doctor.js';
export type { DoctorOptions, DoctorResult } from './diagnostics/doctor.js';
export { checkEnvironment } from './diagnostics/environment.js';
export { extensionCoverage, RECOGNISED_TYPES } from './diagnostics/object-extensions.js';
export type {
  ExtensionCoverage,
  ExtensionPropertyReport,
} from './diagnostics/object-extensions.js';
export type { EnvironmentOptions } from './diagnostics/environment.js';

export { CliError, isUserFacingError } from './errors.js';

export { DuplicatePathError, generateProxy, UnknownModuleError } from './generator/generate.js';
export type { GenerateOptions, GenerationResult, ServiceType } from './generator/generate.js';
export type { EmittedFile } from './generator/emit-models.js';
export { GenerationReport } from './generator/report.js';
export type { ReportEntry, ReportKind } from './generator/report.js';

export { moduleBlocks, readTemplateManifest, TEMPLATE_MANIFEST_FILE } from './template/manifest.js';
export type { TemplateBlock, TemplateManifest } from './template/manifest.js';
export { templateRoot } from './template/paths.js';
export { packageNameOf, renderTemplate } from './template/render.js';
export type { RenderOptions, RenderResult, TemplateValues } from './template/render.js';

export { entriesOf } from './source-code/entries.js';
export type { PackageManifest, SourceEntry } from './source-code/entries.js';
export {
  readSourceCodeRecord,
  SOURCE_CODE_FILE,
  writeSourceCodeRecord,
} from './source-code/record.js';
export type { ReleasedPackage, SourceCodeRecord } from './source-code/record.js';
export { releasablePackages, releaseSourceCode } from './source-code/release.js';
export type { ReleaseOptions, ReleaseResult } from './source-code/release.js';

export { OutsideTargetError, writeProxy } from './writer.js';
export type { WriteOptions, WriteResult } from './writer.js';
