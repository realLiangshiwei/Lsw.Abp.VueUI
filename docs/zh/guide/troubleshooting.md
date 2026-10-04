# 问题排查

```bash
abpv doctor
abpv doctor --token "$ACCESS_TOKEN"   # also compares the permission names
abpv doctor --offline                 # only what can be told without the backend
```

前后端连接问题通常源于可机械检查的配置不匹配。各失败项提供修复命令。

| 检查 | 失败含义 |
| --- | --- |
| 环境 | Node、包管理器、.NET SDK、ABP CLI |
| 后端可达 | GET {api}/api/abp/application-configuration |
| 证书 | 开发证书未受信任，使用 dotnet dev-certs https --trust |
| CORS | 响应宿主的 CorsOrigins 缺少前端源 |
| OpenIddict 客户端 | 身份服务器发现文档与 clientId |
| 重定向 URI | redirectUri 不在客户端 RedirectAllowedUrls |
| 版本 | 方案 ABP 版本与本发布已测试版本 |
| 代理新鲜度 | 在内存中重生成并逐文件比较 |
| 对象扩展覆盖 | 后端声明 N 项，规则识别 M 项 |
| 已释放源码 | 哪些包不再跟随发布 |

## 对象扩展诊断

十五项规则把后端属性映射成列与表单。缺失规则会像应用配置错误：属性已配置但不显示。doctor 比较数量并列出具体差异，输出例如：

```
⚠ object extensions   backend 9, recognised 8
                      not recognised: IdentityUser.HireDate (DateTime?, hidden on the table)
                      → this is a gap in our mapping rules; please open an issue
```

指出的属性属于项目映射缺口。

## 首次运行常见问题

| 现象 | 检查 |
| --- | --- |
| 空白页与网络错误 | 后端未启动或证书不受信任 |
| 500：The Libs Folder is Missing | 在 HttpApi.Host 项目目录执行 abp install-libs，重启宿主 |
| 登录循环 | 重定向 URI 与已种子客户端不符；switch-ui --port &lt;yours&gt;，再运行 DbMigrator |
| 换租户后每次请求 401 | 切换时旧租户令牌会被丢弃；持续出现时检查租户客户端种子 |
| 登录后菜单为空 | 用户缺少权限或应用配置被缓存，强制刷新 |
| 后端配置列未显示 | 查看 doctor 对象扩展诊断 |

## 求助

创建 issue 时附上 doctor 输出，包含工具链、后端位置与失败项，方便定位。
