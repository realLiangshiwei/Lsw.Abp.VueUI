# abpv update

```bash
abpv update --tag alpha     # the current prerelease channel
abpv update --to 0.2.0
abpv update --tag next
abpv update --dry-run
```

package.json 中每个 @lsw-abpvue/* 版本范围更新到同一版本，保留原修饰符：^0.1.0 变为 ^0.2.0，0.1.0 变为 0.2.0。

## 保留内容

| 内容 | 原因 |
| --- | --- |
| 非普通版本范围 | file: 路径、标签、git URL 是项目明确选择 |
| 已释放源码的包 | 本地副本归应用所有，修改包版本不会更新副本 |

两者会列出理由，不会静默跳过。

## 已释放源码的变更摘要

对每个已释放包，列出记录的释放版本之后、目标版本以内的 changelog 章节。CLI 先读已安装 CHANGELOG.md，必要时读取目标精确版本的 registry 压缩包。缺少记录或 registry 不可达会报告，但不阻止其他升级。

据此手动更新本地源码。CLI 不覆盖源码，也不声称释放标记已移动到目标版本。

## 迁移

包含破坏性变更的发布携带迁移；从当前版本到目标版本按顺序运行，跨三个发布会执行三个迁移。目前没有迁移，空列表表示这一点。

## 后续步骤

只修改 manifest，之后重新安装依赖。

--to 选择精确版本，--tag 选择 registry 标签（默认 latest），--dry-run 预览。预发布开发阶段显式选择 --tag alpha，不依赖默认 registry 标签。
