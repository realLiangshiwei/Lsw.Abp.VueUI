# 创建可复用模块

可复用模块服务于多个宿主应用，需要提供配置、延迟路由、类型化代理和页面扩展点。

## 1. 创建包骨架

```bash
abpv create-lib Blogging --package @acme/blogging-vue --target packages/blogging
cd packages/blogging
pnpm install
pnpm typecheck
pnpm build
```

生成包是独立项目，包含主入口、config 和 proxy 入口。接入宿主前先检查导出的提供者与路由名称。示例页面演示五类扩展点，在生成后端代理前使用 `RestService`。

## 2. 接入后端

ABP 模块运行后生成代理：

```bash
abpv proxy add --module blogging --target proxy/src
```

按模块端点调整页面方法与 DTO，确认包的导出配置包含生成代理的公共入口。

## 3. 接入宿主

启动时注册包的轻量配置提供者，通过 `lazyRoutes` 加载路由工厂，并在这里传入宿主贡献者。在其他应用开始依赖前，确定稳定的组件 key 和本地化资源名称。

## 4. 发布边界

使用 theme-shared 控件，让模块适配所选主题。共享 ABP Vue 包使用 peer dependency，保持唯一 DI Token 实例。发布包含声明文件和公共入口，并让独立宿主消费打包产物，进行类型检查与构建。

[create-lib](/zh/cli/create-lib)介绍骨架结构，[页面扩展](/zh/concepts/extensions)说明贡献者语义。
