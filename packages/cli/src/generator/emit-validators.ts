import type { PropertyDefinition } from '../api-definition/models.js';
import type {
  ExtensionProperty,
  ExtensionPropertyAttribute,
  ObjectExtensions,
} from '../api-definition/object-extensions.js';
import type { EmittedFile } from './emit-models.js';
import { ImportCollector } from './imports.js';
import { camelCase, namespaceToDirectory, quoteName } from './names.js';
import type { GenerationReport } from './report.js';
import type { RegisteredType } from './type-registry.js';

const THEME_SHARED_PACKAGE = '@lsw-abpvue/theme-shared';

const HEADER = [
  '// What the backend already declares about its own values, as validators a form can',
  '// spread into its controls. Two sources: the data annotations on a DTO property, and',
  '// the attributes on an object extension property.',
  '//',
  '// The maps are sparse on purpose. A rule the backend enforces in code rather than in an',
  '// attribute is not here, and a form still says whatever else it needs to say. A rule a',
  '// DTO inherits stays in the map of the type that declares it, so a form that edits a',
  '// derived DTO spreads the two together.',
].join('\n');

function numberOf(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function pattern(expression: string): string {
  return `Validators.pattern(new RegExp(${JSON.stringify(expression)}))`;
}

/** The rules a DTO property carries, from the data annotations ABP reports for it. */
export function validatorsForProperty(
  property: PropertyDefinition,
  report: GenerationReport,
): string[] {
  const rules: string[] = [];

  if (property.isRequired) rules.push('Validators.required()');
  if (property.maxLength) rules.push(`Validators.maxLength(${property.maxLength})`);
  // `[StringLength]` reports a minimum of zero when it was given none.
  if (property.minLength) rules.push(`Validators.minLength(${property.minLength})`);

  const minimum = property.minimum === null ? undefined : numberOf(property.minimum);
  const maximum = property.maximum === null ? undefined : numberOf(property.maximum);

  if (minimum !== undefined && maximum !== undefined) {
    rules.push(`Validators.range(${minimum}, ${maximum})`);
  } else if (minimum !== undefined) {
    rules.push(`Validators.min(${minimum})`);
  } else if (maximum !== undefined) {
    rules.push(`Validators.max(${maximum})`);
  } else if (property.minimum || property.maximum) {
    report.add(
      'unmapped-attribute',
      `[Range] on ${property.name} is over ${property.minimum ?? property.maximum}, which is not a number; no validator was generated for it.`,
    );
  }

  if (property.regex) rules.push(pattern(property.regex));

  return rules;
}

/** The rules one object extension attribute stands for. */
function validatorsForAttribute(
  attribute: ExtensionPropertyAttribute,
  propertyName: string,
  report: GenerationReport,
): string[] {
  const config = attribute.config ?? {};

  switch (attribute.typeSimple) {
    case 'required':
      // An empty string satisfies the server here, so a required rule would refuse a
      // value the backend accepts.
      return config.allowEmptyStrings === true ? [] : ['Validators.required()'];

    case 'stringLength': {
      const maximum = numberOf(config.maximumLength);
      const minimum = numberOf(config.minimumLength);

      return [
        ...(maximum === undefined ? [] : [`Validators.maxLength(${maximum})`]),
        ...(minimum ? [`Validators.minLength(${minimum})`] : []),
      ];
    }

    case 'maxLength': {
      const length = numberOf(config.length);
      return length === undefined ? [] : [`Validators.maxLength(${length})`];
    }

    case 'minLength': {
      const length = numberOf(config.length);
      return length ? [`Validators.minLength(${length})`] : [];
    }

    case 'range': {
      const minimum = numberOf(config.minimum);
      const maximum = numberOf(config.maximum);
      return minimum === undefined || maximum === undefined
        ? []
        : [`Validators.range(${minimum}, ${maximum})`];
    }

    case 'regularExpression':
      return typeof config.pattern === 'string' ? [pattern(config.pattern)] : [];

    case 'emailAddress':
      return ['Validators.email()'];

    case 'url':
      return ['Validators.url()'];

    case 'compare':
      return typeof config.otherProperty === 'string'
        ? [`Validators.compare('${config.otherProperty}')`]
        : [];

    default:
      report.add(
        'unmapped-attribute',
        `[${attribute.typeSimple}] on ${propertyName} has no validator here; the server still enforces it.`,
      );
      return [];
  }
}

function validatorsForExtensionProperty(
  name: string,
  property: ExtensionProperty,
  report: GenerationReport,
): string[] {
  return (property.attributes ?? []).flatMap(attribute =>
    validatorsForAttribute(attribute, name, report),
  );
}

function mapText(name: string, entries: [string, string[]][], typeArgument?: string): string {
  const lines = entries.map(([key, rules]) => `  ${quoteName(key)}: [${rules.join(', ')}],`);
  const satisfies = typeArgument ? `ValidatorMap<${typeArgument}>` : 'ValidatorMap';

  return [`export const ${name} = {`, ...lines, `} satisfies ${satisfies};`].join('\n');
}

/**
 * One `validators.ts` per namespace, holding the rules the DTOs in it declare.
 * @param types The types being written, which is the closure the services reached
 * @param report Where an attribute with no client-side meaning is recorded
 */
export function emitDtoValidators(
  types: RegisteredType[],
  report: GenerationReport,
): EmittedFile[] {
  const byNamespace = new Map<string, { type: RegisteredType; entries: [string, string[]][] }[]>();

  for (const type of types) {
    if (type.isEnum) continue;

    const entries = (type.definition.properties ?? [])
      .map((property): [string, string[]] => [
        property.jsonName ?? camelCase(property.name),
        validatorsForProperty(property, report),
      ])
      .filter(([, rules]) => rules.length > 0);

    if (entries.length === 0) continue;

    byNamespace.set(type.namespace, [
      ...(byNamespace.get(type.namespace) ?? []),
      { type, entries },
    ]);
  }

  return [...byNamespace]
    .sort(([left], [right]) => (left < right ? -1 : 1))
    .map(([namespace, group]) => {
      const imports = new ImportCollector();
      imports.addValue(THEME_SHARED_PACKAGE, 'Validators');
      imports.addType(THEME_SHARED_PACKAGE, 'ValidatorMap');

      const sorted = [...group].sort((left, right) =>
        left.type.identifier < right.type.identifier ? -1 : 1,
      );

      for (const { type } of sorted) {
        imports.addType(`./models.js`, type.identifier);
      }

      const maps = sorted.map(({ type, entries }) =>
        mapText(`${camelCase(type.identifier)}Validators`, entries, type.identifier),
      );

      const directory = namespaceToDirectory(namespace);

      return {
        path: directory ? `${directory}/validators.ts` : 'validators.ts',
        content: `${HEADER}\n\n${imports.render()}\n\n${maps.join('\n\n')}\n`,
      };
    });
}

/**
 * The rules of the object extension properties, which live in
 * `application-configuration` rather than in any DTO. Keyed by the property name the
 * backend declared, which is the name an extensible form gives the control.
 * @param extensions The `objectExtensions` section of the application configuration
 * @param report Where an attribute with no client-side meaning is recorded
 */
export function emitExtensionValidators(
  extensions: ObjectExtensions,
  report: GenerationReport,
): EmittedFile[] {
  const maps: string[] = [];

  for (const [moduleName, module] of Object.entries(extensions.modules ?? {})) {
    for (const [entityName, entity] of Object.entries(module.entities ?? {})) {
      const entries = Object.entries(entity.properties ?? {})
        .map((entry): [string, string[]] => [
          entry[0],
          validatorsForExtensionProperty(entry[0], entry[1], report),
        ])
        .filter(([, rules]) => rules.length > 0);

      if (entries.length === 0) continue;

      maps.push(mapText(`${camelCase(moduleName)}${entityName}ExtensionValidators`, entries));
    }
  }

  if (maps.length === 0) return [];

  const imports = new ImportCollector();
  imports.addValue(THEME_SHARED_PACKAGE, 'Validators');
  imports.addType(THEME_SHARED_PACKAGE, 'ValidatorMap');

  const header = [
    HEADER,
    '//',
    '// Keyed by the property name the backend declared, which is the name the extensible',
    '// form gives the control. The values live in `extraProperties`, not on the DTO.',
  ].join('\n');

  return [
    {
      path: 'object-extension-validators.ts',
      content: `${header}\n\n${imports.render()}\n\n${maps.join('\n\n')}\n`,
    },
  ];
}
