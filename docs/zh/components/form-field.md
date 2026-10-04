# AbpFormField

为控件提供标签、校验消息和帮助文本。

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpFormField.vue)

## 用法

```vue
<AbpFormField label="Name" for="name" :errors="messages">
  <AbpInput id="name" v-model="name" />
</AbpFormField>
```

## 行为说明

for 与控件 id 保持一致。errors 接收已格式化的消息，不直接传入校验规则对象。

## Props

| 名称       | 类型                             | 必填 | 默认值     |
| ---------- | -------------------------------- | ---- | ---------- |
| `label`    | `string \| undefined`            | 否   | —          |
| `for`      | `string \| undefined`            | 否   | —          |
| `required` | `boolean \| undefined`           | 否   | —          |
| `hint`     | `string \| undefined`            | 否   | —          |
| `errors`   | `readonly string[] \| undefined` | 否   | `() => []` |
| `disabled` | `boolean \| undefined`           | 否   | —          |

## Events

没有组件专有事件。原生属性和事件由组件根元素处理。

## Slots

| 名称      | 上下文                                                |
| --------- | ----------------------------------------------------- |
| `default` | `(context: AbpFormFieldContext) => unknown`           |
| `label`   | `() => unknown`                                       |
| `hint`    | `() => unknown`                                       |
| `errors`  | `(context: { errors: readonly string[] }) => unknown` |

示例为模板片段，需要在页面中提供对应变量和方法。主题控件从 `@lsw-abpvue/theme-shared` 导入，数据与页面组件从 `@lsw-abpvue/components` 导入，也可使用应用模板的自动导入配置。类型和绑定来自公开契约，默认表达式来自当前实现。短横线表示未显式声明默认值；可选 boolean 属性省略时通常为 false。

[包 API](/zh/api/theme-shared)
