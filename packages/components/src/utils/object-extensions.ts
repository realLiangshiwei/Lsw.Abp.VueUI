import {
  ConfigStateService,
  FeatureService,
  LocalizationService,
  PermissionService,
  RestService,
  type EntityExtensionDto,
  type ExtensionEnumDto,
  type ExtensionPropertyDto,
  type ExtensionPropertyPolicyDto,
  type ExtensionPropertyUiLookupDto,
  type Injector,
  type LocalizableStringDto,
} from '@lsw-abpvue/core';
import type { AbpOption } from '@lsw-abpvue/theme-shared';
import { isDevMode } from '@lsw-abpvue/utils';
import { PropType } from '../enums/prop-type.js';
import {
  EntityProp,
  type EntityPropContributorCallbacks,
  type EntityPropList,
} from '../models/entity-props.js';
import {
  FormProp,
  type FormPropContributorCallbacks,
  type FormPropList,
} from '../models/form-props.js';
import type { PropData } from '../models/prop-data.js';
import { markObjectExtensionContributor } from './object-extension-marker.js';
import { getValidatorsFromProperty } from './object-extension-validators.js';
import { readValue } from './record.js';

/** ABP's lookup extension keeps the display text of a lookup in a second property. */
const TYPEAHEAD_TEXT_SUFFIX = '_Text';

const PROP_TYPES = new Set<string>(Object.values(PropType));

/** What the mapping produces: one contributor set per extension point. */
export interface ObjectExtensionContributors<R = unknown> {
  prop: EntityPropContributorCallbacks<R>;
  createForm: FormPropContributorCallbacks<R>;
  editForm: FormPropContributorCallbacks<R>;
}

/**
 * The entities a module's object extensions describe, keyed by entity name (`User`,
 * `Role`). Empty when the backend extends nothing, which is the usual case.
 * @param injector Anything that can resolve `ConfigStateService`
 * @param moduleKey The module as ABP names it, e.g. `Identity`
 */
export function getObjectExtensionEntities(
  injector: Injector,
  moduleKey: string,
): Record<string, EntityExtensionDto> {
  const configState = injector.get(ConfigStateService);

  return configState.snapshot().objectExtensions.modules[moduleKey]?.entities ?? {};
}

function policyHolds(injector: Injector, policy: ExtensionPropertyPolicyDto | undefined): boolean {
  if (!policy) return true;

  const permission = injector.get(PermissionService);
  const feature = injector.get(FeatureService);

  const checks: [readonly string[] | undefined, boolean, (name: string) => boolean][] = [
    [
      policy.permissions?.permissionNames,
      policy.permissions?.requiresAll === true,
      name => permission.isGranted(name),
    ],
    [
      policy.features?.features,
      policy.features?.requiresAll === true,
      name => feature.isEnabled(name).value,
    ],
    [
      policy.globalFeatures?.features,
      policy.globalFeatures?.requiresAll === true,
      name => feature.isGlobalEnabled(name).value,
    ],
  ];

  return checks.every(([names, requiresAll, holds]) =>
    !names?.length ? true : requiresAll ? names.every(holds) : names.some(holds),
  );
}

/**
 * The properties whose policy the current user satisfies. Angular deletes the others
 * from the configuration state; this returns a new object, so the properties come back
 * when the next user has the permission.
 */
function permittedProperties(
  injector: Injector,
  properties: Record<string, ExtensionPropertyDto>,
): Record<string, ExtensionPropertyDto> {
  return Object.fromEntries(
    Object.entries(properties).filter(([, property]) => policyHolds(injector, property.policy)),
  );
}

/** `System.String?` is `string`, and anything we do not know renders as text. */
function propTypeOf(property: ExtensionPropertyDto, name: string): PropType {
  const simple = (property.typeSimple ?? '').replace(/\?$/, '');
  if (PROP_TYPES.has(simple)) return simple as PropType;

  if (isDevMode() && simple) {
    console.warn(
      `[abp] The extension property "${name}" has type "${simple}", which is not one of PropType. It is rendered as text.`,
    );
  }

  return PropType.String;
}

function typeaheadTypeOf(
  lookup: ExtensionPropertyUiLookupDto | undefined,
  name: string,
): PropType | undefined {
  if (lookup?.url) return PropType.Typeahead;

  // The `_Text` half of a lookup carries the display text; the typeahead writes it, and
  // the user never edits it directly.
  return name.endsWith(TYPEAHEAD_TEXT_SUFFIX) ? PropType.Hidden : undefined;
}

/**
 * The localization key of a property's label, by ABP's convention: what the backend
 * named, then `DisplayName:{Name}`, then `{Name}` -- and the bare name when the resource
 * has none of them.
 */
function displayNameOf(
  localization: LocalizationService,
  displayName: LocalizableStringDto | undefined,
  fallback: { name: string; resource: string },
): string {
  if (displayName?.name) {
    return (
      localization.findKey([displayName.resource ?? ''], [displayName.name], displayName.name) ??
      displayName.name
    );
  }

  return (
    localization.findKey([fallback.resource], [`DisplayName:${fallback.name}`]) ??
    localization.findKey([fallback.resource], [fallback.name], fallback.name) ??
    fallback.name
  );
}

