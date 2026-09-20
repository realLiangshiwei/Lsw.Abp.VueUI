import type {
  ApplicationConfiguration,
  ExtensionProperty,
} from '../api-definition/object-extensions.js';

/**
 * The property types the extension system renders, which is `PropType` in
 * `@lsw-abpvue/components` and the same list ABP's `ePropType` declares. A `typeSimple`
 * outside it falls back to text, and the property the backend configured is not the one
 * the user sees.
 *
 * `scripts/extension-mapping.spec.ts` holds this against the runtime's own list: the two
 * cannot be one module -- a Node tool may not depend on a Vue package (design 03 §1) --
 * so what keeps them together is a test that fails the day they differ.
 */
export const RECOGNISED_TYPES = [
  'boolean',
  'date',
  'datetime',
  'email',
  'enum',
  'hidden',
  'multiselect',
  'number',
  'password',
  'passwordinputgroup',
  'string',
  'text',
  'time',
  'typeahead',
];

/** ABP's lookup extension keeps the display text of a lookup in a second property. */
const TYPEAHEAD_TEXT_SUFFIX = '_Text';

export interface ExtensionPropertyReport {
  /** `Identity.User.HireDate`, as the report names it. */
  path: string;
  /** False when the mapping would not produce what the backend configured. */
  recognised: boolean;
  /** Why it would not, or why it shows nowhere. */
  reason?: string | undefined;
}

export interface ExtensionCoverage {
  declared: number;
  recognised: number;
  /** Only the ones with something to say; the rest are covered and unremarkable. */
  reported: ExtensionPropertyReport[];
}

function classify(
  path: string,
  property: ExtensionProperty,
  enums: Record<string, unknown>,
): ExtensionPropertyReport {
  const simple = (property.typeSimple ?? '').replace(/\?$/, '');
  const lookup = property.ui?.lookup?.url;

  if (!lookup && !path.endsWith(TYPEAHEAD_TEXT_SUFFIX) && !RECOGNISED_TYPES.includes(simple)) {
    return {
      path,
      recognised: false,
      reason: `${simple || 'no type'} is not one the mapping knows, so it renders as text`,
    };
  }

  if (simple === 'enum' && !(property.type && property.type in enums)) {
    return {
      path,
      recognised: false,
      reason: `no enum called ${property.type ?? '(none)'} in the configuration, so the raw value is shown`,
    };
  }

  const ui = property.ui;
  const shows =
    ui?.onTable?.isVisible === true ||
    ui?.onCreateForm?.isVisible === true ||
    ui?.onEditForm?.isVisible === true;

  return shows
    ? { path, recognised: true }
    : {
        path,
        recognised: true,
        reason: 'hidden on the table and both forms, so it is configured to show nowhere',
      };
}

/**
 * How much of what the backend declares the mapping rules actually turn into something.
 * Fifteen rules turn `objectExtensions` into columns and fields, and missing any one of
 * them looks exactly like a configuration mistake from the outside -- so both numbers are
 * put next to each other, with the difference spelled out (risk R-07).
 *
 * @param configuration What `/api/abp/application-configuration` answered
 */
export function extensionCoverage(configuration: ApplicationConfiguration): ExtensionCoverage {
  const extensions = configuration.objectExtensions;
  const enums = (extensions?.enums ?? {}) as Record<string, unknown>;

  let declared = 0;
  let recognised = 0;
  const reported: ExtensionPropertyReport[] = [];

  for (const [module, definition] of Object.entries(extensions?.modules ?? {})) {
    for (const [entity, properties] of Object.entries(definition.entities ?? {})) {
      for (const [name, property] of Object.entries(properties.properties ?? {})) {
        const report = classify(`${module}.${entity}.${name}`, property, enums);

        declared += 1;
        if (report.recognised) recognised += 1;
        if (report.reason) reported.push(report);
      }
    }
  }

  return { declared, recognised, reported };
}
