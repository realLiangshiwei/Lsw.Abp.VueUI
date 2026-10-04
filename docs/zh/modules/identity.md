# 身份管理

用户与角色 CRUD、搜索、角色分配和权限对话框。

## 安装与注册

```bash
pnpm add @lsw-abpvue/identity@alpha
```

```ts
import { provideIdentityConfig } from '@lsw-abpvue/identity/config';
import { lazyRoutes } from '@lsw-abpvue/core/router';

const moduleConfig = provideIdentityConfig();
const moduleRoute = lazyRoutes('/identity', () =>
  import('@lsw-abpvue/identity').then(module => module.createIdentityRoutes()),
);
```

将 `moduleConfig` 放入启动提供者，`moduleRoute` 放入路由数组。后端需要安装对应 ABP 模块。

## 路由与 key

| 页面 | 路由 | Key |
| --- | --- | --- |
| 用户 | `/identity/users` | `Identity.UsersComponent` |
| 角色 | `/identity/roles` | `Identity.RolesComponent` |

## 权限与配置

页面策略为 `AbpIdentity.Users`、`AbpIdentity.Roles`，新增、更新、删除、管理权限使用对应后缀，建议从 `/config` 导入 `IdentityPolicyNames`。

## 行为与定制

五类贡献者定制列、新增与编辑字段、行操作和工具栏操作。`Identity.User`、`Identity.Role` 对象扩展自动映射受支持元数据。见[用户扩展教程](/zh/tutorials/extend-users)。锁定管理、给其他用户设置密码、逐用户二次验证管理依赖开源模块未提供的后端 API。

服务和 DTO 从 `@lsw-abpvue/identity/proxy` 导入，[公共导出](/zh/api/identity)列出配置、类型与扩展选项。
