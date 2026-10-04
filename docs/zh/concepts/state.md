# 应用状态

应用配置包含当前用户、已授予策略、设置、功能、本地化、对象扩展与当前租户。应用在启动时读取，会话变化后按需刷新。

## 响应式读取

~~~ts
import { useConfigState } from '@lsw-abpvue/core';

const config = useConfigState();
const user = config.getOne('currentUser');
const clock = config.getDeep<string | undefined>('timing.timeZone.iana');
const snapshot = config.snapshot();
~~~

`getOne` 返回顶层字段的类型化 computed ref。`getDeep` 读取点分隔路径，泛型是调用者提供的类型断言，可能缺失的路径应包含 undefined。模板自动解包，脚本读取 `.value`。

`snapshot()` 返回当下的对象。将它保存到变量后，不会自动跟随之后的配置替换。屏幕上需要更新的值应通过选择器读取。

## 选择专用服务

| 需求 | 服务／组合式函数 |
| --- | --- |
| 当前用户与认证状态 | `CurrentUserService`／`useCurrentUser` |
| 权限策略 | `PermissionService`／`usePermission` |
| 设置值 | `SettingService`／`useSetting` |
| 租户功能与全局功能 | `FeatureService`／`useFeature` |
| 翻译文本与文化 | `LocalizationService`／`useLocalization` |
| 访问者选择的语言与租户 | `SessionStateService`／`useSessionState` |

应用配置是服务端计算后的有效结果。会话状态保存访问者的选择，并将支持的变更同步到其他标签页。业务记录、页面草稿与查询结果应在自己的 Vue 作用域内维护。

## 变更后刷新

~~~ts
const saveAndRefresh = async (): Promise<void> => {
  await saveCurrentUser();
  await config.refreshAppState();
};
~~~

`saveCurrentUser` 是页面已有的保存操作。当它改变当前用户、权限、设置或租户的有效值时刷新配置，不必在每次普通业务 CRUD 后重新加载整份配置。

刷新会读取配置和所选文化的文本，重叠刷新只保留最新结果并取消旧请求。请求失败会拒绝 Promise，并保留已有状态，使用正常的请求反馈处理。服务端保存成功后刷新失败，不会撤销已经保存的修改。

仅更新某个文化的文本时使用 `refreshLocalization(cultureName)`；语言选择由本地化服务协调，见[本地化](/zh/concepts/localization)。

## 初始状态与更新方式

初始结构完整，但数据为空。启动完成前，当前用户仍可能匿名，策略仍可能未授予，功能值仍可能缺失。通过应用启动或页面展示加载状态，不要把空用户当成已经认证。

配置由浅层 store 持有，通过服务方法发布替换。不应直接修改 `snapshot().auth.grantedPolicies` 等嵌套字段，读取者依赖显式更新。`setState` 适用于有意提供的配置与隔离测试；普通应用从后端加载。

模板之外的回调可以使用 `config.onUpdate(callback)`，返回值用于取消订阅。将清理绑定到组件或服务生命周期，避免旧页面继续接收变更。

## 页面偏好

`useListPreferences(key)` 按用户保存每页条数、排序和隐藏列，不保存页码与筛选。存储无效时回退默认值，退出与续期失败清理当前用户偏好。存储 key 与查询生命周期见[列表与偏好](/zh/utilities/lists)。
