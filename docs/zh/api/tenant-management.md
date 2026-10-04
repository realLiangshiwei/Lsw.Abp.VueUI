# @lsw-abpvue/tenant-management

按导入入口列出公开导出。值导出存在于运行时；类型导出使用 `import type`。源码链接指向对应声明。

本参考跟随 **main**。npm 已发布通道是 **alpha**；使用尚未发布的变更前请查看[版本与兼容性](/zh/release/compatibility)。

## 导入

```ts
import { AbpTenantConnectionString } from '@lsw-abpvue/tenant-management';
```

## `@lsw-abpvue/tenant-management`

| 导出                                              | 类别 | 源码                                                                                                                                       |
| ------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `AbpTenantConnectionString`                       | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/components/AbpTenantConnectionString.vue) |
| `TenantsPage`                                     | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/components/TenantsPage.vue)               |
| `DEFAULT_TENANTS_CREATE_FORM_PROPS`               | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/defaults/tenants.ts)                      |
| `DEFAULT_TENANTS_EDIT_FORM_PROPS`                 | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/defaults/tenants.ts)                      |
| `DEFAULT_TENANTS_ENTITY_ACTIONS`                  | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/defaults/tenants.ts)                      |
| `DEFAULT_TENANTS_ENTITY_PROPS`                    | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/defaults/tenants.ts)                      |
| `DEFAULT_TENANTS_TOOLBAR_ACTIONS`                 | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/defaults/tenants.ts)                      |
| `TenantManagementComponents`                      | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/enums/components.ts)                      |
| `TenantManagementComponent`                       | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/enums/components.ts)                      |
| `TenantManagementConfigOptions`                   | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/models/config-options.ts)                 |
| `provideTenantManagement`                         | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/providers/tenant-management.provider.ts)  |
| `tenantManagementExtensionsResolver`              | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/resolvers/extensions.resolver.ts)         |
| `createTenantManagementRoutes`                    | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/routes.ts)                                |
| `TENANT_MANAGEMENT_CREATE_FORM_PROP_CONTRIBUTORS` | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/tokens/extensions.token.ts)               |
| `TENANT_MANAGEMENT_EDIT_FORM_PROP_CONTRIBUTORS`   | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/tokens/extensions.token.ts)               |
| `TENANT_MANAGEMENT_ENTITY_ACTION_CONTRIBUTORS`    | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/tokens/extensions.token.ts)               |
| `TENANT_MANAGEMENT_ENTITY_PROP_CONTRIBUTORS`      | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/tokens/extensions.token.ts)               |
| `TENANT_MANAGEMENT_TOOLBAR_ACTION_CONTRIBUTORS`   | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/tokens/extensions.token.ts)               |
| `TENANTS_PAGE`                                    | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/tokens/extensions.token.ts)               |
| `TenantManagementEntityActionContributors`        | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/tokens/extensions.token.ts)               |
| `TenantManagementEntityPropContributors`          | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/tokens/extensions.token.ts)               |
| `TenantManagementFormPropContributors`            | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/tokens/extensions.token.ts)               |
| `TenantManagementToolbarActionContributors`       | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/tokens/extensions.token.ts)               |
| `TenantsPageCommands`                             | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/src/tokens/extensions.token.ts)               |

## `@lsw-abpvue/tenant-management/config`

| 导出                            | 类别 | 源码                                                                                                                                                    |
| ------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TenantManagementPolicyNames`   | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/config/src/enums/policy-names.ts)                          |
| `TenantManagementPolicyName`    | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/config/src/enums/policy-names.ts)                          |
| `TenantManagementRouteNames`    | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/config/src/enums/route-names.ts)                           |
| `TenantManagementRouteName`     | 类型 | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/config/src/enums/route-names.ts)                           |
| `provideTenantManagementConfig` | 值   | [源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/tenant-management/config/src/providers/tenant-management-config.provider.ts) |

## `@lsw-abpvue/tenant-management/proxy`

| 导出 | 类别 | 源码 |
| ---- | ---- | ---- |
