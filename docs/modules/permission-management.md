# Permission management

The dialog that grants permissions, for any provider ABP knows.

```vue
<AbpPermissionManagement
  v-model:visible="open"
  provider-name="R"
  :provider-key="role.name"
  :entity-display-name="role.name"
/>
```

| Provider | What it means |
| --- | --- |
| `R` | A role |
| `U` | A user |
| `C` | An OpenIddict client |

The identity module opens it from a row action on both its pages; anything else that has
permissions can open it the same way.

## What the dialog knows

- The groups and their permissions, as the backend defines them.
- Which are granted here, and which are granted somewhere else — a permission a user has
  through a role is shown as granted and disabled, with the provider named.
- The parent/child relationship: granting a child grants its parent, revoking a parent
  revokes its children.

The grant rules are pure functions (`toggle`, `changesBetween`, `isGrantedElsewhere`,
`flatten`), exported and unit tested, rather than logic living inside a component. The
Angular UI keeps them in the component; having them out here is what makes the cascade
testable.

## Only what changed is sent

`changesBetween` compares the state the dialog opened with against the state it is
closing with, and sends the difference. ABP's endpoint accepts a full list, but sending
one means a permission somebody else granted while the dialog was open is silently
reverted.
