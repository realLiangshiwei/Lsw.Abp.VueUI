# abpv proxy

```bash
abpv proxy add --module app
abpv proxy refresh
abpv proxy remove --module app
```

为应用业务 API 生成类型化服务、DTO、验证器和权限名。内置模块通常从对应包的 `/proxy` 入口导入，无需在应用中重复生成。

## 选项

| 选项 | 含义 |
| --- | --- |
| `--module <list>` | 模块名，逗号分隔或 `all` |
| `--target <dir>` | 默认 `src/proxy` |
| `--url <url>` | 后端地址，默认读取运行时配置或环境变量 |
| `--source <file>` | 离线 API 定义 |
| `--config-source <file>` | 离线应用配置，与 source 配合 |
| `--token <token>` | 认证请求，也用于补充权限名 |
| `--insecure` | 接受本地开发证书，默认 false |
| `--service-type <type>` | application、integration、all，默认 application |
| `--root-namespace <ns>` | 去掉生成目录的根命名空间 |
| `--api-name <name>` | 覆盖远程服务名称 |
| `--no-index` | 不生成 barrel 文件 |
| `--no-validators` / `--no-policy-names` | 不生成验证器或权限名 |
| `--dry-run` | 只预览 |

## 生成记录

`generate-proxy.json` 保存模块与生成选项，refresh 按记录重建，remove 移除指定模块并重新生成其余模块。输出目录属于生成代码，业务逻辑应放在外部。将业务代理和记录一起入库，审阅后端 API 变化。

服务方法返回 Promise，取消通过 `AbortSignal`。验证器来自支持的数据注解，不能替代后端业务验证。见 [API 代理](/zh/guide/backend)。
