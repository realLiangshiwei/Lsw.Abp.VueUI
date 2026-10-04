<script setup>
import Example from "../../examples/PageExample.vue";
</script>

# AbpPage

`AbpPage` 提供页面标题、工具栏位置和内容区域，适合作为业务页面的外层组件。

## 标题与页面操作

<ClientOnly><DocsDemo :example="Example" note="演示仅使用本地数据，不连接业务服务器。" /></ClientOnly>

<<< ../../examples/PageExample.vue

title 接收字符串本地化 key，例如 BookStore::Books，独立示例也可使用普通字符串。它与表格已经本地化的 header 不同，页面会通过本地化服务解析标题。示例更新本地计数，实际页面应连接自己的创建流程。

## 定制标题

title 插槽替换标题显示，应保留有意义的标题层级。toolbar 插槽接收普通按钮或 AbpPageToolbar，默认插槽是页面内容。简单业务页面可直接写按钮，不需要注册贡献器。

## 布局负责的部分

导航、面包屑、全局宿主由外围布局提供。AbpPage 不注册路由、不设置后端权限，也不查询记录。路由元数据与权限应单独配置，参见[路由](/zh/concepts/routes-and-menu)和[布局](/zh/customization/layout)。

标题包装与列表结合参见[列表](/zh/utilities/lists)，可复用模块的贡献工具栏参见[AbpPageToolbar](/zh/components/page-toolbar)。

<!-- component-contract:start -->

## 属性、事件与插槽

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpPage.vue)

类型来自公开契约，默认表达式来自当前实现。短横线表示没有显式默认值；省略的可选布尔属性通常为 false。

### Props

| 名称    | 类型                  | 必填 | 默认值 |
| ------- | --------------------- | ---- | ------ |
| `title` | `string \| undefined` | 否   | —      |

### Events

没有声明组件专有事件。

### Slots

| 名称      | 上下文          |
| --------- | --------------- |
| `default` | `() => unknown` |
| `title`   | `() => unknown` |
| `toolbar` | `() => unknown` |

<!-- component-contract:end -->
