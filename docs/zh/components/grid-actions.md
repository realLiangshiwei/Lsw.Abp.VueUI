<script setup>
import Example from "../../examples/GridActionsExample.vue";
</script>

# AbpGridActions

`AbpGridActions` 将行操作集中显示：多个操作使用下拉菜单，一个操作使用按钮，空列表不显示控件。

## 业务页面的显式操作

<ClientOnly><DocsDemo :example="Example" note="演示仅使用本地数据，不连接业务服务器。" /></ClientOnly>

<<< ../../examples/GridActionsExample.vue

示例只更新本地提示。`RowAction<Book>.action` 直接接收记录。接入后端时，在回调中使用生成的服务或页面命令。

## 权限与可见性

显式传入 `actions` 时，由页面构造允许显示的列表。先根据权限和记录状态过滤，再传给组件。组件的 `disabled` 禁用全部操作，单个操作的 `disabled` 只禁用该项。客户端隐藏不能替代端点授权。

省略 `actions` 时，组件通过上层扩展标识读取实体操作贡献器。这时回调接收包含 `record`、`getInjected` 的 `PropData`，与示例直接接收记录不同。参见[实体操作扩展](/zh/customization/entity-actions)。

## 确认与异步请求

删除不会自动确认。先调用 `ConfirmationService`，只有 `ConfirmationStatus.confirm` 才发删除请求，成功后再刷新列表。返回 Promise 不会自动禁用全部操作，需要在页面命令中维护 busy 并绑定到 disabled，防止重复修改。

## 菜单行为

菜单相对视口定位，避免被表格的横向滚动区域裁切。滚动或调整窗口大小会关闭菜单；Esc 关闭并把焦点还给触发按钮。单个图标操作可以设置 `showOnlyIcon`，但必须提供有意义的 text，本地化后的文字会作为可访问名称。

正式应用的操作标签应使用稳定的本地化 key。参见[通知与确认](/zh/utilities/notifications)。

<!-- component-contract:start -->

## 属性、事件与插槽

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpGridActions.vue)

类型来自公开契约，默认表达式来自当前实现。短横线表示没有显式默认值；省略的可选布尔属性通常为 false。

### Props

| 名称       | 类型                                   | 必填 | 默认值      |
| ---------- | -------------------------------------- | ---- | ----------- |
| `record`   | `R`                                    | 是   | —           |
| `index`    | `number \| undefined`                  | 否   | `0`         |
| `actions`  | `readonly RowAction<R>[] \| undefined` | 否   | `undefined` |
| `disabled` | `boolean \| undefined`                 | 否   | `false`     |
| `text`     | `string \| undefined`                  | 否   | `undefined` |

### Events

没有声明组件专有事件。

### Slots

没有命名插槽。

<!-- component-contract:end -->
