import type {
  ActionDefinition,
  BoundParameter,
  ControllerDefinition,
  ModuleDefinition,
} from '../api-definition/models.js';
import { namespaceOf, parseClrType } from './clr-type.js';
import { renderDeclaredType } from './declared-type.js';
import { CORE_PACKAGE, REMOTE_STREAM_TYPES } from './framework-types.js';
import { ImportCollector, moduleSpecifier } from './imports.js';
import { camelCase, isIdentifier, kebabCase, namespaceToDirectory, quoteName } from './names.js';
import type { GenerationReport } from './report.js';
import { stripRootNamespace, type RegisteredType, type TypeRegistry } from './type-registry.js';
import { fileOf, type EmittedFile } from './emit-models.js';

export interface ServiceEmitOptions {
  module: ModuleDefinition;
  registry: TypeRegistry;
  report: GenerationReport;
  rootNamespace?: string | undefined;
  /** Overrides the module's `remoteServiceName`, for a backend that renames it. */
  apiName?: string | undefined;
  /** What each controller's service is called, keyed by the controller's CLR type. */
  names: ReadonlyMap<string, string>;
}

export interface EmittedServices {
  files: EmittedFile[];
  /** Everything the services mention, which is where the model closure starts. */
  referenced: RegisteredType[];
}

/** `api-version` is a legal parameter name on the wire but not in TypeScript. */
function camelizeHyphen(name: string): string {
  return name.replace(/-([a-z])/g, match => (match[1] as string).toUpperCase());
}

/**
 * `GetListAsyncByInput` is `getList`: ABP builds a unique name by appending the
 * parameters, and everything from `Async` on is that suffix.
 */
function methodNameOf(action: ActionDefinition): string {
  const [name = action.uniqueName] = action.uniqueName.split('Async');

  return camelCase(name);
}

/** What tells two overloads apart once `Async` and everything after it is gone. */
function qualifiedMethodNameOf(action: ActionDefinition): string {
  return camelCase(action.uniqueName.replace('Async', ''));
}

function isStreamType(type: string): boolean {
  const parsed = parseClrType(type);
  const named = parsed.kind === 'array' ? parsed.item : parsed;

  return named.kind === 'name' && REMOTE_STREAM_TYPES.has(named.name);
}

/**
 * How a bound parameter is read off the method's own parameters.
 * @param parameter The parameter as the request carries it
 * @param optional Whether the method parameter it is read from may be left out
 */
function valueExpression(parameter: BoundParameter, optional: boolean): string {
  const own = camelizeHyphen(parameter.nameOnMethod);
  if (!parameter.descriptorName) return own;

  const segments = (parameter.jsonName ?? parameter.name).split('.');
  const descriptor = camelizeHyphen(parameter.descriptorName);

  // Only the first step can be skipped by the caller; a flattened nested parameter may
  // be absent at every level below that, which is why the rest always chain.
  return segments.reduce((path, segment, index) => {
    const link = index === 0 && !optional ? '.' : '?.';
    const name = camelCase(segment);

    return isIdentifier(name) ? `${path}${link}${name}` : `${path}${link}['${segment}']`;
  }, descriptor);
}

/** The query string key, which is the name the server binds by. */
function queryKeyOf(parameter: BoundParameter): string {
  const camel = camelCase(parameter.name);

  return parameter.jsonName ?? (isIdentifier(camel) ? camel : parameter.name);
}

interface RequestParts {
  url: string;
  params: string[];
  spreadParams: string[];
  headers: string[];
  body: string | undefined;
  requestType: string;
}

