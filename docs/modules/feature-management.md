# Feature management

The dialog that turns features on and off, for any provider.

```vue
<AbpFeatureManagement v-model:visible="open" provider-name="T" :provider-key="tenant.id" />
```

Opened from the tenants page for a tenant (`T`), or for an edition or the host by the same
component with a different provider name.

## What a feature can be

| Value type | Control |
| --- | --- |
| Boolean | A toggle |
| Selection | A select, with the options the backend declared |
| Free text | An input, with the backend's own validator attached |

A numeric feature carries the server's minimum and maximum, and the input enforces them
rather than waiting for a 400. The Angular UI drops them.

## Cascading

Turning a parent off turns its children off and disables them, and turning it back on
restores what they were. The rules — `flattenFeatures`, `setFeatureValue`,
`changedFeatures`, `isFeatureDisabled`, `selectionItemsOf` — are pure functions exported
from the package, so the cascade is unit tested rather than asserted through a dialog.

Only what changed is sent.
