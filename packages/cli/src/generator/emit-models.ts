import { parseClrType } from './clr-type.js';
import { renderDeclaredType } from './declared-type.js';
import { CORE_PACKAGE, VALUE_TYPES } from './framework-types.js';
import { ImportCollector, moduleSpecifier } from './imports.js';
import { camelCase, kebabCase, namespaceToDirectory, quoteName } from './names.js';
import type { TypeDirection } from './generate.js';
import type { GenerationReport } from './report.js';
import type { PropertyDefinition } from '../api-definition/models.js';
import type { RegisteredType, TypeRegistry } from './type-registry.js';

export interface EmittedFile {
  /** Relative to the target directory, with forward slashes. */
  path: string;
  content: string;
}

/** Where a type is written, so another file can import it from there. */
export function fileOf(type: RegisteredType): string {
  const directory = namespaceToDirectory(type.namespace);
  const file = type.isEnum ? `${kebabCase(type.identifier)}.enum` : 'models';

  return directory ? `${directory}/${file}` : file;
}

/**
 * Adds the import one type needs, if it needs one: a framework type comes from core, a
 * type from this very file needs nothing, and everything else is a relative path.
 */
function importType(imports: ImportCollector, from: RegisteredType, to: RegisteredType): void {
  if (to.frameworkName) {
    imports.addType(CORE_PACKAGE, to.frameworkName);
    return;
  }

  // An enum is a value, but nothing outside its own file needs the object: everywhere
  // else it is the type of a property or a parameter.
  if (to.isEnum) {
    imports.addType(
      moduleSpecifier(from.namespace, to.namespace, `${kebabCase(to.identifier)}.enum`),
      to.identifier,
    );
    return;
  }

  if (to.namespace === from.namespace) return;

  imports.addType(moduleSpecifier(from.namespace, to.namespace, 'models'), to.identifier);
}

function genericsOf(type: RegisteredType): string {
  if (type.genericParameters.length === 0) return '';

  // A default may only be followed by other defaults, so the ones that have none stay
  // bare and only the tail carries them.
  const firstDefault = type.genericDefaults.findIndex(value => value !== undefined);
  const parameters = type.genericParameters.map((parameter, index) => {
    const value = type.genericDefaults[index];
    return firstDefault >= 0 && index >= firstDefault && value
      ? `${parameter} = ${value}`
      : parameter;
  });

  return `<${parameters.join(', ')}>`;
}

/** Whether the CLR type behind a property is one that cannot hold null. */
function cannotBeNull(property: PropertyDefinition, registry: TypeRegistry): boolean {
  if (property.isNullable) return false;

  const parsed = parseClrType(property.type);
  if (parsed.kind !== 'name') return false;

  return VALUE_TYPES.has(parsed.name) || registry.find(parsed)?.isEnum === true;
}

/**
 * Whether the backend may leave a property out.
 *
 * A DTO the caller builds needs only what `[Required]` marks. A DTO the server writes is
 * the other way round -- the serializer writes every property, a null rather than a
 * missing key -- but that only helps where the metadata can say a value is never null,
 * which is a non-nullable value type or enum. ABP's own modules compile without nullable
 * reference types, so a `string` is reported non-nullable whether or not it comes back
 * as one, and staying optional there is the difference between a promise and a guess.
 *
 * A DTO used both ways takes the caller's rule, the weaker of the two.
 */
function isOptional(
  property: PropertyDefinition,
  direction: TypeDirection,
  registry: TypeRegistry,
): boolean {
  return direction === 'response' ? !cannotBeNull(property, registry) : !property.isRequired;
}

