# 设置与功能

读取服务使用应用配置，返回响应式值，不负责保存到后端。

```ts
import { useFeature, useSetting } from '@lsw-abpvue/core';

const setting = useSetting();
const feature = useFeature();
const culture = setting.get('Abp.Localization.DefaultLanguage');
const enabled = feature.isEnabled('BookStore.Printing');
const quota = feature.get('BookStore.PrintingQuota');
```

## 值与条件

| API | 返回值 |
| --- | --- |
| `setting.get(name)` | computed 字符串或 undefined |
| `setting.getBoolean(name)` | computed 布尔值 |
| `setting.getAll(keyword?)` | computed 设置字典，可按关键字筛选 |
| `feature.get(name)` | computed 字符串或 undefined |
| `feature.isEnabled(name)` | computed 功能启用条件 |
| `feature.isGlobalEnabled(name)` | computed 全局功能启用条件 |

功能值可以表示布尔值、配额或选项。数值配额先以字符串读取，再按业务契约转换；缺失与零是不同状态。

## 保存值

写入使用[设置管理](/zh/modules/setting-management)、[功能管理](/zh/modules/feature-management)，或自己的类型化后端服务。自定义保存改变当前会话的有效设置或功能后，需要刷新应用配置。

权限与功能是两个独立条件，启用功能不代表用户拥有操作权限。
