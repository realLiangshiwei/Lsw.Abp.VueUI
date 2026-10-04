# 版本与兼容性

站点从 `main` 构建，描述该分支的当前源码，不是所有历史 alpha 版本的固定手册。

## 已发布包

当前发布系列为 `0.0.1-alpha.5`，通过 `alpha` 标签安装。应用中的公共 ABP Vue 包应使用同一个发布版本。新预发布使用 `alpha`、`beta`、`rc` 标签，稳定版使用 `latest`。2026-10-04 核对注册表时，`latest` 仍指向初始的 `0.0.1-alpha.0`，`alpha` 指向 `0.0.1-alpha.5`，当前预发布阶段应使用 `alpha`。

```bash
npm view @lsw-abpvue/cli dist-tags
npm list @lsw-abpvue/core @lsw-abpvue/cli
```

标签可能更新，第一条命令检查可用标签，第二条检查实际安装版本。

## 兼容范围

CLI 将 ABP 10.5、10.6 识别为已测试的小版本。其他版本会提示诊断警告，需要针对对应后端验证。端点可用性还取决于后端安装的 ABP 模块与版本类型。

CLI 要求 Node 20 或以上，应用使用 Vue 3 与 Vue Router 4，后端 .NET SDK 和 ABP CLI 应匹配目标解决方案。

## 等待发布的源码变化

当前源码包含 Windows 预览路径规范化和基于内置组件标识的列表偏好 key。这些变化完成于 alpha.5 之后，将随后续版本发布到 npm。

基于 Reka 的 Typeahead 迁移、进一步的动画体验等 Backlog 项没有作为已提供功能介绍。[发布记录](./releases)链接实际版本历史。
