# AbpExtensibleForm

通过表单贡献者装配字段。

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpExtensibleForm.vue)

## 用法

```vue
<AbpExtensibleForm :form="form" :record="record">
  <template #field-name="{ control }"><AbpInput v-model="control.value" /></template>
</AbpExtensibleForm>
```

## 行为说明

form 来自 useExtensibleForm。field-{name} 替换一个控件。同组属性一起显示，无法匹配字段的服务端错误仍会展示。

## Props

| 名称     | 类型                | 必填 | 默认值 |
| -------- | ------------------- | ---- | ------ |
| `form`   | `ExtensibleForm<R>` | 是   | —      |
| `record` | `R \| undefined`    | 否   | —      |

## Events

没有组件专有事件。原生属性和事件由组件根元素处理。

## Slots

| 名称              | 上下文                                                               |
| ----------------- | -------------------------------------------------------------------- |
| `field-${string}` | `(props: { prop: FormProp<R>; control: AbpFormControl }) => unknown` |

示例为模板片段，需要在页面中提供对应变量和方法。主题控件从 `@lsw-abpvue/theme-shared` 导入，数据与页面组件从 `@lsw-abpvue/components` 导入，也可使用应用模板的自动导入配置。类型和绑定来自公开契约，默认表达式来自当前实现。短横线表示未显式声明默认值；可选 boolean 属性省略时通常为 false。

[包 API](/zh/api/components)
