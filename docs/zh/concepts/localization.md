# 本地化

资源与文本来自 ABP 后端，使用相同的 `Resource::Key` 名称。

```vue
<h1>{{ $t('AbpIdentity::Users') }}</h1>
<p>{{ $t('AbpIdentity::UserDeletionConfirmationMessage', user.userName) }}</p>
```

模板中的 `$t` 随语言变化更新。脚本中的 `useLocalization()` 提供服务，`t(key, ...params)` 返回当前文本，`tr(key, ...params)` 返回 ComputedRef，`setLanguage(culture)` 切换语言并加载对应资源。

## Key 与默认值

默认资源由后端 `localization.defaultResourceName` 决定。找不到文本时显示 key，开发模式发出警告。可传 `{ key, defaultValue }` 提供缺失时的文字。

## 前端补充文本

```ts
import { provideAbpCore, withOptions, withLocalizations } from '@lsw-abpvue/core';

provideAbpCore(
  withOptions({ environment }),
  withLocalizations([
    { culture: 'en', resources: [{ resourceName: 'BookStore', texts: { Reprint: 'Reprint' } }] },
  ]),
);
```

environment 是应用的环境对象。同 key 的前端文本优先于后端，适合补充 UI 文案或覆盖显示。语言来自后端可用语言列表，切换到 RTL 文化时由主题调整方向。组件中已本地化的标签要先调用 t，接受本地化参数的属性可以直接传 key。
