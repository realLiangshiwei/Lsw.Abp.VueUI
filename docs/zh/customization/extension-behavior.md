# 扩展行为与默认值

本页解释贡献者回调、默认值与表单正文如何工作。具体类型通过 IDE 从 `@lsw-abpvue/components` 与 `@lsw-abpvue/utils` 查询；四类扩展指南提供完整示例。

## 回调上下文

实体操作／属性的 R 是单行，Identity 工具栏的 R 是当前页只读数组。回调在 setup 外执行时，getInjected 仍可解析服务。异步值到达之前为 undefined，应提供适当空态。

## 属性与字段默认值

| 选项 | 默认值 | 含义 |
| --- | --- | --- |
| `displayName` | `name` | 本地化 key |
| `permission` | 空字符串 | 无附加策略要求 |
| `visible` | 始终 true | 行／表单显隐回调 |
| `isExtra` | false | 是否位于扩展属性路径 |
| `EntityProp.sortable` | false | 后端排序需要显式开启 |
| `EntityProp.columnVisible` | 始终 true | 整列显隐 |
| `FormProp.disabled/readonly` | 始终 false | 控件初始状态 |
| `FormProp.autocomplete` | `off` | 输入自动完成 |
| `FormProp.id` | `name` | 控件标识 |
| `FormProp.validators` | 空数组 | 贡献者提供的规则 |

没有存储值时，FormProp 使用 defaultValue；没有显式默认值时，布尔控件初始 false，多选初始空数组，数字初始 null，其他类型初始空字符串。

列组件接收 `record/index/prop/value`；表单组件接收 `modelValue/prop/record/disabled/readonly`，并发出 `update:modelValue`。两套组件契约不同。

## 操作

`EntityAction.create<R>(options)` 与 `ToolbarAction.create<R>(options)` 返回配置好的操作，createMany 版本保留顺序。

| 选项 | 默认值／行为 |
| --- | --- |
| `text`、`action` | 必填的本地化标签与回调 |
| `icon`、`permission` | 空字符串 |
| `visible` | 始终 true |
| `EntityAction.showOnlyIcon` | false |
| `btnClass`、`btnStyle`、`tooltip` | 可选 |

visible 接收可选上下文。操作可以返回 Promise，忙碌状态由页面／命令管理。普通应用的 `RowAction<R>` 直接接收记录，没有自动权限判断，需要自行过滤。

当前 ToolbarAction 没有 component 选项，复杂渲染使用 Vue 工具栏插槽或替换页面。

## 链表操作

EntityPropList、FormPropList 等继承 `LinkedList<T>`。

| 操作 | 返回值／行为 |
| --- | --- |
| `addHead(value)`／`addTail(value)` | 新增的 `ListNode<T>` |
| `addByIndex(value, index)` | 新增节点或 undefined |
| `addBefore(value, predicate)` | 新节点；无匹配时插到头部 |
| `addAfter(value, predicate)` | 新节点；无匹配时插到尾部 |
| `dropByValue(predicate)` | 首个删除节点或 undefined |
| `dropByValueAll(predicate)` | 所有删除节点 |
| `toArray()` | 按顺序返回值数组 |
| `add(value).after(predicate)` | addAfter 的链式形式 |

索引从零开始。相对定位也接受目标与比较函数，例如 `props.addAfter(customProp, 'userName', (prop, name) => prop.name === name)`。其他重载与批量操作可通过 IDE 查看 LinkedList 类型。

## 表单正文

`useExtensibleForm<R>(record?)` 返回 `{ form, props, isEdit, toRequestBody }`。已有非空记录使用编辑字段，否则使用新增字段。在拥有扩展标识的页面 setup 中调用。

`toRequestBody(): Record<string, unknown>` 把控件写入普通字段或 extraProperties，并保留已有扩展值。它不会发送请求，页面负责验证、提交、并发处理与刷新。

record 参数是该表单实例的初始记录。同一个模态框切换编辑记录时，应重建相应表单组件／实例，不能把该参数当成持续响应的记录来源。

## 组装与注册

mergeWithDefaultProps 按模块默认项、后端生成贡献者、宿主贡献者的顺序合并，mergeWithDefaultActions 处理操作列表。普通宿主通常将贡献者映射传给模块路由工厂，不直接调用底层组装函数。

完整示例：[列](/zh/customization/table-columns)、[字段](/zh/customization/form-fields)、[行操作](/zh/customization/entity-actions)、[工具栏](/zh/customization/toolbar-actions)。
