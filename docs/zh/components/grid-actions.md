# AbpGridActions

将行操作显示为单个按钮或下拉菜单。

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpGridActions.vue)

## 用法

```vue
<AbpGridActions :record="book" :actions="actions" :disabled="saving" />
```

## 行为说明

一个操作显示按钮，多个操作显示下拉菜单，没有操作时不显示。普通 RowAction.action 接收记录。传入前按权限过滤操作；仅在模块扩展上下文中省略 actions。

## Props

| 名称       | 类型                                   | 必填 | 默认值      |
| ---------- | -------------------------------------- | ---- | ----------- |
| `record`   | `R`                                    | 是   | —           |
| `index`    | `number \| undefined`                  | 否   | `0`         |
| `actions`  | `readonly RowAction<R>[] \| undefined` | 否   | `undefined` |
| `disabled` | `boolean \| undefined`                 | 否   | `false`     |
| `text`     | `string \| undefined`                  | 否   | `undefined` |

## Events

没有组件专有事件。原生属性和事件由组件根元素处理。

## Slots

没有命名插槽。

示例为模板片段，需要在页面中提供对应变量和方法。主题控件从 `@lsw-abpvue/theme-shared` 导入，数据与页面组件从 `@lsw-abpvue/components` 导入，也可使用应用模板的自动导入配置。类型和绑定来自公开契约，默认表达式来自当前实现。短横线表示未显式声明默认值；可选 boolean 属性省略时通常为 false。

[包 API](/zh/api/components)
