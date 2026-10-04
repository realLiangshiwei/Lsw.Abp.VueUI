# abpv create-lib

```bash
abpv create-lib Blogging
abpv create-lib Blogging --package @acme/blogging-vue --target packages/blogging
```

| 选项 | 用途 |
| --- | --- |
| `--package <name>` | npm 包名，默认 `abp-vue-<name>` |
| `--target <dir>` | 输出目录，默认 `./<name>` |
| `--description <text>` | 包说明 |
| `--template <dir>` | 使用此模板目录 |
| `--dry-run` | 预览文件，不写入 |

## 生成内容

```
blogging/
├── src/                        the pages, the extension points, the routes
├── config/src/                 the menu entries and the permission names
├── proxy/src/                  where `abpv proxy add --target proxy/src` writes
├── vite.config.ts              self-contained: this is a repository of its own
├── vitest.config.ts
├── tsconfig*.json              four of them: type check, and one per entry point
└── scripts/                    the .vue declaration rewriter it needs at build time
```

五类扩展点已接入，宿主可以增加列而不修改包。示例页面使用 `RestService` 请求后端，因此生成代理前也能编译。

## 后续步骤

```bash
cd blogging && pnpm install && pnpm build
abpv proxy add --module blogging --target proxy/src
```

调整需要改名的内容。组件 key 是宿主替换页面使用的公开 API，应先确定并保持稳定。
