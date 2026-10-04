# abpv update

```bash
abpv update --tag alpha --dry-run
abpv update --tag alpha
abpv update --to 0.0.1-alpha.5
```

## 选项

| 选项 | 含义 |
| --- | --- |
| `--to <version>` | 精确目标版本 |
| `--tag <tag>` | 读取注册表标签，默认 latest，目前指向较旧的初始 alpha；当前传 alpha |
| `--dry-run` | 预览清单修改 |

所有普通 `@lsw-abpvue/*` semver 范围更新到同一版本，保留原来的 `^` 等修饰符。`file:`、标签和 Git URL 不强制改写，会说明跳过原因。

## 本地源码与迁移

已释放源码不会覆盖，也不会声称已升级。输出根据已安装 CHANGELOG 和必要时目标归档，汇总释放版本之后的变化；记录缺失或注册表不可达会提示。

已注册迁移按版本顺序运行，当前没有迁移步骤。完成后重新安装依赖，再类型检查、构建并测试相关业务，见[升级说明](/zh/release/upgrading)。
