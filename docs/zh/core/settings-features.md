# 设置与功能

设置描述应用、用户、租户的有效偏好；功能描述启用能力或配额。读取服务消费应用配置，不负责持久化修改。

## 读取响应式值

~~~ts
import { computed } from 'vue';
import { useFeature, useSetting } from '@lsw-abpvue/core';

const settings = useSetting();
const features = useFeature();
const culture = settings.get('Abp.Localization.DefaultLanguage');
const printingEnabled = features.isEnabled('BookStore.Printing');
const quota = features.get('BookStore.PrintingQuota');
const remainingQuota = computed(() => {
  if (quota.value === undefined) return undefined;
  const parsed = Number(quota.value);
  return Number.isFinite(parsed) ? parsed : undefined;
});
~~~

BookStore 功能名仅作示例，需要后端定义。返回值都是 ComputedRef，在脚本中使用 .value，模板可以直接绑定。

## 方法与转换规则

| API | 返回值 | 转换 |
| --- | --- | --- |
| `settings.get(name)` | `ComputedRef<string \| undefined>` | 有效原始字符串 |
| `settings.getBoolean(name)` | `ComputedRef<boolean>` | 忽略大小写的字符串 true，否则 false |
| `settings.getAll(keyword?)` | `ComputedRef<Record<string, string>>` | 按 key 子字符串筛选，区分大小写 |
| `features.get(name)` | `ComputedRef<string \| undefined>` | 有效原始字符串 |
| `features.isEnabled(name)` | `ComputedRef<boolean>` | 忽略大小写的字符串 true，否则 false |
| `features.isGlobalEnabled(name)` | `ComputedRef<boolean>` | 是否位于全局启用集合 |

不能用 `Boolean(quota.value)` 解析布尔字符串，JavaScript 的 `"false"` 仍是真值。配额 `"0"` 与缺失定义不同。“无限”等特殊值应按后端功能契约解释，不自行猜测数值转换。

## 组合权限

~~~ts
import { computed } from 'vue';
import { useFeature, usePermission } from '@lsw-abpvue/core';

const features = useFeature();
const permissions = usePermission();
const enabled = features.isEnabled('BookStore.Printing');
const showPrint = computed(() =>
  enabled.value && permissions.isGranted('BookStore.Books.Print'),
);
~~~

控件绑定 `v-if="showPrint"`。授予权限不会启用租户功能，启用功能也不会授予权限。需要解决方案层面的条件时，再加入[全局功能](/zh/core/global-features)。

## 保存与刷新

受支持的后端操作使用[设置管理](/zh/modules/setting-management)与[功能管理](/zh/modules/feature-management)。业务专用设置通过自己的生成服务保存。

自定义保存改变当前会话的有效值后，等待 `ConfigStateService.refreshAppState()`，已有 ComputedRef 会读到新值。读取服务没有 set 方法，也不会悄悄修改后端作用域。

主机管理员修改另一个租户的功能，与修改当前用户的有效功能不同；应刷新实际发生变化的会话。

## 排查

检查同一会话的应用配置响应中的 `setting.values` 与 `features.values`，核对后端定义、提供者／作用域和拼写。缺失原始值为 undefined，缺失布尔条件为 false。

使用实际后端定义的设置名与功能名。名称区分大小写，与本地化后的显示文本相互独立。
