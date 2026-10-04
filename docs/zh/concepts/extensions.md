# 页面扩展

可复用模块提供五类扩展点，宿主无需编辑包文件即可定制内置页面。普通生成业务页面自行定义列、控件和 CRUD 方法。

| 扩展点 | 模块选项 | 指南 |
| --- | --- | --- |
| 表格列 | `entityPropContributors` | [表格列](/zh/customization/table-columns) |
| 新增字段 | `createFormPropContributors` | [表单字段](/zh/customization/form-fields) |
| 编辑字段 | `editFormPropContributors` | [表单字段](/zh/customization/form-fields) |
| 行操作 | `entityActionContributors` | [实体操作](/zh/customization/entity-actions) |
| 工具栏 | `toolbarActionContributors` | [工具栏操作](/zh/customization/toolbar-actions) |

## 从一个贡献者开始

<<< ../../examples/users-extension.ts

映射的 key 是准确的公共组件标识，例如 `Identity.UsersComponent`。贡献者收到可修改的链表并直接修改它，不需要返回新列表。将选项映射传给模块路由工厂，注册过程见[用户教程](/zh/tutorials/extend-users)。

定位已有项时，使用稳定的字段名或本地化 key；当前语言显示的文字不是稳定标识。

## 组装顺序与作用域

1. 模块加入默认项。
2. 将受支持的后端对象扩展元数据映射为列与控件。
3. 宿主贡献者添加、删除或替换条目。
4. 在模块注入器下渲染页面。

进入路由时组装新列表。贡献者应描述最终修改，不要在贡献者内部继续注册贡献者。模块启动配置负责菜单，路由工厂负责页面扩展选项。

回调可能在 setup 之外执行。`data.getInjected(Token)` 从扩展所在的注入器解析服务；点击回调中直接调用普通 `inject` 无效。

## 操作链表

~~~ts
props.addAfter(customProp, prop => prop.name === 'userName');
props.dropByValue(prop => prop.name === 'email');
props.addByIndex(customProp, 2);
~~~

这里的 `props` 和 `customProp` 是贡献者中的类型化列表与属性。相对插入比数字位置更能适应上游变化。`addAfter` 未匹配时追加到末尾，`addBefore` 未匹配时插到开头。`dropByValue` 删除首个匹配，`dropByValueAll` 删除全部匹配。

[扩展行为](/zh/customization/extension-behavior)介绍回调上下文、链表操作与运行时默认值。

## 行与工具栏上下文

`EntityAction<IdentityUserDto>` 的 `data.record` 是单行记录。`ToolbarAction<readonly IdentityUserDto[]>` 收到当前页记录，不是勾选行，也不是数据库全部记录。普通业务页面中的 `RowAction<R>` 直接收到 `R`。

`valueResolver` 支持值、Promise、Ref 和 getter，结果作为文本显示。富单元格使用 Vue 组件，接收 `record`、`index`、`prop`、`value`。表单自定义组件使用另一套模型契约，见[表单字段](/zh/customization/form-fields)。

## 保留后端行为

扩展字段使用 `isExtra: true`，且需要后端真实声明该扩展属性。添加前端字段不会自动创建后端存储。权限和显隐条件只控制 UI，服务端仍须授权 API。

贡献者修改配置项；完整组件替换负责自身 UI 与命令。[组件替换](/zh/customization/replacement)介绍保留内置页面行为的包装方式。
