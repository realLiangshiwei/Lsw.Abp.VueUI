# abpv create-lib

```bash
abpv create-lib Blogging --package @acme/blogging-vue --target packages/blogging
```

## 选项

| 选项 | 含义 |
| --- | --- |
| `<name>` | 模块名 |
| `--package <name>` | npm 名称，默认 `abp-vue-<name>` |
| `--target <dir>` | 输出目录，默认 `./<name>` |
| `--description <text>` | 包描述 |
| `--template <dir>` | 自定义模板 |
| `--dry-run` | 只预览 |

## 生成结构

```text
blogging/
├── src/
├── config/src/
├── proxy/src/
├── vite.config.ts
├── vitest.config.ts
├── tsconfig*.json
└── scripts/
```

主入口包含页面与扩展点，config 提供轻量菜单配置，proxy 提供业务服务。示例页面使用 RestService，因此代理生成前也能编译。骨架包含五类扩展点，适用于多个宿主使用的模块。

生成后安装依赖、类型检查和构建，再对运行中的模块后端生成 `proxy/src`。组件 key 属于公共 API，应在发布前确定。见[可复用模块教程](/zh/tutorials/module)。
