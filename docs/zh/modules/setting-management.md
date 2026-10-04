# 设置管理

模块与宿主可以扩展页签树的设置页面。

## 安装与注册

```bash
pnpm add @lsw-abpvue/setting-management@alpha
```

```ts
import { provideSettingManagementConfig } from '@lsw-abpvue/setting-management/config';
import { lazyRoutes } from '@lsw-abpvue/core/router';

const moduleConfig = provideSettingManagementConfig();
const moduleRoute = lazyRoutes('/setting-management', () =>
  import('@lsw-abpvue/setting-management').then(module => module.createSettingManagementRoutes()),
);
```

将 `moduleConfig` 放入启动提供者，`moduleRoute` 放入路由数组。后端需要安装对应 ABP 模块。

## 路由与 key

| 页面 | 路由 | Key |
| --- | --- | --- |
| 设置 | `/setting-management` | `SettingManagement.SettingsComponent` |

## 权限与配置

邮件使用 `SettingManagement.Emailing`，发送测试使用 `SettingManagement.Emailing.Test`。时区使用 `SettingManagement.TimeZone` 并要求后端启用时区能力。页签按权限、功能与 API 可用性显示。

## 行为与定制

提供邮件、账户和时区页签。默认账户页签只读显示本地登录与自注册设置，开源账户模块没有更新它们的端点。宿主可用可写适配器替换 `/config` 的 `AccountSettingsService`，要求的策略应匹配自定义 API。先注册设置配置，再注册功能配置。自定义页签使用 `SettingTabsService`，见[资料与设置页签](/zh/customization/profile-settings)。

服务和 DTO 从 `@lsw-abpvue/setting-management/proxy` 导入，[公共导出](/zh/api/setting-management)列出配置、类型与扩展选项。
