import type { FeatureGroupDto, UpdateFeatureDto } from '@lsw-abpvue/feature-management/proxy';
import {
  DEFAULT_PROVIDER_NAME,
  FeatureValueTypes,
  type EditableFeature,
  type SelectionFeatureItem,
} from '../models/feature.js';

/** Pixels one level of nesting indents a feature by. */
export const INDENT_STEP = 20;

/** The groups as one list, each feature remembering where it came from and what it was. */
export function flattenFeatures(groups: readonly FeatureGroupDto[]): EditableFeature[] {
  return groups.flatMap(group =>
    (group.features ?? []).map(feature => ({
      ...feature,
      groupName: group.name ?? '',
      value: feature.value ?? '',
      initialValue: feature.value ?? '',
    })),
  );
}

const typeOf = (feature: EditableFeature): string | undefined => feature.valueType?.name;

const isToggle = (feature: EditableFeature): boolean =>
  typeOf(feature) === FeatureValueTypes.Toggle;

/** Whether a toggle is on. Anything but `"true"` is off, as the backend reads it. */
export const isOn = (feature: EditableFeature): boolean => feature.value.toLowerCase() === 'true';

/**
 * Sets one feature's value and carries the consequence through its group: switching a
 * toggle on switches its toggle ancestors on, and switching one off switches its toggle
 * descendants off. A feature nobody can reach is not a state the server should be sent.
 *
 * @param features All features being edited
 * @param name Which one changed
 * @param value Its new value, as a string
 */
export function setFeatureValue(
  features: readonly EditableFeature[],
  name: string,
  value: string,
): EditableFeature[] {
  const changed = features.find(feature => feature.name === name);
  if (!changed) return [...features];

  const cascade = new Set<string>();

  if (isToggle(changed)) {
    const inGroup = features.filter(feature => feature.groupName === changed.groupName);
    const on = value.toLowerCase() === 'true';

    if (on) {
      // Every toggle above it, so the one just switched on is actually reachable.
      let parent = inGroup.find(f => f.name === changed.parentName && isToggle(f));
      while (parent) {
        cascade.add(parent.name ?? '');
        const next: EditableFeature | undefined = inGroup.find(
          f => f.name === parent?.parentName && isToggle(f),
        );
        parent = next;
      }
    } else {
      const queue = [changed];
      while (queue.length) {
        const node = queue.pop();
        const children = inGroup.filter(f => f.parentName === node?.name && isToggle(f));
        for (const child of children) cascade.add(child.name ?? '');
        queue.push(...children);
      }
    }
  }

  return features.map(feature => {
    if (feature.name === name) return { ...feature, value };
    if (feature.name && cascade.has(feature.name)) {
      return { ...feature, value: value.toLowerCase() === 'true' ? 'true' : 'false' };
    }

    return feature;
  });
}

/** Whether this provider is allowed to change the feature at all. */
function isEditable(feature: EditableFeature, providerName: string): boolean {
  const provider = feature.provider?.name;
  return provider === providerName || provider === DEFAULT_PROVIDER_NAME;
}

/**
 * Whether the control for a feature is read-only. A feature set by some other provider is
 * that provider's to change; a root feature is additionally frozen while any of its
 * children is, because switching it off would take a fixed child with it.
 *
 * @param features All features being edited
 * @param feature The one being rendered
 * @param providerName The provider whose features are being edited
 */
export function isFeatureDisabled(
  features: readonly EditableFeature[],
  feature: EditableFeature,
  providerName: string,
): boolean {
  if (!isEditable(feature, providerName)) return true;
  if (feature.parentName) return false;

  return features
    .filter(child => child.groupName === feature.groupName && child.parentName === feature.name)
    .some(child => !isEditable(child, providerName));
}

/** What the save has to send: the ones whose value is no longer what it arrived as. */
export function changedFeatures(features: readonly EditableFeature[]): UpdateFeatureDto[] {
  return features
    .filter(feature => feature.value !== feature.initialValue)
    .map(feature => ({ name: feature.name, value: feature.value }));
}

/** The choices of a selection feature, empty for every other kind. */
export function selectionItemsOf(feature: EditableFeature): SelectionFeatureItem[] {
  if (typeOf(feature) !== FeatureValueTypes.Selection) return [];

  const source = (feature.valueType as { itemSource?: { items?: SelectionFeatureItem[] } })
    .itemSource;

  return source?.items ?? [];
}

/** `Resource::Key` of one choice's label, the way ABP's own UIs assemble it. */
export const selectionItemKey = (item: SelectionFeatureItem): string =>
  `${item.displayText?.resourceName ?? ''}::${item.displayText?.name ?? ''}`;

/** A free text feature the server validates as a number gets a number box. */
export const freeTextInputType = (feature: EditableFeature): 'number' | 'text' =>
  feature.valueType?.validator?.name?.toLowerCase() === 'numeric' ? 'number' : 'text';

/** The bounds a numeric validator states, so the box refuses what the server would. */
export function freeTextBounds(feature: EditableFeature): { min?: number; max?: number } {
  if (freeTextInputType(feature) !== 'number') return {};

  const properties = feature.valueType?.validator?.properties ?? {};
  const asNumber = (value: unknown): number | undefined =>
    typeof value === 'number' ? value : undefined;

  const min = asNumber(properties['MinValue']);
  const max = asNumber(properties['MaxValue']);

  return { ...(min === undefined ? {} : { min }), ...(max === undefined ? {} : { max }) };
}
