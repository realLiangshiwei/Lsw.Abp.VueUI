# CLI 配置与生成文件

项目命令从前端目录执行。需要解决方案信息的命令还会识别标准 `aspnet-core/` + `vue/` 结构，以及已有的平铺后端结构。

| 文件 | 用途 |
| --- | --- |
| `public/dynamic-env.json` | 后端、认证服务器与前端地址 |
| `package.json` | 包版本、包管理器和 `abpVue.autoImports` |
| `src/proxy/generate-proxy.json` | 代理模块选择与生成选项 |
| `.abpvue/source-code.json` | 释放到本地的源码包及版本 |
| `src/routes.ts` | `generate` 插入业务路由 |

业务代理和生成元数据应入库，让 API 变化可审阅。自动导入声明文件可以由 Vite 重建。运行时配置不应包含认证秘密。

## 预览与覆盖

修改命令支持 `--dry-run`，`doctor` 只做诊断。转换已有方案前先预览。`switch-ui` 展示文本差异、重命名和二进制变化，并保留已有备份名称；该命令的 `--force` 允许工作区有未提交修改。

`generate --force` 的含义不同，会替换整个生成页面。代理刷新重建已记录的生成文件，业务定制应放在代理输出之外。

## 可复现性

使用项目安装的 CLI，新建项目时指定包版本或发布标签。离线生成代理使用 `--source` 和可选的 `--config-source`。各命令的 `--help` 展示当前选项，`new` 透传的后端选项由 ABP 官方 CLI 定义。
