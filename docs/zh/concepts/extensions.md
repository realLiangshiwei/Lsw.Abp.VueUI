# 页面扩展

可复用模块页面提供五类扩展点，宿主应用通过它们定制内置页面。应用自己的生成页面直接维护列与 CRUD 方法。

| 扩展点 | 控制内容 |
| --- | --- |
| `entityProps` | 表格列 |
| `createFormProps` | 新增字段 |
| `editFormProps` | 编辑字段 |
| `entityActions` | 行操作 |
| `toolbarActions` | 工具栏操作 |

## 贡献者

将贡献者映射传入模块路由工厂，以公共组件标识作为 key。下面的类型化示例给用户页添加列和操作：

<<< ../../examples/users-extension.ts

[用户教程](/zh/tutorials/extend-users)介绍路由注册。贡献者列表支持 `addHead`、`addTail`、`addByIndex`、相对其他项插入及对应删除操作，精确签名见 [components](/zh/api/components) 导出的列表类型。

## 组装顺序

先组装模块默认项，再映射受支持的后端对象扩展，最后执行宿主贡献者。路由解析器在页面渲染前组装，重新进入路由会重建贡献者集合，不重复添加列。

## 值与操作

`valueResolver(data)` 读取记录并返回展示文本，也可以通过 Promise 或响应式值返回。回调中使用 `data.getInjected(Token)` 获取服务。富单元格使用接收 record、index、prop、value 的 Vue 组件，取值文本不会作为 HTML 插入。

`EntityAction` 接收 `PropData`，支持权限与可见条件；普通业务页面的 `RowAction` 回调直接接收记录。工具栏操作使用当前页记录，在两类页面之间迁移代码时需要注意。

组件 key 和后端标识与 Angular 一致，Observable 回调和 Angular 组件类需要适配 Vue，整个配置不能自动互换。
