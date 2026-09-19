/** The id of the tab this module puts on the settings page, as Angular names it. */
export const FeatureManagementTabNames = {
  FeatureManagement: 'AbpFeatureManagement::Permission:FeatureManagement',
} as const;

export type FeatureManagementTabName =
  (typeof FeatureManagementTabNames)[keyof typeof FeatureManagementTabNames];
