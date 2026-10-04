# 应用状态

应用配置包含当前用户、权限、设置、功能、本地化、对象扩展和租户。启动时读取，认证与其他状态变化后按需刷新。

```ts
import { useConfigState } from '@lsw-abpvue/core';

const config = useConfigState();
const user = config.getOne('currentUser');
const clock = config.getDeep<string>('timing.timeZone.iana');
const snapshot = config.snapshot();
```

getOne、getDeep 返回 ComputedRef，脚本用 `.value`，模板自动更新。snapshot 是当下对象，不会作为动态选择器跟随未来替换。

## 专用服务

常用读取可以使用 CurrentUserService、PermissionService、SettingService、FeatureService、LocalizationService。SessionStateService 保存用户选择的语言和租户，并与其他标签页同步。

初始状态结构完整但数据为空，认证未完成时仍要允许匿名用户。

## 刷新

`await config.refreshAppState()` 重新获取配置。自定义操作改变权限、设置或当前用户时按需调用。配置以整体替换方式维护，内部 shallowRef 避免对大型服务端对象做深层响应式追踪，不要求 Pinia 或 Vuex。

## 列表偏好

`useListPreferences(key)` 按用户保存每页条数、排序和隐藏列，不保存页码和筛选。无效值回退默认，退出或续期失败清理当前用户。自定义认证可调用 `clearListPreferences(storage, userId)`。
