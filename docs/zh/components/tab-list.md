# AbpTabList

支持水平或垂直排列的可访问标签页。

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpTabList.vue)

## 用法

```vue
<AbpTabList v-model="selected" :items="tabs" orientation="horizontal" aria-label="Settings" />
```

## 行为说明

标签项包含 name，以及可选 text 和 iconClass。text/name 会本地化。调用者负责显示选中的面板，方向键和 Home/End 可切换选择。

## Props

| 名称          | 类型                                      | 必填 | 默认值       |
| ------------- | ----------------------------------------- | ---- | ------------ |
| `items`       | `readonly T[]`                            | 是   | —            |
| `orientation` | `'vertical' \| 'horizontal' \| undefined` | 否   | `'vertical'` |
| `ariaLabel`   | `string \| undefined`                     | 否   | `undefined`  |
| `modelValue`  | `string`                                  | 否   | `''`         |

## Events

| 名称                | 参数              |
| ------------------- | ----------------- |
| `update:modelValue` | `[value: string]` |

## Slots

| 名称    | 上下文                              |
| ------- | ----------------------------------- |
| `label` | `(context: { item: T }) => unknown` |

示例为模板片段，需要在页面中提供对应变量和方法。主题控件从 `@lsw-abpvue/theme-shared` 导入，数据与页面组件从 `@lsw-abpvue/components` 导入，也可使用应用模板的自动导入配置。类型和绑定来自公开契约，默认表达式来自当前实现。短横线表示未显式声明默认值；可选 boolean 属性省略时通常为 false。

[包 API](/zh/api/components)
