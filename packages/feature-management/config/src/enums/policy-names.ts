/** The permission names the feature management module checks. */
export const FeatureManagementPolicyNames = {
  ManageHostFeatures: 'FeatureManagement.ManageHostFeatures',
} as const;

export type FeatureManagementPolicyName =
  (typeof FeatureManagementPolicyNames)[keyof typeof FeatureManagementPolicyNames];
