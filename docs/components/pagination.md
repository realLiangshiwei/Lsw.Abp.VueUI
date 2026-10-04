# AbpPagination

Zero-based pagination and a page-size selector.

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpPagination.vue)

## Usage

```vue
<AbpPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />
```

## Behavior

Bind ListService.page directly: it is zero-based. total is the total record count, not the number of pages. Render the record-range summary in your page; AbpExtensibleTable includes that summary.

## Props

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

## Events

| Name              | Payload           |
| ----------------- | ----------------- |
| `update:page`     | `[value: number]` |
| `update:pageSize` | `[value: number]` |

## Slots

No named slots.

Examples are template fragments: supply the named values and handlers in your page. Import controls from `@lsw-abpvue/theme-shared` and data/page components from `@lsw-abpvue/components`, or use the application template's auto-import preset. Types and models are extracted from the public contract; default expressions are from the current implementation. A dash means no explicit default is declared. Optional boolean props are normally false when omitted.

[Package API](/api/theme-shared)
