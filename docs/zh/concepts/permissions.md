# 权限

权限检查读取应用配置的 `auth.grantedPolicies`，用于控制界面。后端授权仍决定请求能否成功。

## 快照与响应式检查

~~~ts
import { usePermission } from '@lsw-abpvue/core';
import { IdentityPolicyNames } from '@lsw-abpvue/identity/config';

const permission = usePermission();
const canCreateNow = permission.isGranted(IdentityPolicyNames.UsersCreate);
const canCreate = permission.isGrantedRef(IdentityPolicyNames.UsersCreate);
~~~

`isGranted` 返回调用时的布尔值。`isGrantedRef` 返回 computed ref，策略或响应式输入变化后重新计算。需要随会话刷新更新的按钮等界面使用响应式检查。

## 显示获准的操作

<<< ../../examples/PermissionButton.vue

`AbpPermission` 仅在策略授予时渲染内容。可复用组件中显式导入，生成应用的预设也支持自动导入。点击操作与忙碌状态仍由页面负责。

[测试此组件](/zh/development/testing#测试响应式权限)时，可以先不授予策略，再修改配置授予它。

## 策略表达式

使用后端实际定义且区分大小写的名称：

~~~text
AbpIdentity.Users.Create || AbpIdentity.Users.Update
(AbpIdentity.Users.Create || AbpIdentity.Users.Update) && AbpIdentity.Users
~~~

`&&` 优先于 `||`，括号控制组合顺序。策略缺省或为空表示没有额外限制；未知策略或无效表达式返回未获准。无效表达式在开发环境中会给出诊断提示。

## 路由与菜单

为受保护路由添加 `meta.requiredPolicy`：

~~~ts
const route = {
  path: '/identity/users',
  component: () => import('../pages/UsersPage.vue'),
  meta: { requiredPolicy: IdentityPolicyNames.Users },
};
~~~

已注册的路由守卫检查该要求，导航筛选使用对应策略。没有可见子项的分组会隐藏。通过 `provideAbpRouter` 注册路由与守卫，仅写 metadata 不会初始化框架。

普通业务列表的 `RowAction` 回调需要在传给 `AbpGridActions` 前过滤策略。可复用模块贡献者可以声明操作的 permission，见[实体操作](/zh/customization/entity-actions)。

## 名称与权限变化

内置模块通过 config 入口提供策略常量，自己的代理根据后端生成名称。可选的 `AbpKnownPolicyName` 扩展可以收窄策略字符串，不扩展时仍接受普通字符串。

角色或用户授权在服务端改变。需要时通过 `ConfigStateService.refreshAppState()` 更新当前会话的有效权限，隐藏按钮本身不会撤销授权。界面显示操作但请求返回 403 时，检查当前租户、用户、策略与会话配置。

[权限管理模态框](/zh/modules/permission-management)管理提供者授权。`R`、`U`、`C` 分别标识角色、用户和客户端提供者，具体支持由后端决定。
