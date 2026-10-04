# abpv switch-ui

```bash
abpv switch-ui                  # renames angular/ to angular.bak/ and adds vue/
abpv switch-ui --mode keep      # leaves the old UI where it is
abpv switch-ui --port 5173
abpv switch-ui --dry-run
```

| 选项 | 用途 |
| --- | --- |
| `--mode <replace\|keep>` | 是否将旧 UI 重命名 |
| `--solution <path>` | 项目根或 aspnet-core/，默认向上发现 |
| `--dir <path>` | 相对项目根的前端子目录，默认 vue |
| `--port <n>` | 前端端口，同步关联配置 |
| `--modules <list>` | 接入的模块 UI |
| `--force` | 允许未提交工作区继续 |
| `--dry-run` | 预览全部修改，包括后端配置 |

预览输出生成文本与后端配置的完整统一差异，保留注释和上下文。重命名、二进制文件单列。已有备份会保留，新备份使用下一个可用的 .1.bak、.2.bak 等名称。预览不写文件、不安装依赖。

标准 aspnet-core/ + angular/ 布局中，vue/ 放在两者旁。从项目根、后端、已有前端或其子目录运行均可，--solution 接受项目根或后端目录。预览路径相对项目根。已有平铺方案保持原后端位置。

--dir 必须在项目内，不能覆盖后端目录。

## 七项处理规则

1. 未提交工作区停止，除非指定 --force；差异用于回退。
2. 编辑前复制每个文件。
3. 通过 AST 编辑 JSON，保留注释与格式。
4. 不修改 .cs 文件。
5. 重命名旧目录，不删除。
6. 无法完成时恢复。
7. 已正确的值保持不变。

## 后续步骤

重新运行 DbMigrator。OpenIddict 客户端通过种子更新，新的重定向 URI 需据此写入数据库。

## 其他生成选项

--template &lt;dir&gt;、--package-manager &lt;name&gt;（默认 pnpm）、--with-source-code &lt;list&gt;、--skip-install、--skip-proxy 控制前端生成。--skip-backend-config 留给你自行同步后端配置。默认端口 4200。
