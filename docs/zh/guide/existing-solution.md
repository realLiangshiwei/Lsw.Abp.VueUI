# 接入已有解决方案

abpv switch-ui 为已有或尚无 UI 的 ABP 解决方案增加 Vue。

```bash
npx @lsw-abpvue/cli@alpha switch-ui                  # renames angular/ to angular.bak/ and adds vue/
npx @lsw-abpvue/cli@alpha switch-ui --mode keep      # leaves the old UI where it is
npx @lsw-abpvue/cli@alpha switch-ui --port 5173
npx @lsw-abpvue/cli@alpha switch-ui --dry-run        # says what it would do to your files
```

## 项目结构与修改保护

标准结构分开前后端：

```text
Acme.BookStore/
├── aspnet-core/
├── angular/          # kept with --mode keep; otherwise renamed to angular.bak/
└── vue/
```

从项目根、aspnet-core/、已有前端或子目录运行均可。--solution 接受项目根或后端目录。--dir 相对项目根，与后端分开。已有平铺方案不移动后端。doctor 从 vue/ 也能找到相邻后端。

修改已有文件时：

| 行为 | 说明 |
| --- | --- |
| 未提交工作区停止 | --force 可继续，差异用于回退 |
| 修改前复制文件 | 回退使用备份 |
| 通过 AST 编辑 JSON | 保留注释、键顺序与格式 |
| 不修改 .cs | 保留后端源码 |
| 重命名旧目录 | angular/ 变为 angular.bak/ |
| 无法完成时恢复 | 避免部分修改 |
| dry-run 展示全部修改 | 包括后端配置 |

## 后端修改

与 abpv new 同样需要三项登录配置：

| 配置 | 用途 |
| --- | --- |
| OpenIddict 客户端 RootUrl | 种子据此构造重定向 URI |
| CorsOrigins | 响应前端的宿主允许源 |
| RedirectAllowedUrls | 身份服务器允许返回的地址 |

正确值保持不变，包括官方模板末尾逗号留下的无语义空项，不为此产生差异。

之后从 DbMigrator 项目运行 dotnet run 重新执行种子，新的客户端重定向 URI 据此进入数据库。

## 保留两个 UI

--mode keep 保留 angular/，在旁边增加 vue/。两者端口不同且源均获准时可同时运行，方便逐页迁移。

## 后续步骤

```bash
cd vue
pnpm install
pnpm abpv doctor
pnpm dev
```

登录失败时 doctor 指出十类常见不匹配及修复命令。打开 Vite 输出的前端 URL，点击右上角 Login；默认流程转到后端登录页面，认证后返回 Vue。

为已有实体添加页面见 [CRUD 页面](./crud-page)。在 vue/ 从 pnpm dev 前运行 pnpm abpv proxy add --module app 和 pnpm abpv generate Book；开发服务已运行则生成后重启。Node 不信任本地证书时，两条命令增加 --insecure。
