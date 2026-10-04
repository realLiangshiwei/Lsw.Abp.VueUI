<script setup>
import Example from "../../examples/SelectExample.vue";
</script>

# AbpSelect

`AbpSelect` 从已知选项中选择值。需要远程搜索时使用 Typeahead。

## 单选与多选

<ClientOnly><DocsDemo :example="Example" note="演示仅使用本地数据，不连接业务服务器。" /></ClientOnly>

<<< ../../examples/SelectExample.vue

第一个控件包含占位文字和清空操作，第二个可以选择多个分类。Archived 选项被禁用。自定义选项插槽增加选中标记，触发按钮仍使用普通标签文字。

## 选项与值

`AbpOption` 包含 `value`、`label`，可选 `disabled`、`group`。label 是已本地化的文字；需要随语言切换时通过 computed 生成选项。值支持字符串、数字、布尔值和 null，绑定值与选项类型必须一致。数字 `1` 与字符串 `'1'` 是不同选项。

单选保存一个值；`multiple` 保存数组，初始值使用 `[]`。`clearable` 提供清空操作。占位文字说明尚未选择的状态，不是业务选项。

## 加载选项

组件接收选项，不负责请求。使用生成的服务或 `RestService` 加载，在首次加载期间显示反馈并禁用控件。编辑记录时，选项中应包含已有值，才能解析它的标签。请求失败不应自动清除已保存的值。

## 自定义显示与键盘

`option` 插槽提供 `{ option, selected }`。保留标签含义，避免在选项内部加入按钮。用户可以用键盘打开和移动选择。通过 `AbpFormField` 连接标签与错误，参见[输入框](/zh/components/input)。

大量作者或目录数据的搜索参见[Typeahead](/zh/components/typeahead)。

<!-- component-contract:start -->

## 属性、事件与插槽

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpSelect.vue)

类型来自公开契约，默认表达式来自当前实现。短横线表示没有显式默认值；省略的可选布尔属性通常为 false。

### Props

| 名称              | 类型                                                       | 必填 | 默认值 |
| ----------------- | ---------------------------------------------------------- | ---- | ------ |
| `modelValue`      | `AbpOptionValue \| readonly AbpOptionValue[] \| undefined` | 否   | —      |
| `options`         | `readonly AbpOption[]`                                     | 是   | —      |
| `multiple`        | `boolean \| undefined`                                     | 否   | —      |
| `placeholder`     | `string \| undefined`                                      | 否   | —      |
| `disabled`        | `boolean \| undefined`                                     | 否   | —      |
| `readonly`        | `boolean \| undefined`                                     | 否   | —      |
| `invalid`         | `boolean \| undefined`                                     | 否   | —      |
| `clearable`       | `boolean \| undefined`                                     | 否   | —      |
| `id`              | `string \| undefined`                                      | 否   | —      |
| `name`            | `string \| undefined`                                      | 否   | —      |
| `ariaDescribedby` | `string \| undefined`                                      | 否   | —      |
| `ariaLabel`       | `string \| undefined`                                      | 否   | —      |

### Events

| 名称                | 参数                                          |
| ------------------- | --------------------------------------------- |
| `update:modelValue` | `[value: AbpOptionValue \| AbpOptionValue[]]` |

### Slots

| 名称     | 上下文                                                           |
| -------- | ---------------------------------------------------------------- |
| `option` | `(context: { option: AbpOption; selected: boolean }) => unknown` |

<!-- component-contract:end -->