function emitInterface(
  type: RegisteredType,
  registry: TypeRegistry,
  imports: ImportCollector,
  report: GenerationReport,
  direction: TypeDirection,
): string {
  const scope = new Set(type.genericParameters);
  const lines: string[] = [];

  let heritage = '';
  if (type.definition.baseType) {
    const base = registry.render(parseClrType(type.definition.baseType), scope);
    const identifier = base.text.replace(/<.*>$/, '');

    if (identifier === type.identifier) {
      // The type derives from its own generic form; the two are one interface here and
      // the arguments it was closed with became the parameter defaults.
    } else if (base.text === 'unknown') {
      report.add(
        'skipped',
        `${type.name} derives from ${type.definition.baseType}, which is not in the type pool.`,
      );
    } else {
      heritage = ` extends ${base.text}`;
      base.refs.forEach(ref => importType(imports, type, ref));
    }
  }

  for (const property of type.definition.properties ?? []) {
    const rendered = renderDeclaredType(registry, property, scope);
    rendered.refs.forEach(ref => importType(imports, type, ref));

    const name = quoteName(property.jsonName ?? camelCase(property.name));
    const nullable = property.isNullable ? ' | null' : '';
    // `?: T` and `?: T | undefined` differ under `exactOptionalPropertyTypes`, which a
    // strict application has on: without the union, handing it an object that has the
    // property set to `undefined` does not compile.
    const optional = isOptional(property, direction, registry);

    lines.push(
      `  ${name}${optional ? '?' : ''}: ${rendered.text}${nullable}${optional ? ' | undefined' : ''};`,
    );
  }

  // A DTO that adds nothing to the one it derives from is an alias; an empty interface
  // would mean "any non-nullish value" to a reader and to a linter.
  if (lines.length === 0 && heritage) {
    return `export type ${type.identifier}${genericsOf(type)} = ${heritage.replace(' extends ', '')};`;
  }

  const body = lines.length ? `{\n${lines.join('\n')}\n}` : '{}';

  return `export interface ${type.identifier}${genericsOf(type)}${heritage} ${body}`;
}

function emitEnum(type: RegisteredType, imports: ImportCollector): string {
  const names = type.definition.enumNames ?? [];
  const values = type.definition.enumValues ?? [];

  imports.addValue(CORE_PACKAGE, 'mapEnumToOptions');

  const members = names.map((name, index) => `  ${quoteName(name)} = ${values[index] ?? index},`);

  return [
    `export enum ${type.identifier} {`,
    ...members,
    '}',
    '',
    `export const ${camelCase(type.identifier)}Options = mapEnumToOptions(${type.identifier});`,
  ].join('\n');
}

/** One family per identifier: a type and its own generic form are one interface here. */
function oneDefinitionPerFamily(types: RegisteredType[]): RegisteredType[] {
  const byName = new Map<string, RegisteredType>();

  for (const type of types) {
    const existing = byName.get(type.name);
    if (!existing || type.genericParameters.length > existing.genericParameters.length) {
      byName.set(type.name, type);
    }
  }

  return [...byName.values()];
}

/**
 * The model and enum files for a set of types, grouped the way the backend's namespaces
 * are.
 * @param types The types to write, which is the closure of what the services reference
 * @param registry Every type the backend described
 * @param report Where anything that could not be honoured is recorded
 * @param directions Which way each type travels, by CLR name without generic arity
 */
export function emitModels(
  types: RegisteredType[],
  registry: TypeRegistry,
  report: GenerationReport,
  directions: ReadonlyMap<string, TypeDirection> = new Map(),
): EmittedFile[] {
  const files: EmittedFile[] = [];
  const byNamespace = new Map<string, RegisteredType[]>();

  for (const type of oneDefinitionPerFamily(types)) {
    byNamespace.set(type.namespace, [...(byNamespace.get(type.namespace) ?? []), type]);
  }

  for (const [namespace, group] of [...byNamespace].sort(([left], [right]) =>
    left < right ? -1 : 1,
  )) {
    const sorted = [...group].sort((left, right) => (left.identifier < right.identifier ? -1 : 1));

    for (const type of sorted.filter(entry => entry.isEnum)) {
      const imports = new ImportCollector();
      const body = emitEnum(type, imports);

      files.push({
        path: `${fileOf(type)}.ts`,
        content: `${imports.render()}\n\n${body}\n`,
      });
    }

    const interfaces = sorted.filter(type => !type.isEnum);
    if (interfaces.length === 0) continue;

    const imports = new ImportCollector();
    const bodies = interfaces.map(type =>
      // A type nothing reached is generated as if the caller built it, which is the
      // weaker of the two promises.
      emitInterface(type, registry, imports, report, directions.get(type.name) ?? 'request'),
    );
    const header = imports.isEmpty ? '' : `${imports.render()}\n\n`;
    const directory = namespaceToDirectory(namespace);

    files.push({
      path: directory ? `${directory}/models.ts` : 'models.ts',
      content: `${header}${bodies.join('\n\n')}\n`,
    });
  }

  return files;
}
