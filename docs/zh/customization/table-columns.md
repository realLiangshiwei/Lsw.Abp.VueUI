# 表格列扩展

本例将用户表格中的邮件文本替换成邮件链接。宿主需要已注册 Identity UI，并拥有访问用户页面的权限。

## 创建单元格组件

创建 `src/components/ContactCell.vue`：

<<< ../../examples/ContactCell.vue

组件通过属性接收记录，需要时还可声明 `index`、`prop` 和 `value`。展示使用文本插值或 Vue 组件，`valueResolver` 不会插入 HTML。

## 创建贡献者

将以下示例保存为 `src/identity-options.ts`，把 ContactCell 导入路径调整为 `./components/ContactCell.vue`：

<<< ../../examples/user-columns.ts

## 注册到模块路由

将示例保存为 `src/identity-options.ts`，在 `src/routes.ts` 使用导出的选项：

~~~ts
import { lazyRoutes } from '@lsw-abpvue/core/router';
import { userColumns } from './identity-options';

const identityRoute = lazyRoutes('/identity', () =>
  import('@lsw-abpvue/identity').then(module => module.createIdentityRoutes(userColumns)),
);
~~~

将 `identityRoute` 放入应用路由数组，并保留启动时的 `provideIdentityConfig()`。替换已有 identity 路由，不要为同一前缀注册两份路由。模块配置改变后重启开发服务，再打开 `/identity/users`。


## 设置列行为

| 属性 | 含义 |
| --- | --- |
| `name` | 稳定字段标识及默认取值路径 |
| `displayName` | 列标题本地化 key |
| `sortable` | 默认 false；排序时向后端发送列名称 |
| `columnWidth` | 可选列宽 |
| `columnVisible` | 检查整列是否存在 |
| `visible` | 检查某行的值是否显示 |
| `isExtra` | 从 `record.extraProperties[name]` 取值 |
| `component` | 替换单元格渲染 |

派生的 `contact` 列没有开启排序，因为后端没有 contact 排序字段。需要保留邮件排序时，改为 `name: 'email', sortable: true`。

派生文本可以使用 `valueResolver: data => data.record.name || data.record.userName || ''`。异步查找应复用缓存或预先加载映射，避免为每个单元格单独发请求。

## 检查效果

原邮件列移除，用户名后出现邮件链接；没有邮件地址的记录显示短横线。离开再进入页面，确认只出现一个 contact 列，并检查窄屏和切换语言后的显示。

[扩展默认值](/zh/customization/extension-behavior)与[链表操作](/zh/customization/extension-behavior#链表操作)介绍显隐、排序与找不到目标时的行为。

## 选择值解析或组件显示

派生普通值通过 valueResolver 返回，保持转义。复杂链接使用 ContactCell.vue 这样的 component。单元格组件接收 record、prop、index、value，可通过行注入器获取服务。异步补充需要可取消，不能每次渲染都请求。

值解析器支持普通值、Promise、Ref 或 getter。后端可能失败或缓慢，常用显示数据宜直接包含在列表 DTO 中，避免每行一次的 N+1 请求。组件适合徽标与链接，不应注入未经处理的 HTML。

## 显隐、宽度与排序

permission 决定列是否允许，columnVisible(getInjected) 控制整列，visible 控制每条记录的值，用户 hiddenColumns 是另一层过滤。因此贡献器执行成功不代表列一定显示。

columnWidth 提供宽度提示。派生字段只有在后端支持按该名称排序时才设置 sortable。修改显示标签不等于修改 API 排序字段。cell-{name} 插槽是局部显示覆盖，宿主组件贡献器则应用于所有使用该模块注册表的位置。

## 调整默认列顺序

按稳定 name 找到默认列，移除并在目标位置插入同一 prop，保留解析器、权限与类型，不重建不完整替代。插入前检查锚点存在，检查最终列表没有重复，并分别测试拒绝权限与用户隐藏列。
