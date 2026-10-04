# 替换组件

贡献者无法表达所需行为时，可以替换整个模块页面。公共组件 key 标识替换对象，与 ABP Angular 的 key 一致。

```ts
import { inject, provideAppInitializer, ReplaceableComponentsService } from '@lsw-abpvue/core';
import { IdentityComponents } from '@lsw-abpvue/identity';
import MyUsersPage from './MyUsersPage.vue';

const customUsers = provideAppInitializer(() => {
  inject(ReplaceableComponentsService).add({
    key: IdentityComponents.Users,
    component: MyUsersPage,
  });
});
```

将 `customUsers` 放入应用提供者数组，排列在被覆盖的注册之后。同一个 key 再次注册时替换之前的组件。使用 `AbpReplaceableRouteContainer` 的路由会渲染当前注册，路由守卫与权限元数据继续生效。

## 主题契约

替换十二个主题控件之一时使用 `provideThemeComponents`，这些控件通过主题契约注册表解析。覆盖项放在选定主题提供者之后：

```ts
import { provideThemeComponents } from '@lsw-abpvue/theme-shared';
import MyDatePicker from './MyDatePicker.vue';

const datePickerOverride = provideThemeComponents({ AbpDatePicker: MyDatePicker });
```

替代实现需要满足公共属性、事件、插槽和无障碍行为。[组件参考](/zh/components/)列出契约；仅调整已有列、字段和操作时，可使用范围更小的[页面扩展](/zh/concepts/extensions)。
