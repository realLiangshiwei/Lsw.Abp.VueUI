# abpv generate

```bash
abpv generate Book
abpv generate Book --policy Acme.BookStore.Books --icon "bi bi-book"
abpv generate Book --dry-run
```

生成 `src/pages/BooksPage.vue` 和业务路由。页面拥有自己的列、表单与 CRUD 方法，不注册扩展。运行前先生成业务代理。

## 选项

| 选项 | 含义 |
| --- | --- |
| `--module / -m <name>` | 指定 API 模块 |
| `--target <dir>` | 页面目录，默认 `src/pages` |
| `--proxy <dir>` | 代理目录，默认 `src/proxy` |
| `--routes <file>` | 路由文件，默认 `src/routes.ts` |
| `--no-router` | 不插入路由 |
| `--resource <name>` | 本地化资源，默认后端默认资源 |
| `--route / --menu / --icon` | 覆盖推断值 |
| `--policy <name>` | 基础策略，保留匹配的后端操作策略 |
| `--force` | 替换整个已有页面 |
| `--auto-imports / --no-auto-imports` | 常用 API 导入方式，默认读取 package.json |
| `--url / --source / --config-source / --token / --insecure` | 后端或离线元数据选项 |
| `--extension-module <name>` | 旧版兼容选项，普通业务页不注册扩展 |
| `--dry-run` | 只预览 |

## 识别与覆盖

按 HTTP 形状识别列表、详情、新增和更新，不依赖方法是否叫 GetListAsync。根据真实 DTO、继承属性、数据注解、权限和代理命名生成代码。不支持的嵌套对象与集合会提示，需自行实现。

默认保留已有页面，`--force` 会整页覆盖，使用前保存定制。既有路由保留，旧 `.extensions.ts` 文件不自动删除。完整流程见[业务页面教程](/zh/tutorials/crud)。
