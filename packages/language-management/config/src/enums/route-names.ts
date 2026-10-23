export const LanguageManagementRouteNames = {
  LanguageManagement: 'LanguageManagement::LanguageManagement',
  Languages: 'LanguageManagement::Languages',
  LanguageTexts: 'LanguageManagement::LanguageTexts',
} as const;

export const LanguageManagementPolicyNames = {
  LanguageManagement: 'LanguageManagement.Languages || LanguageManagement.LanguageTexts',
  Languages: 'LanguageManagement.Languages',
  LanguagesCreate: 'LanguageManagement.Languages.Create',
  LanguagesEdit: 'LanguageManagement.Languages.Edit',
  LanguagesDelete: 'LanguageManagement.Languages.Delete',
  LanguagesChangeDefault: 'LanguageManagement.Languages.ChangeDefault',
  LanguageTexts: 'LanguageManagement.LanguageTexts',
  LanguageTextsEdit: 'LanguageManagement.LanguageTexts.Edit',
} as const;

export type LanguageManagementPolicyName =
  (typeof LanguageManagementPolicyNames)[keyof typeof LanguageManagementPolicyNames];
