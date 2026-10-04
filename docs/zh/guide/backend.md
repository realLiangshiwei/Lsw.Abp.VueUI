# API 代理

生成服务为业务 API 提供类型化方法与 DTO，使用 `RestService`，共享框架的认证、租户与语言处理。

## 应用业务服务

后端运行时从 `vue/` 执行：

```bash
pnpm abpv proxy add --module app
pnpm abpv proxy refresh
```

生成器读取 `/api/abp/api-definition`，应用配置补充对象扩展和权限元数据。本地开发证书不受信任时可使用 `--insecure`。离线输入使用 `--source`、`--config-source`。

默认输出到 `src/proxy`，包含服务、DTO、受支持的验证器、权限常量和 `generate-proxy.json`。按自己的后端实际生成名称与路径导入，将输出入库以审阅 API 变化。

## 内置模块代理

内置服务已经包含在对应包的 `/proxy` 入口中：

```ts
import { inject } from '@lsw-abpvue/core';
import { IdentityUserService } from '@lsw-abpvue/identity/proxy';

const users = inject(IdentityUserService);
const page = await users.getList({ maxResultCount: 10, skipCount: 0 });
```

片段在 setup 或提供者工厂中运行，异步回调前先获取服务。只有明确需要单独维护内置代理时，才在应用中生成一份。

## 验证器与权限

验证器映射反映受支持的 DTO 注解，不包含所有业务规则；必要时组合继承 DTO 的映射。权限常量使用后端名称，认证后的应用配置可以补齐 API 元数据缺失的权限，前端检查不能替代后端授权。

生成服务方法返回 Promise，并接受请求配置，应传入取消信号终止过期工作。手写请求与错误选项见 [HTTP](/zh/core/http)。`abpv doctor` 比较生成文件与当前后端定义，`proxy refresh` 重新生成。
