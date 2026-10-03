export const OBJECT_EXTENSION_TYPES = [
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
] as const;

export type ObjectExtensionType = (typeof OBJECT_EXTENSION_TYPES)[number];

export interface ExtensionPropertyDefinition {
  type?: string | undefined;
  typeSimple?: string | undefined;
  ui?:
    | {
        onTable?: { isVisible?: boolean | undefined; isSortable?: boolean | undefined } | undefined;
        onCreateForm?: { isVisible?: boolean | undefined } | undefined;
        onEditForm?: { isVisible?: boolean | undefined } | undefined;
        lookup?: { url?: string | null | undefined } | undefined;
      }
    | undefined;
}

export interface MappedExtensionProperty {
  type: ObjectExtensionType;
  recognised: boolean;
  reason?: string | undefined;
  onTable: boolean;
  onCreateForm: boolean;
  onEditForm: boolean;
  sortable: boolean;
}

/** Maps an ABP extension property's type and visibility for runtime controls and diagnostics. */
export function mapExtensionProperty(
  name: string,
  property: ExtensionPropertyDefinition,
  enums: Record<string, unknown> = {},
): MappedExtensionProperty {
  const simple = (property.typeSimple ?? '').replace(/\?$/, '');
  const known = (OBJECT_EXTENSION_TYPES as readonly string[]).includes(simple);
  const type: ObjectExtensionType = property.ui?.lookup?.url
    ? 'typeahead'
    : name.endsWith('_Text')
      ? 'hidden'
      : known
        ? (simple as ObjectExtensionType)
        : 'string';
  const result: MappedExtensionProperty = {
    type,
    recognised: true,
    onTable: property.ui?.onTable?.isVisible === true,
    onCreateForm: property.ui?.onCreateForm?.isVisible === true,
    onEditForm: property.ui?.onEditForm?.isVisible === true,
    sortable: property.ui?.onTable?.isSortable === true,
  };

  if (!known && type !== 'typeahead' && type !== 'hidden') {
    result.recognised = false;
    result.reason = `${simple || 'no type'} is not one the mapping knows, so it renders as text`;
  } else if (type === 'enum' && (!property.type || !Object.hasOwn(enums, property.type))) {
    result.recognised = false;
    result.reason = `no enum called ${property.type ?? '(none)'} in the configuration, so the raw value is shown`;
  } else if (!result.onTable && !result.onCreateForm && !result.onEditForm) {
    result.reason = 'hidden on the table and both forms, so it is configured to show nowhere';
  }
  return result;
}
