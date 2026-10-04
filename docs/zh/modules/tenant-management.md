# 租户管理

租户 CRUD、功能管理和租户连接字符串。

## 安装与注册

```bash
pnpm add @lsw-abpvue/tenant-management@alpha
```

```ts
import { provideTenantManagementConfig } from '@lsw-abpvue/tenant-management/config';
import { lazyRoutes } from '@lsw-abpvue/core/router';

const moduleConfig = provideTenantManagementConfig();
const moduleRoute = lazyRoutes('/tenant-management', () =>
  import('@lsw-abpvue/tenant-management').then(module => module.createTenantManagementRoutes()),
);
```

将 `moduleConfig` 放入启动提供者，`moduleRoute` 放入路由数组。后端需要安装对应 ABP 模块。

## 路由与 key

| 页面 | 路由 | Key |
| --- | --- | --- |
| 租户 | `/tenant-management/tenants` | `TenantManagement.TenantsComponent` |

## 权限与配置

页面要求 `AbpTenantManagement.Tenants`，操作使用此前缀下的 Create、Update、Delete、ManageFeatures、ManageConnectionStrings。管理属于宿主能力，与登录时选择租户不同。

## 行为与定制

功能管理使用提供者 `T` 和租户 ID 打开共享对话框。连接字符串支持共享数据库或租户独立数据库。页面支持五类贡献者与 `TenantManagement.Tenant` 对象扩展，选项见[页面扩展](/zh/concepts/extensions)，对话框见[功能管理](./feature-management)。

服务和 DTO 从 `@lsw-abpvue/tenant-management/proxy` 导入。启动配置从包的 `/config` 入口导入，页面贡献者传给对应路由工厂。
