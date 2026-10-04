# 多租户

`MultiTenancyService` 解析租户，`useMultiTenancy()` 提供读取入口。框架请求默认通过 `__tenant` 头发送租户 ID。

## 解析优先级

1. `application.baseUrl` 中的 `{0}` 占位符，从浏览器地址解析。
2. 未识别域名租户时，使用 `__tenant` 查询参数。
3. URL 未指定租户时，保留会话中保存的租户。

域名租户会在请求前替换 API 和认证地址中的对应占位符。域名固定了当前会话的租户，因此隐藏租户选择器。域名租户无法解析时抛出 `TenantNotFoundError`，不会继续按宿主模式运行。

## 读取与选择租户

```ts
import { useMultiTenancy } from '@lsw-abpvue/core';

const tenancy = useMultiTenancy();
const currentTenant = tenancy.currentTenant;
const domainTenant = tenancy.domainTenant;
const tenant = await tenancy.setTenantByName('acme');
```

查找返回解析出的租户或 `null`，按 ID 查找使用 `setTenantById`。这两个方法修改租户选择，不会自动登录该租户。认证包会使其他租户签发的令牌失效；随后按需刷新配置、重新认证，也可使用已经协调这些步骤的账户租户选择器。

## 后端配置

后端需要启用 ABP 多租户并提供租户解析端点。租户切换与租户管理是两个功能：选择器设置会话租户，管理模块负责创建租户及编辑配置。

## 登录前选择宿主或租户

交互登录流程优先使用 account 租户框，它协调查找、Token 失效、配置刷新和认证导航。自定义选择器也需要协调这些步骤，setTenantByName 只更新选择，不更新当前用户权限。

选择宿主应清除会话租户，刷新匿名配置，再按需要在宿主上下文认证。查询参数租户使用 id 查找，不是名称查找。domainTenant 已确定时隐藏选择器，不提供冲突的切换。

## 域名配置

前端 baseUrl 为 https://{0}.example.com 时，可从 https://acme.example.com 解析 acme。URL 租户解析会替换对应 API、issuer、redirect 占位符。DNS、HTTPS 证书必须实际覆盖主机，字符串替换不会创建它们。回调注册与后端租户解析也应一致。

当前实现替换特定环境字段，不能假定任意自定义地址或退出地址全部重写。检查有效环境，并明确配置其他租户相关地址。

## 选择与管理不同

租户管理页创建租户记录，选择框决定当前会话使用哪个租户。创建不会自动初始化全部业务模块数据。租户设置、功能、权限可能与宿主不同，切换后通过新配置确认 currentTenant、grantedPolicies 和有效设置。

## 租户请求排查

检查失败请求 __tenant、会话 id、Token 租户声明和后端解析顺序。不能给租户 A 的 Token 加上租户 B 的请求头就复用。未知域名租户会停止启动，不能静默进入宿主上下文。参见[认证](/zh/guide/authentication)和[应用状态](/zh/concepts/state)。
