# abpv proxy

```bash
abpv proxy add --module app     # one module, several, or "all"
abpv proxy refresh                   # generate again what is recorded
abpv proxy remove --module app  # take one out, generate the rest again
```

| 选项 | 用途 |
| --- | --- |
| `--module <name>` | 逗号分隔列表或 all |
| `--target <dir>` | 默认 src/proxy |
| `--url <backend>` | 默认 public/dynamic-env.json，再回退 VITE_API_URL |
| `--source <file>` | 离线 api-definition.json |
| `--config-source <file>` | 配合 --source 的 application-configuration.json |
| `--token <token>` | 受保护后端与权限名称 |
| `--insecure` | 接受本地 ABP 开发证书 |
| `--service-type <t>` | application（默认）、integration、all |
| `--root-namespace <ns>` | 从生成目录前移除的根命名空间 |
| `--api-name <name>` | 覆盖模块远程服务名 |
| `--no-index` | 不生成桶文件 |
| `--no-validators` / `--no-policy-names` | 省略相应内容 |
| `--dry-run` | 预览，不写入 |

生成内容与选项记在 generate-proxy.json，refresh 据此重放。删除记录后，下次刷新须重新指定模块。

## 生成内容

DTO 接口、各控制器服务、各命名空间验证器映射、权限名称常量和各目录桶文件。见[API 代理](../guide/backend)。

## 内置模块

从包 /proxy 入口导入内置服务。应用代理用于业务 API；只有明确单独维护时才生成内置模块副本。方法返回 Promise，通过 AbortSignal 取消。

## 在线生成流程

从前端目录确认 public/dynamic-env.json 指向运行中后端。仅自签开发证书需要时运行 `abpv proxy add --module app --insecure`。检查 src/proxy/generate-proxy.json、服务和 DTO，后续使用 proxy refresh。

--insecure 只影响 CLI 获取，不改变浏览器证书信任或生产 TLS。--module 是 api-definition 模块 id，不一定等于项目名。

## 无运行中后端时重现

保存同一版本／会话的两份有效 JSON：api-definition.json 和 application-configuration.json，然后运行：

```bash
abpv proxy add --module app --source ./api-definition.json --config-source ./application-configuration.json
abpv proxy refresh --source ./api-definition.json --config-source ./application-configuration.json --dry-run
```

写入前审阅预览。保存的配置可能包含用户／会话信息，只将合适的夹具入库，不要随元数据保存访问令牌。

## 常见失败

| 失败 | 下一项检查 |
| --- | --- |
| 连接／证书错误 | 后端 URL、宿主、证书；insecure 仅用于本地开发 |
| 找不到模块 | 实际 api-definition modules 的 key |
| 缺少业务服务 | API 暴露、service-type 筛选、所选模块 |
| 刷新后导入变化 | root-namespace、名称冲突、桶导出 |
| 缺少策略 | 是否提供认证后的应用配置 |

不要手改产物来弥补错误输入。修复元数据／选项，再生成。消费者检查见 [doctor](/zh/cli/doctor)与[代理指南](/zh/guide/backend)。
