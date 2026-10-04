# AbpExtensibleTable

AbpExtensibleTable 用于可复用模块基于扩展的页面。单个应用自己拥有的业务页面，通常直接定义列、按钮和表单状态即可。

## 渲染模块列与行操作

<<< ../../examples/catalog-extensions.ts

<<< ../../examples/CatalogModulePage.vue

完整集成假定 /api/app/documentation-catalog 支持 GET 列表、POST 创建、PUT 更新和 DELETE，记录包含 id/name，可选 concurrencyStamp/extraProperties。复制两个文件，把 catalogExtensions 加入已有启动 providers，并注册 CatalogModulePage 路由。默认项在页面挂载前注册，宿主贡献器在默认项之后注册。页面提供 CATALOG_PAGE 命令，不清空宿主贡献。包模块可按模块教程从路由解析阶段暴露贡献器选项。应用布局提供通知与确认宿主。

## 数据与生命周期

上层 editor 提供 EXTENSIONS_IDENTIFIER，列和操作在表格挂载前完成组装。表格将分页、排序、范围文字和可选搜索连接到 list，后端必须支持对应过滤与排序字段。使用稳定 recordKey 和唯一偏好 key，单页显示覆盖使用 cell-{name} 插槽。columnVisible 隐藏整列，visible 可以隐藏某行的值。hiddenColumns 保存名称，不保存翻译标题。权限检查只影响显示，查询仍需后端授权。

## 扩展模块

使用稳定的公开组件标识，例如 Catalog.BooksComponent，消费者通过同一标识注册贡献器。修改 key 会改变扩展容器和偏好归属。贡献器按注册顺序执行，再次添加同名项不会自动替换。

可复用模块应从公开入口暴露默认值与贡献器选项。启动和路由注册参见[模块教程](/zh/tutorials/module)，默认值、顺序和排查参见[扩展行为](/zh/customization/extension-behavior)。

## 检查完整流程

打开列表、创建有效记录、获取详情后编辑、先取消一次删除再确认一次。检查失败请求保留值，额外属性编辑后仍存在，刷新按预期保留或重置页码。最后增加一个宿主贡献器，确认默认项仍然只有一份。

配套端点由[后端示例](/zh/tutorials/backend-examples)提供。复制目录服务，使用拥有 `AbpIdentity.Users` 权限的用户登录。它是宿主重启会清空的教学存储，不是框架内置业务 API。

<!-- component-contract:start -->

## 属性、事件与插槽

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpExtensibleTable.vue)

类型来自公开契约，默认表达式来自当前实现。短横线表示没有显式默认值；省略的可选布尔属性通常为 false。

### Props

| 名称                 | 类型                   | 必填 | 默认值      |
| -------------------- | ---------------------- | ---- | ----------- |
| `data`               | `readonly R[]`         | 是   | —           |
| `list`               | `ListService`          | 是   | —           |
| `recordKey`          | `string \| undefined`  | 否   | `undefined` |
| `actionsText`        | `string \| undefined`  | 否   | `undefined` |
| `actionsColumnWidth` | `number \| undefined`  | 否   | `undefined` |
| `caption`            | `string \| undefined`  | 否   | `undefined` |
| `selectable`         | `boolean \| undefined` | 否   | `false`     |
| `expandable`         | `boolean \| undefined` | 否   | `false`     |
| `searchable`         | `boolean \| undefined` | 否   | `false`     |
| `persistKey`         | `string \| undefined`  | 否   | `undefined` |
| `selected`           | `string[]`             | 否   | `() => []`  |
| `expanded`           | `string[]`             | 否   | `() => []`  |
| `hiddenColumns`      | `string[]`             | 否   | `() => []`  |

### Events

| 名称                   | 参数                |
| ---------------------- | ------------------- |
| `update:selected`      | `[value: string[]]` |
| `update:expanded`      | `[value: string[]]` |
| `update:hiddenColumns` | `[value: string[]]` |

### Slots

| 名称             | 上下文                                                            |
| ---------------- | ----------------------------------------------------------------- |
| `toolbar`        | `() => unknown`                                                   |
| `expanded-row`   | `(props: { row: R; index: number }) => unknown`                   |
| `empty`          | `() => unknown`                                                   |
| `cell-${string}` | `(props: { row: R; value: PropValue; index: number }) => unknown` |

<!-- component-contract:end -->
