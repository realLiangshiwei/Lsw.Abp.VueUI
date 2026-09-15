/**
 * The ids of the tabs this module puts on the profile page. A host removes or reorders
 * one by name; ABP's Angular UI has the same two written into a template, so it has no
 * names for them (difference +).
 */
export const ManageProfileTabs = {
  ChangePassword: 'Account.ManageProfile.ChangePassword',
  PersonalSettings: 'Account.ManageProfile.PersonalSettings',
} as const;

export type ManageProfileTab = (typeof ManageProfileTabs)[keyof typeof ManageProfileTabs];
