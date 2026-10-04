# 当前用户

`useCurrentUser()` 读取应用配置中的当前用户。配置重新加载后，返回值会自动更新。

```ts
import { useCurrentUser } from '@lsw-abpvue/core';

const currentUser = useCurrentUser();
const user = currentUser.user;
const authenticated = currentUser.isAuthenticated;
const roles = currentUser.roles;
```

这些值都是 computed ref，在脚本中使用 `.value`，模板中由 Vue 自动解包。匿名配置也是有效状态，不应假定 `user.id` 一定存在。

## 身份与授权

当前用户信息用于显示姓名或选择已登录视图。权限判断使用 `PermissionService`，角色名称不能替代授权策略，后端仍需检查所有受保护操作。

认证导航应注入 `AuthService`，它按照配置选择本地登录页或授权服务器。[认证](/zh/guide/authentication)说明了对应的个人资料与退出行为。

## 刷新用户信息

认证成功后会重新加载应用配置。自定义操作改变当前用户权限或资料时，应显式刷新相应状态。`ConfigStateService.refreshAppState()` 刷新框架配置，个人资料页签还维护 `account-core` 中独立的资料状态。
