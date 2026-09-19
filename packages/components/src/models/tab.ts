import type { LocalizationParam } from '@lsw-abpvue/core';

/**
 * The least `AbpTabList` needs of a tab. `AbpNavTab` satisfies it, and so does a group of
 * a dialog, which has no component behind it and labels itself through the slot.
 */
export interface AbpTabItem {
  name: string;
  /** Localization key of the label; the name is localized instead when there is none. */
  text?: LocalizationParam | undefined;
  iconClass?: string | undefined;
}
