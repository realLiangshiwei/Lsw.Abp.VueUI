export const TextTemplateManagementPolicyNames = {
  TextTemplates: 'TextTemplateManagement.TextTemplates',
  EditContents: 'TextTemplateManagement.TextTemplates.EditContents',
  EditNonSandboxedContents: 'TextTemplateManagement.TextTemplates.EditNonSandboxedContents',
} as const;

export type TextTemplateManagementPolicyName =
  (typeof TextTemplateManagementPolicyNames)[keyof typeof TextTemplateManagementPolicyNames];
