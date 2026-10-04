# Settings and features

Settings describe effective application/user/tenant preferences. Features describe enabled capabilities or quotas. These reading services consume application configuration; they do not persist changes.

## Read reactive values

~~~ts
import { computed } from 'vue';
import { useFeature, useSetting } from '@lsw-abpvue/core';

const settings = useSetting();
const features = useFeature();
const culture = settings.get('Abp.Localization.DefaultLanguage');
const printingEnabled = features.isEnabled('BookStore.Printing');
const quota = features.get('BookStore.PrintingQuota');
const remainingQuota = computed(() => {
  if (quota.value === undefined) return undefined;
  const parsed = Number(quota.value);
  return Number.isFinite(parsed) ? parsed : undefined;
});
~~~

The BookStore feature names are examples that require backend definitions. Returned values are ComputedRefs: use `.value` in script and direct bindings in templates.

## Methods and conversion

| API | Return | Conversion |
| --- | --- | --- |
| `settings.get(name)` | `ComputedRef<string \| undefined>` | Effective raw string |
| `settings.getBoolean(name)` | `ComputedRef<boolean>` | Case-insensitive string `true`; otherwise false |
| `settings.getAll(keyword?)` | `ComputedRef<Record<string, string>>` | Case-sensitive key substring filter |
| `features.get(name)` | `ComputedRef<string \| undefined>` | Effective raw string |
| `features.isEnabled(name)` | `ComputedRef<boolean>` | Case-insensitive string `true`; otherwise false |
| `features.isGlobalEnabled(name)` | `ComputedRef<boolean>` | Membership in the global enabled set |

Do not call `Boolean(quota.value)` to interpret a backend boolean string: `"false"` is a truthy JavaScript string. A quota of `"0"` is different from a missing definition. Model special values such as unlimited according to your backend feature contract rather than guessing a numeric conversion.

## Combine with permissions

~~~ts
import { computed } from 'vue';
import { useFeature, usePermission } from '@lsw-abpvue/core';

const features = useFeature();
const permissions = usePermission();
const enabled = features.isEnabled('BookStore.Printing');
const showPrint = computed(() =>
  enabled.value && permissions.isGranted('BookStore.Books.Print'),
);
~~~

Bind `v-if="showPrint"` to the control. A granted permission does not enable a tenant feature, and an enabled feature does not grant permission. [Global features](/core/global-features) adds the solution-level condition when relevant.

## Save and refresh

Use the [setting-management](/modules/setting-management) or [feature-management](/modules/feature-management) module for their supported backend operations. For business-specific settings, call your own generated service.

After a custom save that changes this session's effective values, call `ConfigStateService.refreshAppState()` and await it. Reading an existing ComputedRef then yields updated values. The reading service does not provide `set` or silently change backend scope.

Setting a tenant's feature as a host administrator is different from modifying the active user's effective feature values. Refresh the session whose displayed configuration actually changed.

## Diagnose

Inspect `setting.values` and `features.values` in the application's configuration response for the same session. Confirm backend definitions, provider/scope and name spelling. A missing value stays undefined; a missing boolean check is false.

Use your backend's actual setting and feature names. They are case-sensitive keys, independent of translated display labels.
