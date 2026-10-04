<script setup>
import Example from "../../examples/TypeaheadExample.vue";
</script>

# AbpTypeahead

使用 AbpTypeahead 选择按需搜索的作者、用户或其他关联对象。

## 值与显示文字

<ClientOnly><DocsDemo :example="Example" note="示例使用本地数据，不请求业务服务器。" /></ClientOnly>

<<< ../../examples/TypeaheadExample.vue

模型保存作者 id，displayValue 保存名称。详情已返回名称时，编辑表单可以直接设置两者，不需要只为显示文字再查一次。

## 连接 Identity 用户 API

按下面示例创建 src/pages/UserAssignmentPage.vue，保留 Core、OAuth、路由、Basic Theme 提供者，安装 Identity 以使用其 /proxy 入口。后端需要暴露 Identity 用户 API，并授予调用者 AbpIdentity.Users。无需假定自定义作者端点。

<<< ../../examples/RemoteUserLookup.vue

在已有路由数组注册 /user-assignment，设置组件导入与 requiresAuthentication: true。示例预选当前用户来演示编辑；业务编辑器将 initialUserId 替换为详情 DTO 中的 id。DTO 已包含标签时直接设置两个模型，跳过详情查询。

search 回调通过 IdentityUserService 发送 filter、skipCount、maxResultCount，传递控件信号，将 IdentityUserDto 映射成选项。保存 DTO 只包含 id，displayValue 是显示文字。

选中用户加载失败显示 Retry；empty 插槽区分搜索失败和成功但无结果。RestService 报告失败后，回调按控件契约返回已完成的列表，忽略取消。失败不会变成成功分配。

## 请求生命周期

minLength 默认 1，debounce 默认 300 毫秒。输入过短不搜索，新词或卸载取消过时请求。请求须遵循信号以及时释放网络操作。失败不等于成功的空结果，应通过请求／错误层报告。

## 定制结果

item 插槽接收 item、active，empty 插槽解释成功的空结果。保留键盘选择，避免嵌套链接或按钮。select 事件传选项，清空时为 null，页面可以更新关联状态。

清空必填选择需要表单验证，不能把显示标签作为后端 id。参见[请求生命周期](/zh/utilities/requests)与[表单](/zh/utilities/forms)。

<!-- component-contract:start -->

## 属性、事件与插槽

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpTypeahead.vue)

类型来自公开契约，默认表达式来自当前实现。短横线表示没有显式默认值；省略的可选布尔属性通常为 false。

### Props

| 名称              | 类型                                                                          | 必填 | 默认值 |
| ----------------- | ----------------------------------------------------------------------------- | ---- | ------ |
| `modelValue`      | `AbpOptionValue \| undefined`                                                 | 否   | —      |
| `displayValue`    | `string \| undefined`                                                         | 否   | `''`   |
| `search`          | `(term: string, signal: AbortSignal) => Promise<readonly AbpTypeaheadItem[]>` | 是   | —      |
| `debounce`        | `number \| undefined`                                                         | 否   | `300`  |
| `minLength`       | `number \| undefined`                                                         | 否   | `1`    |
| `placeholder`     | `string \| undefined`                                                         | 否   | —      |
| `disabled`        | `boolean \| undefined`                                                        | 否   | —      |
| `readonly`        | `boolean \| undefined`                                                        | 否   | —      |
| `invalid`         | `boolean \| undefined`                                                        | 否   | —      |
| `clearable`       | `boolean \| undefined`                                                        | 否   | —      |
| `id`              | `string \| undefined`                                                         | 否   | —      |
| `name`            | `string \| undefined`                                                         | 否   | —      |
| `ariaDescribedby` | `string \| undefined`                                                         | 否   | —      |
| `ariaLabel`       | `string \| undefined`                                                         | 否   | —      |

### Events

| 名称                  | 参数                               |
| --------------------- | ---------------------------------- |
| `update:modelValue`   | `[value: AbpOptionValue]`          |
| `update:displayValue` | `[value: string]`                  |
| `select`              | `[item: AbpTypeaheadItem \| null]` |

### Slots

| 名称    | 上下文                                                              |
| ------- | ------------------------------------------------------------------- |
| `item`  | `(context: { item: AbpTypeaheadItem; active: boolean }) => unknown` |
| `empty` | `() => unknown`                                                     |

<!-- component-contract:end -->
