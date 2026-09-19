import type { FeatureDto } from '@lsw-abpvue/feature-management/proxy';

/** The three shapes a feature's value can take, as the backend names them. */
export const FeatureValueTypes = {
  Toggle: 'ToggleStringValueType',
  FreeText: 'FreeTextStringValueType',
  Selection: 'SelectionStringValueType',
} as const;

export type FeatureValueType = (typeof FeatureValueTypes)[keyof typeof FeatureValueTypes];

/** The provider a feature no one has set yet comes from. */
export const DEFAULT_PROVIDER_NAME = 'D';

/**
 * One choice of a selection feature. `FeatureDto.valueType` is `IStringValueType` in the
 * application contracts, so the generator cannot know about this; the API serializes the
 * concrete type, and this is that type's own shape.
 */
export interface SelectionFeatureItem {
  value?: string | undefined;
  displayText?: { resourceName?: string | undefined; name?: string | undefined } | undefined;
}

/** A feature being edited: which group it came from, and what it was before. */
export interface EditableFeature extends FeatureDto {
  groupName: string;
  /** A string throughout, which is what the server states and what it takes back. */
  value: string;
  initialValue: string;
}
