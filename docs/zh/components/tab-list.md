<script setup>
import Example from "../../examples/TabListExample.vue";
</script>

# AbpTabList

`AbpTabList` 显示页签导航，页面持有选中名称和面板内容。

## 切换面板

<ClientOnly><DocsDemo :example="Example" note="演示仅使用本地数据，不连接业务服务器。" /></ClientOnly>

<<< ../../examples/TabListExample.vue

每个页签有稳定 name，text 是本地化 key 或带后备文字的 key。模型保存名称，不保存数组下标。

## 方向与键盘

默认纵向适合设置导航与内容并排，横向适合内容上方的紧凑导航。纵向使用上下键，横向使用左右键并考虑文字方向，Home 和 End 选择首尾。

初始值必须对应可见名称。如果权限变化移除了已选页签，页面应选择另一个可见名称。没有选中项时，所有页签可能都不在正常 Tab 焦点顺序内。

## 渲染内容

组件不自动挂载面板，页面应像示例一样显示有可访问名称的内容区域。自定义 label 插槽提供 item，增加徽标、图标时仍需保留有意义的文字。

希望每次访问都重新加载时，可以通过 v-if 只挂载当前面板。需要切换后保留未保存编辑时，应自行设计状态或缓存策略。个人资料与设置贡献组件参见[资料与设置页签](/zh/customization/profile-settings)。

<!-- component-contract:start -->

## 属性、事件与插槽

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpTabList.vue)

类型来自公开契约，默认表达式来自当前实现。短横线表示没有显式默认值；省略的可选布尔属性通常为 false。

### Props

| 名称          | 类型                                      | 必填 | 默认值       |
| ------------- | ----------------------------------------- | ---- | ------------ |
| `items`       | `readonly T[]`                            | 是   | —            |
| `orientation` | `'vertical' \| 'horizontal' \| undefined` | 否   | `'vertical'` |
| `ariaLabel`   | `string \| undefined`                     | 否   | `undefined`  |
| `modelValue`  | `string`                                  | 否   | `''`         |

### Events

| 名称                | 参数              |
| ------------------- | ----------------- |
| `update:modelValue` | `[value: string]` |

### Slots

| 名称    | 上下文                              |
| ------- | ----------------------------------- |
| `label` | `(context: { item: T }) => unknown` |

<!-- component-contract:end -->
