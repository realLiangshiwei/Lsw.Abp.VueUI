# abpv new

```bash
abpv new Acme.BookStore
abpv new Acme.BookStore -d mongodb --separate-auth-server
abpv new Acme.BookStore --sample-crud
abpv new Acme.BookStore --no-backend --backend https://localhost:44305
```

后端由官方 abp CLI 使用 `-u no-ui -uost`、`-o Acme.BookStore/aspnet-core` 生成。前端位于 `Acme.BookStore/vue`，保持标准前后端目录结构。

`-o`／`--output-folder` 指定整个项目目录，后端进入 aspnet-core/ 子目录；支持分开的值与 `--output-folder=<path>`。`-csf`／`--create-solution-folder` 由此命令处理，避免额外嵌套，其余 ABP 选项原样传递。

## 自有选项

| 选项 | 用途 |
| --- | --- |
| `--port <n>` | 前端端口，同步所有关联配置 |
| `--dir <path>` | 相对项目根的前端子目录，默认 vue |
| `-o / --output-folder <path>` | 整个项目输出目录，默认方案名 |
| `--modules <list>` | 接入哪些模块 UI，默认全部 |
| `--sample-crud` | ABP Books 后端与页面示例 |
| `--with-source-code <list>` | 创建时释放选定包的源码 |
| `--no-backend` | 只生成前端 |
| `--backend <url>` | --no-backend 时指定后端地址 |
| `--template <dir>` | 使用自定义模板目录 |
| `--dry-run` | 预览，不写入 |

前端目录必须位于项目内，并与 aspnet-core/ 分开。不覆盖已有前后端。--no-backend 把前端直接写入项目输出目录。

## 后端配置修改

登录需要三项配置：

| 配置 | 用途 |
| --- | --- |
| OpenIddict 客户端 RootUrl | 种子据此构造重定向 URI |
| CorsOrigins | 所有响应前端的宿主允许源 |
| RedirectAllowedUrls | 身份服务器允许返回的地址 |

使用 -u no-ui 生成的方案不包含这些前端配置。

## 后端生成

命令先检查磁盘中实际生成的方案，再添加前端。后端库安装、数据库种子与启动见[快速开始](/zh/guide/new-solution)。

## 其他生成选项

--package-manager &lt;pnpm|npm|yarn&gt; 选择安装器，默认 pnpm。--skip-install 跳过安装，--skip-proxy 跳过代理生成。默认前端端口 4200，--backend 可以覆盖检测出的后端地址。

## 选择方案形态

| 目标 | 命令选择 |
| --- | --- |
| 新后端与 Vue 应用 | new 默认生成后端 |
| 可选 Books 教学示例 | 增加 --sample-crud |
| 连接运行中后端的纯前端 | --no-backend --backend URL |
| 在已有后端／UI 旁增加 Vue | switch-ui，不再创建第二个后端 |

标准方案中 aspnet-core/ 与 vue/ 并列。sample-crud 可选，不指定时模板不添加 Books 业务页面。初次选择地址使用 --port，使种子回调与生成配置一致。

## 生成前后

调用前安装所需 .NET SDK、官方 ABP CLI 与前端包管理器。new 将后端模板选项委托官方 CLI，数据库、提供者和模板选择必须受该工具支持。

生成后安装后端 Web 库，从 DbMigrator 项目目录运行种子，启动宿主／授权服务器和前端。[创建方案](/zh/guide/new-solution)给出目录与命令。前端已生成不代表数据库已初始化。

失败时先确认阶段：官方后端创建、方案发现／配置、前端渲染、依赖安装或代理获取。已有输出受保护，检查后有意选择新位置或修复失败阶段，不要反复写入部分生成的目录。
