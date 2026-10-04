# abpv doctor

```bash
abpv doctor
abpv doctor --token "$ACCESS_TOKEN"
abpv doctor --offline
```

## 选项

| 选项 | 含义 |
| --- | --- |
| `--solution <dir>` | 方案目录，默认向上发现 |
| `--token <token>` | 认证后检查权限名 |
| `--offline` | 跳过需要后端的诊断 |

诊断环境、后端可达性、证书、CORS、OpenIddict 客户端、重定向、版本、代理新鲜度、对象扩展映射和本地源码。失败会给出修复建议，命令不写项目文件。

## 检查边界

代理新鲜度按记录重新生成到内存，再与磁盘逐文件比较。对象扩展检查列出无法映射的属性。无 token 时明确跳过权限名检查，匿名权限为空不能证明定义完整。

已测试 ABP 小版本为 10.5、10.6，其他版本发出警告。方案元数据允许注释与尾逗号，格式错误或版本缺失只警告，让其余诊断继续。

详细症状与处理见[问题排查](/zh/guide/troubleshooting)。
