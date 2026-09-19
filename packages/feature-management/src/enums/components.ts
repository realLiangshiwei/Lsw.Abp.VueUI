/**
 * The component keys ABP's Angular feature management module uses, verbatim, so a host
 * that replaced the dialog there replaces the same one here.
 */
export const FeatureManagementComponents = {
  FeatureManagement: 'FeatureManagement.FeatureManagementComponent',
} as const;

export type FeatureManagementComponent =
  (typeof FeatureManagementComponents)[keyof typeof FeatureManagementComponents];
