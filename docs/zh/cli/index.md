# abpv CLI

全局安装 CLI，或直接运行：

```bash
npm install -g @lsw-abpvue/cli
npx @lsw-abpvue/cli --help
```

`abpv` 与 `abpvue` 调用同一个命令。CLI 要求 Node 20 或以上，创建后端还需要目标 .NET SDK 和 ABP 官方 CLI。已有方案操作会读取后端配置，在线生成需要运行中的后端，也可使用保存的元数据。

| 命令 | 用途 |
| --- | --- |
| [new](./new) | 创建 ABP 后端和 Vue 前端 |
| [switch-ui](./switch-ui) | 为已有解决方案添加 Vue |
| [proxy](./proxy) | 生成类型化服务、DTO、验证器和权限名 |
| [generate](./generate) | 生成普通业务 CRUD 页面 |
| [add-package](./add-package) | 安装包或释放源码到本地 |
| [eject](./eject) | 释放包源码的别名 |
| [create-lib](./create-lib) | 创建可复用模块 UI 骨架 |
| [doctor](./doctor) | 诊断环境与后端配置 |
| [update](./update) | 更新 ABP Vue 包版本 |

## 项目内命令

生成前端包含 CLI 依赖，从 `vue/` 运行 `pnpm abpv <command>` 使用项目自身版本。修改命令支持 `--dry-run`，`doctor` 只读取和报告。`<command> --help` 显示当前版本的选项。

元数据、预览、备份和覆盖规则见[配置与生成文件](./configuration)。
