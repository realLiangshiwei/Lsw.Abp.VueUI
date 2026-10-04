# AbpPage

页面标题、工具栏与正文容器。

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpPage.vue)

## 用法

```vue
<AbpPage title="BookStore::Menu:Books">
  <template #toolbar><AbpButton @click="create">New book</AbpButton></template>
  <p>Page content</p>
</AbpPage>
```

## 行为说明

title 接收本地化 key。面包屑由布局提供；自定义标题使用 title 插槽。

## Props

| 名称    | 类型                  | 必填 | 默认值 |
| ------- | --------------------- | ---- | ------ |
| `title` | `string \| undefined` | 否   | —      |

## Events

没有组件专有事件。原生属性和事件由组件根元素处理。

## Slots

| 名称      | 上下文          |
| --------- | --------------- |
| `default` | `() => unknown` |
| `title`   | `() => unknown` |
| `toolbar` | `() => unknown` |

示例为模板片段，需要在页面中提供对应变量和方法。主题控件从 `@lsw-abpvue/theme-shared` 导入，数据与页面组件从 `@lsw-abpvue/components` 导入，也可使用应用模板的自动导入配置。类型和绑定来自公开契约，默认表达式来自当前实现。短横线表示未显式声明默认值；可选 boolean 属性省略时通常为 false。

[包 API](/zh/api/components)
