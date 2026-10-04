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
