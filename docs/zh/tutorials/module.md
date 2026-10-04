# 创建可复用模块

可复用模块提供轻量启动配置、延迟路由、生成代理和扩展选项。本教程创建 Blogging UI 包，假定已有可以接入的后端模块。

## 1. 创建并构建包

在已有包以外的目录执行：

~~~bash
abpv create-lib Blogging --package @acme/blogging-vue --target packages/blogging
cd packages/blogging
pnpm install
pnpm typecheck
pnpm build
~~~

包包含根、`/config` 和 `/proxy` 入口。初始组件 key 为 `Blogging.BloggingComponent`，路由为 `/blogging`。这些是骨架命名，不代表已有 Blogging 后端的命名。

## 2. 对齐后端契约

骨架通过 RestService 调用 `/api/blogging`，初始权限为 `Blogging.Blogging` 及对应 Create／Update／Delete。将它们替换为后端实际端点、权限和本地化 key。

连接运行中的后端生成代理：

~~~bash
abpv proxy add --module blogging --target proxy/src
~~~

在包目录配置 API 地址后执行，或使用 proxy 的 `--url`。`--module` 是 api-definition 的模块名，不一定等于 npm 包名；后端元数据没有该名称时，选择实际名称。

将 `src/models/blogging.ts` 和页面调用替换为生成 DTO／服务，调整字段、排序、新增／更新正文，保留并发标记与扩展属性。代理 index 应公开生成服务，检查构建后的导出入口，不导入内部 dist 文件。

## 3. 在宿主安装

使用 workspace 链接，或在构建后生成 tarball：

~~~bash
pnpm pack --pack-destination /tmp
~~~

在宿主前端用 `pnpm add /tmp/<tarball-name>.tgz` 安装实际产物。共享 ABP Vue 包是 peer dependency，需要与宿主解析到同一份实例。

宿主启动配置：

~~~ts
import { provideBloggingConfig } from '@acme/blogging-vue/config';

const providers = [
  // Existing core, router, OAuth and theme providers...
  provideBloggingConfig(),
];
~~~

宿主路由：

~~~ts
import { lazyRoutes } from '@lsw-abpvue/core/router';

const bloggingRoute = lazyRoutes('/blogging', () =>
  import('@acme/blogging-vue').then(module => module.createBloggingRoutes()),
);
~~~

将 bloggingRoute 加入传给 `provideAbpRouter` 的数组。轻量 config 注册菜单，不需要提前导入页面。

## 4. 允许宿主扩展

~~~ts
import { EntityProp, PropType } from '@lsw-abpvue/components';
import { BloggingComponents, type BloggingConfigOptions, type BloggingDto } from '@acme/blogging-vue';

const options = {
  entityPropContributors: {
    [BloggingComponents.Blogging]: [
      props => props.addTail(EntityProp.create<BloggingDto>({
        name: 'displayName',
        type: PropType.String,
        displayName: 'Blogging::DisplayName',
        valueResolver: data => data.record.name || '',
      })),
    ],
  },
} satisfies BloggingConfigOptions;
~~~

将 options 传给 `createBloggingRoutes(options)`。例子使用骨架 DTO，改为生成代理后调整导入类型。在其他应用依赖之前，确定稳定的组件 key 和贡献者选项。

## 5. 检查宿主消费

在宿主执行类型检查、构建，用真实后端策略登录，打开菜单并检查查询和 CRUD。检查贡献列与按公共 key 替换组件的行为；也检查 tarball，避免 workspace 路径掩盖打包错误。

模块控件从 theme-shared 导入，共享框架包使用 peer。另见 [create-lib](/zh/cli/create-lib)、[扩展](/zh/concepts/extensions)与[包依赖](/zh/concepts/packages)。
