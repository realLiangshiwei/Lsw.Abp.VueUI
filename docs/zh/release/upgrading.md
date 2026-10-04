# 升级

CLI 与全部 `@lsw-abpvue/*` 运行时包保持同一发布版本。先阅读目标版本记录，再预览清单变化。

```bash
pnpm abpv update --tag alpha --dry-run
pnpm abpv update --tag alpha
pnpm install
```

精确版本使用 `--to <version>`。命令默认标签为 `latest`，目前指向较旧的初始 alpha，应显式传入 `--tag alpha`。

## 修改范围

CLI 更新普通 semver 范围，并保留原来的修饰符。标签、`file:` 依赖和 Git URL 保持用户选择。已注册迁移按版本顺序执行，当前版本还没有迁移步骤。

已释放本地源码会显示更新的变更说明，但不会覆盖文件或更新其源码版本标记，需要自行审阅并合入修复。[源码维护](/zh/guide/source-code)说明了这条边界。

## 安装后

运行类型检查、构建和相关业务测试。认证变化时检查登录、退出和 My account。后端 API 变化时刷新业务代理，先审阅差异再决定重新生成页面。

生成业务页面归应用维护，升级框架包不会静默替换页面，`generate --force` 才是显式整页覆盖。
