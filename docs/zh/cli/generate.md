# abpv generate

```bash
abpv generate Book
abpv generate Book --policy Acme.BookStore.Books --icon "bi bi-book"
abpv generate Book --force
```

生成 `src/pages/BooksPage.vue` 和一条路由。页面直接拥有列、表单控件和 CRUD 方法，导入生成服务与 DTO，因此需要先生成代理。

| 选项 | 用途 |
| --- | --- |
| `--module <name>` | 选择 api-definition 模块，默认搜索全部 |
| `--target <dir>` | 页面输出目录，默认 `src/pages` |
| `--proxy <dir>` | 代理目录，默认 `src/proxy` |
| `--routes <file>` | 路由声明文件，默认 `src/routes.ts` |
| `--no-router` | 不修改路由文件 |
| `--resource <name>` | 本地化资源，默认使用后端默认资源 |
| `--extension-module <m>` | 旧版兼容选项，直接业务页面不注册扩展 |
| `--route` / `--menu` / `--icon` | 覆盖推断值 |
| `--policy <name>` | 基础权限；保留匹配的后端操作策略（如 `.Edit`），缺失或无关策略使用 `.Create`、`.Update`、`.Delete` |
| `--force` | 替换整个已有 Vue 页面，先保存自定义修改 |
| `--url` / `--source` / `--config-source` / `--token` / `--insecure` | 与 proxy 相同 |
| `--no-auto-imports` | 显式导入常用 API，不使用应用预设 |
| `--dry-run` | 预览，不写入 |

完整流程见 [CRUD 页面](../guide/crud-page)。

## 推断方式

根据 HTTP 结构推断：无路由参数且返回 `PagedResultDto<T>` 的 GET 是列表，T 是记录类型，POST 请求体是表单。重命名 GetListAsync 不影响识别。

控件使用完整后端类型，不只使用简化 JSON 类型，日期因此能使用日期控件。

服务与 DTO 名称通过记录的 `generate-proxy.json` 选项在内存中重放生成来解析。两个模块各有 BookDto 时可能有重命名，页面必须导入实际产物名称。

`--module` 支持短选项 `-m`。`--auto-imports` 显式启用预设，默认行为取自 package.json。

## 可重复的业务页面流程

1. 启动后端，先生成应用代理。
2. 在 vue/ 运行 `abpv generate Book --dry-run`，检查选定服务、DTO、字段、路由。
3. 生成页面，调整元数据无法推断的业务标签、关联显示与规则。
4. 执行类型检查，对实际后端走列表、新增、编辑、删除。
5. 后续将业务页面作为普通 Vue 代码维护。

页面直接拥有控件、列、模态框、提交处理器，不为每个实体注册扩展容器。可复用包可以有意公开扩展点，见[模块流程](/zh/tutorials/module)。

## 重新生成与代码归属

--force 替换整个页面，包含自定义修改。先保存或提交，再生成并审阅差异。不替换 UI 时刷新代理后手动调整页面。自行维护路由时使用 --no-router。

AuthorId 是传输字段，显示作者名称需要 API 暴露相应关联。检查日期、枚举、权限、并发与额外属性更新，不能假定推断字段覆盖全部规则。

无法识别分页列表／新增接口组合时检查 HTTP 元数据，生成器不能创建缺失端点。--module 区分同名实体，记录的代理选项保证导入路径一致。