function buildRequest(
  action: ActionDefinition,
  registry: TypeRegistry,
  refs: RegisteredType[],
): RequestParts {
  const parts: RequestParts = {
    url: `/${action.url}`,
    params: [],
    spreadParams: [],
    headers: [],
    body: undefined,
    requestType: 'never',
  };

  const fileParameters = action.parameters.filter(
    parameter => parameter.bindingSourceId === 'FormFile' || isStreamType(parameter.type),
  );

  const optionalOnMethod = new Set(
    action.parametersOnMethod
      .filter(parameter => parameter.isOptional)
      .map(parameter => parameter.name),
  );

  for (const parameter of action.parameters) {
    const value = valueExpression(parameter, optionalOnMethod.has(parameter.nameOnMethod));

    if (fileParameters.length > 0 && parameter.bindingSourceId !== 'Path') {
      // A form post carries everything in the FormData the caller built, so the rest of
      // the form fields are not sent again as query parameters.
      if (parameter.bindingSourceId !== 'Query') continue;
    }

    switch (parameter.bindingSourceId) {
      case 'Path': {
        const names = new Set([parameter.name, camelCase(parameter.name), parameter.jsonName]);
        for (const name of names) {
          if (name) parts.url = parts.url.split(`{${name}}`).join(`\${${value}}`);
        }
        break;
      }

      case 'Body': {
        const rendered = renderDeclaredType(registry, parameter, new Set());
        rendered.refs.forEach(ref => refs.push(ref));

        if (parameter.typeSimple === 'string') {
          // A bare string body is JSON, not text: the server's input formatter reads it
          // with the JSON reader and a raw string is not valid JSON.
          parts.body = `JSON.stringify(${value})`;
          parts.headers.push(`'Content-Type': 'application/json'`);
          parts.requestType = 'string';
        } else {
          parts.body = value;
          parts.requestType = rendered.text;
        }
        break;
      }

      case 'Header':
        parts.headers.push(`${quoteName(parameter.name)}: String(${value})`);
        break;

      case 'ModelBinding':
      case 'Query': {
        const parsed = parseClrType(parameter.typeSimple);
        if (parsed.kind === 'dictionary') {
          parts.spreadParams.push(value);
          break;
        }

        const key = queryKeyOf(parameter);
        parts.params.push(key === value ? key : `${quoteName(key)}: ${value}`);
        break;
      }

      default:
        break;
    }
  }

  const file = fileParameters[0];
  if (file) {
    parts.body = camelizeHyphen(file.nameOnMethod);
    parts.requestType = 'FormData';
  }

  return parts;
}

function emitMethod(
  action: ActionDefinition,
  name: string,
  options: ServiceEmitOptions,
  refs: RegisteredType[],
): string {
  const { registry } = options;
  const fileParameters = new Set(
    action.parameters
      .filter(parameter => parameter.bindingSourceId === 'FormFile' || isStreamType(parameter.type))
      .map(parameter => parameter.nameOnMethod),
  );

  const signature = action.parametersOnMethod.map(parameter => {
    const rendered = fileParameters.has(parameter.name)
      ? { text: 'FormData', refs: [] }
      : renderDeclaredType(registry, parameter, new Set());
    rendered.refs.forEach(ref => refs.push(ref));

    // An array parameter is only forwarded, never written to, so a readonly array is
    // just as good and a caller with one does not have to copy it.
    const type = rendered.text.endsWith('[]') ? `readonly ${rendered.text}` : rendered.text;

    return `${camelizeHyphen(parameter.name)}${parameter.isOptional ? '?' : ''}: ${type}`;
  });

  const returned = renderDeclaredType(registry, action.returnValue, new Set());
  returned.refs.forEach(ref => refs.push(ref));

  const streams =
    action.returnValue.isRemoteStream === true || isStreamType(action.returnValue.type);
  const responseType = streams ? 'Blob' : returned.text;
  const request = buildRequest(action, registry, refs);

  const lines = [`method: '${action.httpMethod}'`];
  if (streams) lines.push(`responseType: 'blob'`);
  // Without this the transport would hand a bare string to JSON.parse, and ASP.NET
  // answers a `Task<string>` action with text/plain.
  else if (responseType === 'string') lines.push(`responseType: 'text'`);
  if (request.headers.length) lines.push(`headers: { ${request.headers.join(', ')} }`);
  lines.push(request.url.includes('${') ? `url: \`${request.url}\`` : `url: '${request.url}'`);

  const params = [...request.spreadParams.map(value => `...${value}`), ...request.params];
  if (params.length) lines.push(`params: { ${params.join(', ')} }`);
  if (request.body) lines.push(`body: ${request.body}`);

  const parameters = [...signature, 'config?: RestConfig'].join(', ');
  const result = responseType === 'void' ? 'void' : responseType;

  return [
    `    ${name}: (${parameters}): Promise<${result}> =>`,
    `      rest.request<${request.requestType}, ${result}>(`,
    `        { ${lines.join(', ')} },`,
    `        { apiName, ...config },`,
    `      ),`,
  ].join('\n');
}

