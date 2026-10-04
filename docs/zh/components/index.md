# 组件

十二个主题控件从 `@lsw-abpvue/theme-shared` 导入，页面与表格组件从 `@lsw-abpvue/components` 导入。渲染前需要注册主题，Basic Theme 使用 Bootstrap 样式实现契约。

## 主题控件

| 用途 | 组件 |
| --- | --- |
| 操作与输入 | [Button](./button)、[Input](./input)、[Select](./select)、[Toggle](./toggle) |
| 表单 | [Form field](./form-field)、[Date picker](./date-picker)、[Typeahead](./typeahead) |
| 浮层与反馈 | [Modal](./modal)、[Spinner](./spinner)、[Toast host](./toast-host)、[Confirmation host](./confirm-host) |
| 导航 | [Pagination](./pagination) |

## 页面组件

| 用途 | 组件 |
| --- | --- |
| 普通业务页面 | [Page](./page)、[Data table](./data-table)、[Row actions](./grid-actions)、[Tabs](./tab-list) |
| 可复用模块扩展 | [Page toolbar](./page-toolbar)、[Extensible table](./extensible-table)、[Extensible form](./extensible-form)、[Record modal](./record-modal) |

每页列出属性、默认值、事件、插槽和行为说明，参数表从源码提取。主题控件默认值描述 Basic Theme，其他主题应保留公共契约，但可以有不同视觉细节。

示例是需要应用变量和处理函数的模板片段；完整类型化示例见[表单](/zh/utilities/forms)和[列表](/zh/utilities/lists)。注明“已本地化”的属性需要调用方先翻译，接受本地化参数的属性可以直接传 `Resource::Key`。
