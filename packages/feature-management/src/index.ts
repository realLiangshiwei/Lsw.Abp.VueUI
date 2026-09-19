export { default as AbpFeatureManagement } from './components/AbpFeatureManagement.vue';

export { FeatureManagementComponents } from './enums/components.js';
export type { FeatureManagementComponent } from './enums/components.js';

export { DEFAULT_PROVIDER_NAME, FeatureValueTypes } from './models/feature.js';
export type { EditableFeature, FeatureValueType, SelectionFeatureItem } from './models/feature.js';

export {
  changedFeatures,
  flattenFeatures,
  freeTextBounds,
  freeTextInputType,
  INDENT_STEP,
  isFeatureDisabled,
  isOn,
  selectionItemKey,
  selectionItemsOf,
  setFeatureValue,
} from './utils/features.js';
