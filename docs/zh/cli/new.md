# abpv new

```bash
abpv new Acme.BookStore -d mongodb
abpv new Acme.BookStore --sample-crud
abpv new Acme.BookStore --no-backend --backend https://localhost:44305
```

默认由 ABP 官方 CLI 使用 `-u no-ui -uost` 创建 `aspnet-core/` 后端，再生成同级 `vue/` 前端。默认模板不包含 Book 业务页面，`--sample-crud` 才添加示例。

## 选项

| 选项 | 含义 |
| --- | --- |
| `-o / --output-folder <path>` | 整个解决方案输出目录，默认方案名 |
| `--dir <path>` | 前端子目录，默认 `vue` |
| `--port <n>` | 前端端口，默认 4200 |
| `--backend <url>` | 覆盖检测出的后端地址 |
| `--modules <list>` | 选择接入的模块 UI，逗号分隔 |
| `--sample-crud` | 添加后端及前端 CRUD 示例 |
| `--no-backend` | 仅创建前端，直接写入输出目录 |
| `--package-manager <name>` | pnpm、npm 或 yarn，默认 pnpm |
| `--skip-install` / `--skip-proxy` | 跳过安装或代理生成 |
| `--with-source-code <list>` | 同时释放指定包源码 |
| `--template <dir>` | 自定义模板目录 |
| `--dry-run` | 预览，不写入、不创建后端 |

`--output-folder=<path>` 也受支持。`-csf` 被消费以避免再次嵌套方案目录，其他 ABP 选项按原样透传。前端目录必须在项目内并与后端分开，已有目录不会被覆盖。

## 后端配置

命令更新 OpenIddict 客户端 `RootUrl`、服务端 `CorsOrigins`、`RedirectAllowedUrls`。生成完成后仍需安装后端前端库、运行 DbMigrator 并启动主机，见[快速开始](/zh/guide/new-solution)。命令会检查实际磁盘结果，避免将官方 CLI 的成功退出码直接当作方案完整生成的证明。
