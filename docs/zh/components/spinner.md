<script setup>
import Example from "../../examples/SpinnerExample.vue";
</script>

# AbpSpinner

`AbpSpinner` 显示进行中的操作，并提供屏幕阅读器标签，不阻止输入，也不管理请求。

## 仅在操作期间显示

<ClientOnly><DocsDemo :example="Example" note="演示仅使用本地数据，不连接业务服务器。" /></ClientOnly>

<<< ../../examples/SpinnerExample.vue

放在相关内容附近，给内容绑定 aria-busy，为加载图标设置明确的 label，避免只有视觉动画而没有含义。

## 按钮与页面加载

保存按钮直接使用 AbpButton 的 loading，通常不必在内部另加加载图标。初始数据请求需要区分加载、空结果和错误。通过 finally 结束，或根据请求状态计算可见性。

size 只改变尺寸，不提供全屏遮罩、焦点锁定或减少动画的设置。不能重复的操作需要单独禁用。参见[请求生命周期](/zh/utilities/requests)。

<!-- component-contract:start -->

## 属性、事件与插槽

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpSpinner.vue)

类型来自公开契约，默认表达式来自当前实现。短横线表示没有显式默认值；省略的可选布尔属性通常为 false。

### Props

| 名称      | 类型                   | 必填 | 默认值 |
| --------- | ---------------------- | ---- | ------ |
| `size`    | `AbpSize \| undefined` | 否   | `'md'` |
| `label`   | `string \| undefined`  | 否   | —      |
| `overlay` | `boolean \| undefined` | 否   | —      |

### Events

没有声明组件专有事件。

### Slots

没有命名插槽。

<!-- component-contract:end -->