/** `Volo.Abp.Identity.IdentityUserType` is localized under `IdentityUserType.Member`. */
function enumLabelKey(
  localization: LocalizationService,
  enumType: string,
  enumeration: ExtensionEnumDto,
  field: string,
): string {
  const shortType = enumType.split('.').at(-1) ?? enumType;

  return (
    localization.findKey(
      [enumeration.localizationResource ?? ''],
      [`Enum:${shortType}.${field}`, `${shortType}.${field}`, field],
      field,
    ) ?? field
  );
}

function enumOptions(
  localization: LocalizationService,
  enumType: string,
  enumeration: ExtensionEnumDto,
): AbpOption[] {
  return enumeration.fields.map(field => ({
    value: field.value as AbpOption['value'],
    label: localization.t(enumLabelKey(localization, enumType, enumeration, field.name ?? '')),
  }));
}

function lookupOptions(
  lookup: ExtensionPropertyUiLookupDto,
  data: PropData<unknown>,
  searchTerm: string,
): Promise<AbpOption[]> {
  const rest = data.getInjected(RestService);

  return rest
    .request<void, Record<string, unknown>>(
      {
        method: 'GET',
        url: lookup.url ?? '',
        params: { [lookup.filterParamName ?? '']: searchTerm },
      },
      { apiName: 'Default' },
    )
    .then(response => {
      const items = response[lookup.resultListPropertyName ?? ''];

      return (Array.isArray(items) ? (items as Record<string, unknown>[]) : []).map(item => ({
        value: item[lookup.valuePropertyName ?? ''] as AbpOption['value'],
        label: String(item[lookup.displayPropertyName ?? ''] ?? ''),
      }));
    });
}

/**
 * Turns a module's object extensions into contributors, which is what makes a property
 * added on the server show up as a column and a form field with no code here at all.
 *
 * @param injector Resolves the configuration, the permissions and the localization
 * @param entities The entities to map, keyed by the **component key** whose page shows
 * them, e.g. `{ 'Identity.UsersComponent': entities.User }`
 * @param localizationResource The module's resource, e.g. `AbpIdentity`
 */
export function mapEntitiesToContributors<R = unknown>(
  injector: Injector,
  entities: Record<string, EntityExtensionDto | undefined>,
  localizationResource: string,
): ObjectExtensionContributors<R> {
  const localization = injector.get(LocalizationService);
  const enums = injector.get(ConfigStateService).snapshot().objectExtensions.enums;

  const contributors: ObjectExtensionContributors<R> = { prop: {}, createForm: {}, editForm: {} };

  for (const [componentKey, entity] of Object.entries(entities)) {
    contributors.prop[componentKey] = [];
    contributors.createForm[componentKey] = [];
    contributors.editForm[componentKey] = [];

    const properties = permittedProperties(injector, entity?.properties ?? {});

    for (const [name, property] of Object.entries(properties)) {
      const lookup = property.ui.lookup;
      const type = typeaheadTypeOf(lookup, name) ?? propTypeOf(property, name);
      const enumeration = property.type ? enums[property.type] : undefined;

      // A `_Text` property is labelled after the property it belongs to, so the pair
      // reads as one field.
      const labelledAs = name.endsWith(TYPEAHEAD_TEXT_SUFFIX)
        ? name.slice(0, -TYPEAHEAD_TEXT_SUFFIX.length)
        : name;
      const displayName = displayNameOf(
        localization,
        // The backend sends null for a property with no display name of its own.
        properties[labelledAs]?.displayName ?? property.displayName ?? undefined,
        { name: labelledAs, resource: localizationResource },
      );

      if (property.ui.onTable.isVisible) {
        const column = EntityProp.create<R>({
          type,
          name,
          displayName,
          isExtra: true,
          sortable: property.ui.onTable.isSortable === true,
          columnWidth: type === PropType.Boolean ? 150 : 250,
          ...(enumeration && property.type
            ? {
                valueResolver: (data: PropData<R>) => () => {
                  const value = readValue(data.record, name, true);
                  const field = enumeration.fields.find(entry => entry.value === value);

                  return field
                    ? localization.t(
                        enumLabelKey(
                          localization,
                          property.type ?? '',
                          enumeration,
                          field.name ?? '',
                        ),
                      )
                    : (value as string | number | boolean | null | undefined);
                },
              }
            : {}),
        });

        contributors.prop[componentKey].push(
          // Named so the inspector's report says where the column came from.
          markObjectExtensionContributor(function objectExtension(propList: EntityPropList<R>) {
            propList.addTail(column);
          }),
        );
      }

      const onCreateForm = property.ui.onCreateForm.isVisible;
      const onEditForm = property.ui.onEditForm.isVisible;
      if (!onCreateForm && !onEditForm) continue;

      const field = FormProp.create<R>({
        type,
        name,
        displayName,
        isExtra: true,
        defaultValue: property.defaultValue,
        validators: () => getValidatorsFromProperty(property),
        ...(property.formText ? { formText: property.formText } : {}),
        ...(enumeration && property.type
          ? { options: () => () => enumOptions(localization, property.type ?? '', enumeration) }
          : {}),
        ...(type === PropType.Typeahead && lookup
          ? {
              options: (data: PropData<R>, searchTerm?: string) =>
                lookupOptions(lookup, data as PropData<unknown>, searchTerm ?? ''),
            }
          : {}),
      });

      const contributor = markObjectExtensionContributor(function objectExtension(
        propList: FormPropList<R>,
      ) {
        propList.addTail(field);
      });

      if (onCreateForm) contributors.createForm[componentKey].push(contributor);
      if (onEditForm) contributors.editForm[componentKey].push(contributor);
    }
  }

  return contributors;
}
