<script setup>
import Example from "../examples/PaginationExample.vue";
</script>

# AbpPagination

`AbpPagination` controls page number and page size. It receives the total number of records, not the number of pages.

## Page and record range

<ClientOnly><DocsDemo :example="Example" note="This example uses local data and does not contact a business server." /></ClientOnly>

<<< ../examples/PaginationExample.vue

Try another page and page size. The UI starts at page 1; the bound `page` starts at 0. The output shows the request values that correspond to the visible page.

## Bind to a list

Use `v-model:page="list.page.value"`, `v-model:page-size="list.maxResultCount.value"` and the query's total count. `useListService` handles refetching when these values change. For a manually managed list, reset page to zero on a size/filter change and issue the request yourself.

Enable `show-size-selector` explicitly to show the page-size dropdown. `pageSizes` sets its choices. Use positive sizes appropriate for the backend's maximum limit. The pagination does not slice data or send requests.

## Summary and empty results

The standalone pager does not render “Showing 1 to 10 of 47 entries”. Calculate it in the caller as in the example, or localize `AbpUi::PagerInfo{0}{1}{2}`. Use zero for both range bounds when the total is zero. A server page can contain fewer items than requested; use the actual items length for its final bound.

`AbpExtensibleTable` already renders the range and pager together. Avoid adding a second pager under it. If deleting the last item leaves the current page outside the total, move back to a valid page and reload.

See [lists](/utilities/lists) and [data table](/components/data-table).

<!-- component-contract:start -->

## Props, events and slots

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpPagination.vue)

Types come from the public contract and defaults from the current implementation. A dash means no explicit default; optional boolean props are normally false when omitted.

### Props

| Name               | Type                             | Required | Default                   |
| ------------------ | -------------------------------- | -------- | ------------------------- |
| `page`             | `number`                         | Yes      | —                         |
| `pageSize`         | `number`                         | Yes      | —                         |
| `total`            | `number`                         | Yes      | —                         |
| `siblingCount`     | `number \| undefined`            | No       | `1`                       |
| `showSizeSelector` | `boolean \| undefined`           | No       | —                         |
| `pageSizes`        | `readonly number[] \| undefined` | No       | `() => [10, 25, 50, 100]` |
| `disabled`         | `boolean \| undefined`           | No       | —                         |
| `ariaLabel`        | `string \| undefined`            | No       | —                         |

### Events

| Name              | Payload           |
| ----------------- | ----------------- |
| `update:page`     | `[value: number]` |
| `update:pageSize` | `[value: number]` |

### Slots

No named slots.

<!-- component-contract:end -->
