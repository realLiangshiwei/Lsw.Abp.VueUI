# AbpButton

带加载、禁用和图标状态的主题按钮.

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpButton.vue)

## 用法

```vue
<AbpButton variant="primary" :loading="saving" @click="save">Save</AbpButton>
```

## 行为说明

加载状态会阻止点击。仅显示图标时应提供 aria-label。

## Props

| 名称        | 类型                                                                                                                      | 必填 | 默认值      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- | ---- | ----------- |
| `type`      | `'button' \| 'submit' \| 'reset' \| undefined`                                                                            | 否   | `'button'`  |
| `variant`   | `\| 'primary' \| 'secondary' \| 'success' \| 'danger' \| 'warning' \| 'info' \| 'light' \| 'dark' \| 'link' \| undefined` | 否   | `'primary'` |
| `size`      | `AbpSize \| undefined`                                                                                                    | 否   | `'md'`      |
| `outline`   | `boolean \| undefined`                                                                                                    | 否   | —           |
| `loading`   | `boolean \| undefined`                                                                                                    | 否   | —           |
| `disabled`  | `boolean \| undefined`                                                                                                    | 否   | —           |
| `iconClass` | `string \| undefined`                                                                                                     | 否   | —           |
| `block`     | `boolean \| undefined`                                                                                                    | 否   | —           |
| `ariaLabel` | `string \| undefined`                                                                                                     | 否   | —           |

## Events

| 名称    | 参数                  |
| ------- | --------------------- |
| `click` | `[event: MouseEvent]` |

## Slots

没有命名插槽。

示例为模板片段，需要在页面中提供对应变量和方法。主题控件从 `@lsw-abpvue/theme-shared` 导入，数据与页面组件从 `@lsw-abpvue/components` 导入，也可使用应用模板的自动导入配置。类型和绑定来自公开契约，默认表达式来自当前实现。短横线表示未显式声明默认值；可选 boolean 属性省略时通常为 false。

[包 API](/zh/api/theme-shared)
