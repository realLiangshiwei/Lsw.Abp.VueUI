export const OpenIddictProRouteNames = {
  Default: 'AbpOpenIddict::Menu:OpenIddict',
  Applications: 'AbpOpenIddict::Applications',
  Scopes: 'AbpOpenIddict::Scopes',
} as const;

export const OpenIddictProPolicyNames = {
  Default: 'OpenIddictPro.Application',
  Application: 'OpenIddictPro.Application',
  ApplicationCreate: 'OpenIddictPro.Application.Create',
  ApplicationUpdate: 'OpenIddictPro.Application.Update',
  ApplicationDelete: 'OpenIddictPro.Application.Delete',
  ApplicationManagePermissions: 'OpenIddictPro.Application.ManagePermissions',
  ApplicationGenerateAccessToken: 'OpenIddictPro.Application.GenerateAccessToken',
  ApplicationChangeHistory:
    'AuditLogging.ViewChangeHistory:Volo.Abp.OpenIddict.Pro.Applications.Application',
  Scope: 'OpenIddictPro.Scope',
  ScopeCreate: 'OpenIddictPro.Scope.Create',
  ScopeUpdate: 'OpenIddictPro.Scope.Update',
  ScopeDelete: 'OpenIddictPro.Scope.Delete',
  ScopeChangeHistory: 'AuditLogging.ViewChangeHistory:Volo.Abp.OpenIddict.Pro.Scopes.Scope',
} as const;

export type OpenIddictProPolicyName =
  (typeof OpenIddictProPolicyNames)[keyof typeof OpenIddictProPolicyNames];
