# 全局功能

全局功能在整个后端解决方案中启用某项能力，与租户功能值、用户权限分别管理。

## 读取启用状态

~~~ts
import { computed } from 'vue';
import { useFeature, usePermission } from '@lsw-abpvue/core';

const features = useFeature();
const permissions = usePermission();
const globallyEnabled = features.isGlobalEnabled('BookStore.Printing');
const tenantEnabled = features.isEnabled('BookStore.Printing');
const canPrint = computed(() =>
  globallyEnabled.value &&
  tenantEnabled.value &&
  permissions.isGranted('BookStore.Books.Print'),
);
~~~

名称仅作示例，应使用后端实际提供的全局功能、租户功能与策略名，它们不一定同名。只有业务能力确实同时依赖三项条件时，才组合这些检查。

`isGlobalEnabled(name)` 返回 `ComputedRef<boolean>`，检查 `application-configuration.globalFeatures.enabledFeatures` 中是否包含名称。缺失名称返回 false。它不会调用新端点，也不通过租户功能字符串推断结果。

## 三类条件

| 机制 | 后端数据 | 用途 |
| --- | --- | --- |
| 全局功能 | `globalFeatures.enabledFeatures` | 解决方案是否提供能力 |
| 租户功能 | `features.values` | 当前租户是否启用能力或拥有配额 |
| 权限 | `auth.grantedPolicies` | 当前用户是否允许执行操作 |

普通功能服务还支持字符串配额，`isEnabled` 用于布尔值。全局功能只检查启用集合，不表示配额。

## 控制界面

在组件中使用 `v-if="canPrint"`，或者在操作贡献者的 `visible` 回调中组合条件。`requiredPolicy` 与操作的 `permission` 只检查授权策略，不能把功能名写进权限表达式。

全局功能由后端解决方案控制，前端没有可以启用已关闭全局功能的开关。后端配置改变后，通过 `ConfigStateService.refreshAppState()` 刷新应用配置。API 仍然需要后端授权和功能检查。

## 排查意外的 false

检查同一主机／租户、同一用户收到的配置，核对 `enabledFeatures` 中的拼写与大小写；再分别检查租户功能值和授予策略。后端缺少对应模块或未启用全局功能时，隐藏依赖它的 UI 是预期行为。

相关内容见[设置与功能](/zh/core/settings-features)、[权限](/zh/concepts/permissions)。
