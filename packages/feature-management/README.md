# @lsw-abpvue/feature-management

The feature dialog for [Lsw.Abp.VueUI](https://github.com/realLiangshiwei/Lsw.Abp.VueUI), an
**unofficial** Vue UI for the [ABP Framework](https://abp.io).

```bash
pnpm add @lsw-abpvue/feature-management
```

## What it is

One dialog, opened for whichever provider has features to set — a tenant from the tenant
list, the host itself from the settings page:

```vue
<AbpFeatureManagement
  v-model:visible="open"
  provider-name="T"
  :provider-key="tenant.id"
  :provider-title="tenant.name"
/>
```

It renders the three value types ABP defines — a toggle, a free text box, a selection —
indents each feature by its depth, and refuses to change one that some other provider
set. Switching a toggle on switches on the toggles above it; switching one off switches
off the ones below, because a feature nobody can reach is not a state worth sending.

`Reset to default` deletes this provider's values and lets whatever is above it apply
again. The host's own features are part of the application configuration, so changing
those reloads it.

## The rules, without the dialog

The whole of the above is exported as plain functions, so another feature UI can reuse
them and so they can be tested without a DOM:

```ts
import { changedFeatures, flattenFeatures, setFeatureValue } from '@lsw-abpvue/feature-management';

const features = flattenFeatures(answer.groups ?? []);
const next = setFeatureValue(features, 'Printing.InColour', 'true');
changedFeatures(next); // [{ name: 'Printing', value: 'true' }, ...]
```

## The settings tab

```ts
// main.ts
import { provideFeatureManagementConfig } from '@lsw-abpvue/feature-management/config';

provideFeatureManagementConfig();
```

Adds a `Feature management` tab to `@lsw-abpvue/setting-management`'s page, behind
`FeatureManagement.ManageHostFeatures`. The dialog arrives when the tab is opened.

## Compared with the Angular UI

Same component key, same tab name, same localization keys. What differs:

| Angular | Here |
| --- | --- |
| The toggle cascade reads the group by its display name while the map is keyed by its name, so it silently does nothing | Keyed by name; a parent really does switch on with its child |
| A numeric free text box is a number input with no bounds | The `MinValue` and `MaxValue` the validator states are on the box |
| The rules live inside the component | Exported as pure functions |
| `visible` is an input plus an output plus an internal signal | `v-model:visible` |

Registered in the design documents' `api-parity-map.md`.

## Licence

MIT.
