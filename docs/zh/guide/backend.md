# API 代理

生成的服务为业务 API 提供类型化方法和 DTO。它们使用 `RestService`，共享框架认证、租户与语言处理。

## 应用服务

在 `vue/` 中对已启动后端运行：

```bash
pnpm abpv proxy add --module app
pnpm abpv proxy refresh
```

生成器读取 `/api/abp/api-definition`，应用配置提供额外的对象扩展与策略元数据。开发时可用 `--insecure` 接受不受信任的本地证书。`--source`、`--config-source` 支持离线输入。

默认输出到 `src/proxy`，包含服务、DTO、受支持的验证器、策略常量与 `generate-proxy.json`。导入实际生成的名称与路径，将产物提交以便审阅 API 变化。

## 内置模块代理

内置模块服务已由包的 `/proxy` 入口提供：

```ts
import { inject } from '@lsw-abpvue/core';
import { IdentityUserService } from '@lsw-abpvue/identity/proxy';

const users = inject(IdentityUserService);
const page = await users.getList({ maxResultCount: 10, skipCount: 0 });
```

片段在 setup 或提供者工厂中运行，异步回调前先获取服务。只有明确要单独维护时才生成内置代理的本地副本。

## 验证器与策略

验证器映射反映受支持的 DTO 注解，不包含所有业务规则。需要时组合继承 DTO 的映射。策略常量使用后端名称，认证配置可以补齐 API 元数据缺少的策略名。前端检查不代替服务端授权。

生成服务返回 Promise，接受请求配置。为过时操作传取消信号。手写请求与错误选项见 [HTTP](/zh/core/http)。`abpv doctor` 对照当前后端定义检查文件，`proxy refresh` 重新生成。

## API 修改后重新生成

1. 先修改、启动后端，确认 api-definition 中模块、控制器、动词、路由参数与 DTO 属性正确。
2. 在 vue/ 使用记录的配置运行 `pnpm abpv proxy refresh`；首次注册新模块用 `proxy add --module app`。
3. 审阅生成差异，编译错误标识变化的消费者，不要修改生成方法来伪装旧契约。
4. 调整页面与验证器，执行类型检查并调用真实端点。
5. 将审阅后的代理元数据和产物与兼容后端的应用修改一起提交。

代理产物是业务页面可重现的输入。自定义服务辅助函数放在产物外。方法类型描述传输结构，不执行运行时业务验证。

## 找到正确导入

查看命名空间目录与桶导出，不要猜服务名。移除根命名空间会改变路径，名称冲突可能导致 DTO 重命名。generate 命令重放代理选项来解析名称；自行移动代理文件可能破坏关系。

通过生成方法最后一个可选 RestConfig 传 signal 或具名 API 覆盖。setup 中获取服务，点击处理器保留引用。服务工厂本身不应因注入而发请求。

## 离线与受保护定义

保存授权后的 api-definition 响应，条件允许时保存同一会话的 application-configuration。按[proxy](/zh/cli/proxy)使用 --source、--config-source。缺少认证策略元数据时，一些权限名称无法补齐，doctor 会报告限制，不会把空集合当作匹配。

不要在代理元数据或命令例子中提交访问令牌。生成代码引用框架服务，不引用凭据。模块位于其他宿主时，apiName 必须匹配[配置](/zh/guide/configuration)中的具名 apis。

## 查看生成目录

BookStore API 使用 `BookStore.Books` 命名空间时，移除 `BookStore` 根命名空间会产生：

```bash
pnpm abpv proxy add --module app --root-namespace BookStore --target src/proxy
```

```text
src/proxy/
├── books/
│   ├── book.service.ts
│   ├── models.ts
│   ├── book-type.enum.ts
│   ├── validators.ts
│   └── index.ts
├── policy-names.ts
├── index.ts
└── generate-proxy.json
```

使用你实际的根命名空间（例如 Acme.BookStore）、模块与输出目录。不同后端生成不同目录与 DTO 成员。根设置缩短目录，不改变端点 URL。服务仍使用模块 apiName，独立宿主需要配置具名 API。

## 使用枚举与验证器映射

以下完整消费者使用 create DTO 含 name、type、publishDate、price 的 Book API，生成文件取自仓库运行的 BookStore 测试后端。可选 Authors／Books 方案还需要 authorId，应保留自己 DTO 声明的所有字段。

登录用户应拥有应用服务需要的 Books 查询／新增权限；仓库后端使用 `BookStore.Books`、`BookStore.Books.Create`。

创建 `src/pages/BookForm.vue`，生成该命名空间后，将 `./generated/books` 导入改为 `../proxy/books`：

<<< ../../examples/ProxyBookForm.vue

向 API 发送枚举数值，标签来自 bookTypeOptions 与本地化枚举 key。映射由元数据生成，不是手动复制。为资源添加枚举文本，否则显示回退枚举名。

添加应用规则前展开各生成验证器数组。示例保留后端必填／范围规则，增加更严格的价格上限 500。重新生成更新共享映射，不覆盖页面自定义规则。继承 DTO 须显式组合声明类型的映射。

日期控件返回日期字符串，此后端以 DateTime 接受出版日期，表示日历日期，不是任意用户时区的瞬间。价格与枚举保持数字，构造类型化 DTO 前收窄可为空的必填控件。[日期语义](/zh/utilities/dates)解释预约或事件时间的其他建模方式。

使用 setup 中取得的服务调用生成方法，将请求配置放在最后一个参数。不要 await 后注入。失败保留表单，将服务端验证分配到控件；真实请求还会检查注解之外的规则。

## 刷新时保留应用代码

修改 DTO 或枚举后运行 proxy refresh，审阅差异。命名空间／方法未变时页面继续导入相同公开索引；类型错误标识需要修改的消费者。不要修改生成 DTO 来掩盖 API 不匹配。例如移除枚举成员还需更新存储值和 UI 选项。

业务辅助函数、字段标签、自定义验证器与页面放在 src/proxy 外。将生成记录与产物一起审阅提交。dry run 或 doctor 可发现漂移，但不能证明 API 正确保存数据。
