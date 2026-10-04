# AbpButton

A themed button with loading, disabled and icon states.

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpButton.vue)

## Usage

```vue
<AbpButton variant="primary" :loading="saving" @click="save">Save</AbpButton>
```

## Behavior

Loading prevents clicks. Add aria-label when the button has only an icon.

## Props

| Name        | Type                                                                                                                      | Required | Default     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| `type`      | `'button' \| 'submit' \| 'reset' \| undefined`                                                                            | No       | `'button'`  |
| `variant`   | `\| 'primary' \| 'secondary' \| 'success' \| 'danger' \| 'warning' \| 'info' \| 'light' \| 'dark' \| 'link' \| undefined` | No       | `'primary'` |
| `size`      | `AbpSize \| undefined`                                                                                                    | No       | `'md'`      |
| `outline`   | `boolean \| undefined`                                                                                                    | No       | —           |
| `loading`   | `boolean \| undefined`                                                                                                    | No       | —           |
| `disabled`  | `boolean \| undefined`                                                                                                    | No       | —           |
| `iconClass` | `string \| undefined`                                                                                                     | No       | —           |
| `block`     | `boolean \| undefined`                                                                                                    | No       | —           |
| `ariaLabel` | `string \| undefined`                                                                                                     | No       | —           |

## Events

| Name    | Payload               |
| ------- | --------------------- |
| `click` | `[event: MouseEvent]` |

## Slots

No named slots.

Examples are template fragments: supply the named values and handlers in your page. Import controls from `@lsw-abpvue/theme-shared` and data/page components from `@lsw-abpvue/components`, or use the application template's auto-import preset. Types and models are extracted from the public contract; default expressions are from the current implementation. A dash means no explicit default is declared. Optional boolean props are normally false when omitted.

[Package API](/api/theme-shared)
