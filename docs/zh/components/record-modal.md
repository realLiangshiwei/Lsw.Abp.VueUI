# AbpRecordModal

模块记录编辑器的对话框视图。

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpRecordModal.vue)

## 用法

```vue
<AbpRecordModal :editor="editor" label="AbpIdentity::Roles" create-title="AbpIdentity::NewRole" />
```

## 行为说明

editor 来自可复用模块中的 useRecordEditor。默认正文显示扩展表单，可替换标题、正文和底部。应用 CRUD 页面使用 AbpModal、自己的表单和保存方法。

## Props

| 名称          | 类型                                        | 必填 | 默认值 |
| ------------- | ------------------------------------------- | ---- | ------ |
| `editor`      | `RecordEditor<R>`                           | 是   | —      |
| `label`       | `LocalizationParam`                         | 是   | —      |
| `createTitle` | `LocalizationParam`                         | 是   | —      |
| `editTitle`   | `LocalizationParam \| undefined`            | 否   | —      |
| `size`        | `'sm' \| 'md' \| 'lg' \| 'xl' \| undefined` | 否   | —      |
| `save`        | `(() => void) \| undefined`                 | 否   | —      |

## Events

没有组件专有事件。原生属性和事件由组件根元素处理。

## Slots

| 名称      | 上下文                                                 |
| --------- | ------------------------------------------------------ |
| `default` | `() => unknown`                                        |
| `header`  | `() => unknown`                                        |
| `footer`  | `(context: { close: () => Promise<void> }) => unknown` |

示例为模板片段，需要在页面中提供对应变量和方法。主题控件从 `@lsw-abpvue/theme-shared` 导入，数据与页面组件从 `@lsw-abpvue/components` 导入，也可使用应用模板的自动导入配置。类型和绑定来自公开契约，默认表达式来自当前实现。短横线表示未显式声明默认值；可选 boolean 属性省略时通常为 false。

[包 API](/zh/api/components)
