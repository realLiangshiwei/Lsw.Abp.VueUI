# 问题排查

```bash
pnpm abpv doctor
pnpm abpv doctor --token "$ACCESS_TOKEN"
pnpm abpv doctor --offline
```

## 诊断范围

doctor 检查工具链、后端可达性、证书、CORS、OpenIddict 客户端、回调地址、版本、代理是否过期、对象扩展覆盖和本地源码状态。没有 token 时会说明跳过权限名检查，offline 只执行不需要后端的部分。

## 常见症状

| 症状 | 检查与处理 |
| --- | --- |
| 空白页或网络错误 | 启动后端，检查地址和证书；保留模板启动错误页 |
| 500，The Libs Folder is Missing | 在 HttpApi.Host 项目目录执行 abp install-libs 后重启 |
| 登录失败或回调循环 | 核对 issuer、clientId、scope 和回调，修改后重跑 DbMigrator |
| 修改 dynamic-env.json 没生效 | 检查是否返回 JSON、缓存是否刷新、是否被 HTML 回退替代 |
| 未登录仍显示空管理分组 | 检查配置是否匿名、子菜单权限及应用是否加载旧包 |
| My account 或退出无响应 | 检查服务与 NAVIGATE_TO_MANAGE_PROFILE 注册，刷新旧标签页 |
| 代理与后端不一致 | 运行 proxy refresh 并审阅差异 |
| 扩展字段不显示 | 检查后端元数据、模块实体名称、UI 显隐、权限和功能条件 |
| update 找不到 latest | 当前 alpha 阶段使用 --tag alpha |

对象扩展诊断会列出后端声明但未识别的属性，提供这些具体名称有助于定位映射问题。

## 提交问题

附上 doctor 输出、CLI 与包版本、ABP 版本、页面地址和复现步骤。去除 token、密码、连接串等敏感数据。后端不提供的商业模块端点不能靠前端开关启用。
