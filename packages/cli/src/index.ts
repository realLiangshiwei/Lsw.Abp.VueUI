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
export { newCommand, runNew } from './commands/new.js';
export type { NewArgs, NewResult } from './commands/new.js';
export { proxyCommand, runProxy } from './commands/proxy.js';
export type { ProxyAction, ProxyArgs, ProxyRunResult } from './commands/proxy.js';

export { inferBackendUrl } from './config/backend-url.js';
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
export { checkEnvironment } from './diagnostics/environment.js';
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

export { OutsideTargetError, writeProxy } from './writer.js';
export type { WriteOptions, WriteResult } from './writer.js';
