# AbpModal

A modal dialog with guarded close paths.

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpModal.vue)

## Usage

```vue
<AbpModal v-model:visible="visible" :busy="saving" :dirty="form.dirty">
  <template #header><h2>Edit record</h2></template>
  <form @submit.prevent="save">...</form>
  <template #footer="{ close }">
    <AbpButton variant="secondary" @click="close">Cancel</AbpButton>
    <AbpButton :loading="saving" @click="save">Save</AbpButton>
  </template>
</AbpModal>
```

## Behavior

Cancel, the close button, Esc and the backdrop request a guarded close. Native input changes or dirty trigger a discard confirmation. busy prevents user closes. After a successful save set visible=false directly. Use footer.close() for cancellation. init/appear/disappear describe visibility lifecycle, not completed animations. Focus returns to the trigger.

## Props

| Name                            | Type                                        | Required | Default |
| ------------------------------- | ------------------------------------------- | -------- | ------- |
| `visible`                       | `boolean`                                   | Yes      | —       |
| `busy`                          | `boolean \| undefined`                      | No       | —       |
| `size`                          | `'sm' \| 'md' \| 'lg' \| 'xl' \| undefined` | No       | `'md'`  |
| `centered`                      | `boolean \| undefined`                      | No       | —       |
| `dirty`                         | `boolean \| undefined`                      | No       | —       |
| `suppressUnsavedChangesWarning` | `boolean \| undefined`                      | No       | —       |
| `ariaLabel`                     | `string \| undefined`                       | No       | —       |

## Events

| Name             | Payload            |
| ---------------- | ------------------ |
| `update:visible` | `[value: boolean]` |
| `init`           | `[]`               |
| `appear`         | `[]`               |
| `disappear`      | `[]`               |

## Slots

| Name      | Context                                                |
| --------- | ------------------------------------------------------ |
| `header`  | `() => unknown`                                        |
| `default` | `() => unknown`                                        |
| `footer`  | `(context: { close: () => Promise<void> }) => unknown` |

Examples are template fragments: supply the named values and handlers in your page. Import controls from `@lsw-abpvue/theme-shared` and data/page components from `@lsw-abpvue/components`, or use the application template's auto-import preset. Types and models are extracted from the public contract; default expressions are from the current implementation. A dash means no explicit default is declared. Optional boolean props are normally false when omitted.

[Package API](/api/theme-shared)
