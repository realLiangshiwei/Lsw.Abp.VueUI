import type { ApiDefinition, ControllerDefinition } from '../api-definition/models.js';
import type { ObjectExtensions } from '../api-definition/object-extensions.js';
import { emitBarrels } from './barrels.js';
import { namespaceOf, parseClrType } from './clr-type.js';
import { renderDeclaredType } from './declared-type.js';
import { emitModels, type EmittedFile } from './emit-models.js';
import { emitPolicyNames, policyNamesFromDefinition } from './emit-policy-names.js';
import { emitReadme } from './emit-readme.js';
import { emitServices } from './emit-services.js';
import { emitDtoValidators, emitExtensionValidators } from './emit-validators.js';
import { GenerationReport } from './report.js';
import { TypeRegistry, type RegisteredType } from './type-registry.js';
import { resolveUniqueNames } from './unique-names.js';

export type ServiceType = 'application' | 'integration' | 'all';

export interface GenerateOptions {
  definition: ApiDefinition;
  /** Which modules to generate; `all` is every module the backend describes. */
  modules: string[];
  serviceType?: ServiceType | undefined;
  /** Taken off the front of every namespace, so an application's own DTOs sit shallow. */
  rootNamespace?: string | undefined;
  /** Overrides `remoteServiceName`, for a backend that registers it under another name. */
  apiName?: string | undefined;
  /** Barrel files; off when the proxy is re-exported by hand. */
  index?: boolean | undefined;
  /** Validator maps out of what the backend declares; on unless asked otherwise. */
  validators?: boolean | undefined;
  /** Permission name constants; on unless asked otherwise. */
  policyNames?: boolean | undefined;
  /**
   * The `objectExtensions` of the application configuration. The only place the
   * attributes of an extension property are stated.
   */
  objectExtensions?: ObjectExtensions | undefined;
  /**
   * Permission names read from the application configuration. ABP's own modules do not
   * put their authorization where `api-definition` can see it, so this is what makes the
   * names complete for them.
   */
  grantedPolicies?: string[] | undefined;
}

export interface GenerationResult {
  files: EmittedFile[];
  report: GenerationReport;
  /** The modules that were generated, which is what `refresh` replays. */
  modules: string[];
}

export class UnknownModuleError extends Error {
  constructor(name: string, available: string[]) {
    super(
      `The backend does not describe a module named "${name}". ` +
        `It describes: ${available.join(', ')}. ` +
        'Pass one of those to --module, or "all".',
    );
    this.name = 'UnknownModuleError';
  }
}

function controllersOf(
  controllers: Record<string, ControllerDefinition>,
  serviceType: ServiceType,
): ControllerDefinition[] {
  return Object.values(controllers).filter(
    controller =>
      serviceType === 'all' || controller.isIntegrationService === (serviceType === 'integration'),
  );
}

/**
 * Every type reachable from the ones the services mention. A type core already declares
 * is not followed: nothing is generated for it, and its own properties are core's
 * business.
 */
function closureOf(seeds: RegisteredType[], registry: TypeRegistry): RegisteredType[] {
  const seen = new Map<string, RegisteredType>();
  const queue = [...seeds];

  while (queue.length > 0) {
    const type = queue.shift() as RegisteredType;
    if (type.frameworkName || seen.has(type.key)) continue;

    seen.set(type.key, type);

    const scope = new Set(type.genericParameters);
    const refs: RegisteredType[] = [];

    if (type.definition.baseType && !type.isEnum) {
      refs.push(...registry.render(parseClrType(type.definition.baseType), scope).refs);
    }

    for (const property of type.definition.properties ?? []) {
      refs.push(...renderDeclaredType(registry, property, scope).refs);
    }

    queue.push(...refs);
  }

  return [...seen.values()];
}

/**
 * Turns one `api-definition` into the files of a proxy. Nothing is written here: the
 * result is the file list, which is what makes the whole generator testable without a
 * disk and what lets `refresh` diff before it writes.
 * @param options What to generate and how
 */
export function generateProxy(options: GenerateOptions): GenerationResult {
  const report = new GenerationReport();
  const registry = new TypeRegistry(options.definition.types ?? {}, {
    rootNamespace: options.rootNamespace,
    report,
  });

  const available = Object.keys(options.definition.modules ?? {});
  const wanted = options.modules.includes('all') ? available : options.modules;

  for (const name of wanted) {
    if (!available.includes(name)) throw new UnknownModuleError(name, available);
  }

  const files: EmittedFile[] = [];
  const referenced: RegisteredType[] = [];
  const serviceType = options.serviceType ?? 'application';

  const selected = [...wanted].sort().map(name => ({
    name,
    module: options.definition.modules[name] as NonNullable<ApiDefinition['modules'][string]>,
  }));

  // Two controllers with one name is normal -- ABP's account module has two called
  // `Account` -- and a flat barrel cannot re-export both under it.
  const names = resolveUniqueNames(
    selected.flatMap(({ module }) =>
      controllersOf(module.controllers, serviceType).map(controller => ({
        key: controller.type,
        namespace: namespaceOf(controller.type),
        preferred: `${controller.controllerName}Service`,
        alternate: controller.controllerGroupName
          ? `${controller.controllerGroupName}Service`
          : undefined,
      })),
    ),
    report,
  );

  for (const { module } of selected) {
    const controllers = controllersOf(module.controllers, serviceType);
    const services = emitServices(controllers, {
      module,
      registry,
      report,
      rootNamespace: options.rootNamespace,
      apiName: options.apiName,
      names,
    });

    files.push(...services.files);
    referenced.push(...services.referenced);
  }

  const closure = closureOf(referenced, registry);
  files.push(...emitModels(closure, registry, report));

  if (options.validators !== false) {
    files.push(...emitDtoValidators(closure, report));
    if (options.objectExtensions) {
      files.push(...emitExtensionValidators(options.objectExtensions, report));
    }
  }

  if (options.policyNames !== false) {
    files.push(
      ...emitPolicyNames(
        [
          ...policyNamesFromDefinition(options.definition, wanted),
          ...(options.grantedPolicies ?? []),
        ],
        report,
      ),
    );
  }

  const sorted = files.sort((left, right) => (left.path < right.path ? -1 : 1));
  const barrels = options.index === false ? [] : emitBarrels(sorted);

  return {
    files: [...sorted, ...barrels, emitReadme()],
    report,
    modules: [...wanted].sort(),
  };
}
