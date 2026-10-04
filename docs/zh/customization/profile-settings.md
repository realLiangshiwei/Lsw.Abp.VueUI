# 个人资料与设置页签

两类页面都渲染贡献者提供的页签树。`name` 是稳定 ID，未指定 `text` 时也是本地化 key。修改或删除时使用同一个名称。

## 个人资料页签

`@lsw-abpvue/account` 的 `provideManageProfileTabs()` 注册个人信息与修改密码默认页签。添加应用页签时传入 Vue 组件：

```ts
import { defineAsyncComponent } from 'vue';
import { inject, provideAppInitializer } from '@lsw-abpvue/core';
import { provideManageProfileTabs } from '@lsw-abpvue/account';
import { ManageProfileTabsService } from '@lsw-abpvue/account-core';

const defaultTabs = provideManageProfileTabs();
const customTabs = provideAppInitializer(() => {
  inject(ManageProfileTabsService).add([
    { name: 'BookStore::ApiKeys', order: 3, component: defineAsyncComponent(() => import('./ApiKeysTab.vue')) },
  ]);
});
```

这会修改本地 `/account/manage` 页面，不会改变认证服务器自己的 `/Account/Manage` 页面。

## 设置页签

先注册 `provideSettingManagementConfig()`，再通过应用初始化器中的 `SettingTabsService` 添加页签：

```ts
import { inject, provideAppInitializer } from '@lsw-abpvue/core';
import { SettingTabsService } from '@lsw-abpvue/setting-management/config';
import PrintingTab from './PrintingTab.vue';

const printingSettings = provideAppInitializer(() => {
  inject(SettingTabsService).add([
    { name: 'BookStore::Printing', order: 5, requiredPolicy: 'BookStore.Settings', component: PrintingTab },
  ]);
});
```

页签组件负责自己的 API 调用和验证。`requiredPolicy`、`visible` 控制显隐，调整标签时保留稳定名称，自定义保存成功后刷新有效设置。
