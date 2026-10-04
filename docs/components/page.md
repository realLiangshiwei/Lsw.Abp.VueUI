<script setup>
import Example from "../examples/PageExample.vue";
</script>

# AbpPage

`AbpPage` supplies a page heading, toolbar position and content region. Use it as the outer component of an application business page.

## Heading and a page command

<ClientOnly><DocsDemo :example="Example" note="This example uses local data and does not contact a business server." /></ClientOnly>

<<< ../examples/PageExample.vue

The title is a string localization key, such as `BookStore::Books`. A plain string can be used for a standalone example. Unlike a column's already localized header, the page resolves its title through localization. The example increments local state; replace the toolbar command with your create workflow.

## Customize the heading

The `title` slot replaces the heading rendering; retain a meaningful heading level. The `toolbar` slot accepts ordinary buttons or `AbpPageToolbar`. The default slot is the page content. A simple business page can place explicit buttons directly in toolbar without registering contributors.

## Shell responsibilities

The surrounding layout selects the navigation, breadcrumb and global hosts. `AbpPage` does not register a route, set backend permissions or fetch records. Set route metadata and permissions separately. See [routing](/concepts/routes-and-menu) and [layouts](/customization/layout).

For a query and table in this wrapper, see [lists](/utilities/lists). For a reusable module's contributed toolbar, see [AbpPageToolbar](/components/page-toolbar).

<!-- component-contract:start -->

## Props, events and slots

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpPage.vue)

Types come from the public contract and defaults from the current implementation. A dash means no explicit default; optional boolean props are normally false when omitted.

### Props

| Name    | Type                  | Required | Default |
| ------- | --------------------- | -------- | ------- |
| `title` | `string \| undefined` | No       | —       |

### Events

No component-specific events are declared.

### Slots

| Name      | Context         |
| --------- | --------------- |
| `default` | `() => unknown` |
| `title`   | `() => unknown` |
| `toolbar` | `() => unknown` |

<!-- component-contract:end -->
