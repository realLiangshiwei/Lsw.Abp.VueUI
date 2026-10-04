# 接入已有解决方案

`switch-ui` 为已有 ABP 方案添加 Vue，支持标准 `aspnet-core/` + `angular/` 布局和已有平铺后端。

```bash
npx @lsw-abpvue/cli@alpha switch-ui --dry-run
npx @lsw-abpvue/cli@alpha switch-ui --mode keep
```

## 目录与预览

```text
Acme.BookStore/
├── aspnet-core/
├── angular/
└── vue/
```

`--mode keep` 保留 Angular，默认 replace 将旧 UI 重命名为备份。可从项目根、后端或前端子目录执行，`--solution` 接受项目根或后端目录。`--dir` 相对项目根，必须与后端分开。

默认要求干净工作区，`--force` 允许未提交修改。预览显示文本差异、重命名和二进制文件。应用修改前备份，JSON 编辑保留注释和格式，不修改 C#，失败时回滚。

## 后端与启动

命令同步 OpenIddict `RootUrl`、`CorsOrigins`、`RedirectAllowedUrls`。重新运行 DbMigrator，将客户端回调写入数据库。启动后端与认证服务器，然后在 `vue/` 执行：

```bash
pnpm install
pnpm abpv doctor
pnpm dev
```

点击 Login，默认跳转认证服务器再返回 Vue。保留两个 UI 时应使用不同端口并允许两个来源。新增业务页面见[业务页面](./crud-page)，完整参数见 [switch-ui](/zh/cli/switch-ui)。