function emitService(
  controller: ControllerDefinition,
  options: ServiceEmitOptions,
  refs: RegisteredType[],
): EmittedFile {
  const { module, report } = options;
  const namespace = stripRootNamespace(namespaceOf(controller.type), options.rootNamespace);
  const identifier = options.names.get(controller.type) ?? `${controller.controllerName}Service`;
  const imports = new ImportCollector();

  imports.addValue(CORE_PACKAGE, 'defineService');
  imports.addValue(CORE_PACKAGE, 'inject');
  imports.addValue(CORE_PACKAGE, 'RestService');
  imports.addType(CORE_PACKAGE, 'RestConfig');
  imports.addType(CORE_PACKAGE, 'ServiceOf');

  const actions = Object.values(controller.actions);
  const counts = new Map<string, number>();
  for (const action of actions) {
    const name = methodNameOf(action);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  const methods = actions
    .map(action => {
      const shortName = methodNameOf(action);
      const overloaded = (counts.get(shortName) ?? 0) > 1;
      const name = overloaded ? qualifiedMethodNameOf(action) : shortName;

      if (overloaded) {
        report.add(
          'renamed-method',
          `${controller.controllerName}.${shortName} is generated as ${name}; the controller has more than one action with that name.`,
        );
      }

      return { name, text: emitMethod(action, name, options, refs) };
    })
    .sort((left, right) => (left.name < right.name ? -1 : 1));

  for (const ref of refs) {
    if (ref.frameworkName) {
      imports.addType(CORE_PACKAGE, ref.frameworkName);
      continue;
    }

    const target = moduleSpecifier(
      namespace,
      ref.namespace,
      fileOf(ref).split('/').pop() as string,
    );
    if (ref.isEnum) imports.addValue(target, ref.identifier);
    else imports.addType(target, ref.identifier);
  }

  const apiName = options.apiName ?? module.remoteServiceName;
  const body = [
    `export const ${identifier} = defineService('${identifier}', () => {`,
    `  const rest = inject(RestService);`,
    `  const apiName = '${apiName}';`,
    ``,
    `  return {`,
    `    apiName,`,
    ``,
    methods.map(method => method.text).join('\n\n'),
    `  };`,
    `});`,
    `export type ${identifier} = ServiceOf<typeof ${identifier}>;`,
  ].join('\n');

  const directory = namespaceToDirectory(namespace);
  const file = `${kebabCase(identifier.replace(/Service$/, ''))}.service.ts`;

  return {
    path: directory ? `${directory}/${file}` : file,
    content: `${imports.render()}\n\n${body}\n`,
  };
}

/**
 * One service per controller, plus every type they mention.
 * @param controllers The controllers of one module, already filtered by service type
 * @param options What to generate them against
 */
export function emitServices(
  controllers: ControllerDefinition[],
  options: ServiceEmitOptions,
): EmittedServices {
  const files: EmittedFile[] = [];
  const referenced: RegisteredType[] = [];

  for (const controller of [...controllers].sort((left, right) =>
    left.type < right.type ? -1 : 1,
  )) {
    const refs: RegisteredType[] = [];
    files.push(emitService(controller, options, refs));
    referenced.push(...refs);
  }

  return { files, referenced };
}
