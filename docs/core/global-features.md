# Global features

Global features enable a capability for the whole backend solution. They are separate from tenant feature values and user permissions.

## Read the enabled set

~~~ts
import { computed } from 'vue';
import { useFeature, usePermission } from '@lsw-abpvue/core';

const features = useFeature();
const permissions = usePermission();
const globallyEnabled = features.isGlobalEnabled('BookStore.Printing');
const tenantEnabled = features.isEnabled('BookStore.Printing');
const canPrint = computed(() =>
  globallyEnabled.value &&
  tenantEnabled.value &&
  permissions.isGranted('BookStore.Books.Print'),
);
~~~

The names are examples: use global feature, tenant feature and policy names actually exposed by your backend. They need not share a name. Add these conditions only when your business capability requires all three.

`isGlobalEnabled(name)` returns `ComputedRef<boolean>` and checks membership of `application-configuration.globalFeatures.enabledFeatures`. A missing name returns false. It does not fetch a new endpoint or convert a tenant feature string.

## Global feature, tenant feature and permission

| Mechanism | Backend source | Purpose |
| --- | --- | --- |
| Global feature | `globalFeatures.enabledFeatures` | Whether the solution offers a capability |
| Tenant feature | `features.values` | Whether the current tenant has access or a quota |
| Permission | `auth.grantedPolicies` | Whether the current user may perform an action |

The regular feature service also supports string quotas; `isEnabled` is intended for boolean values. A global feature is membership in an enabled set, not a quota.

## Display controls

Use `v-if="canPrint"` in a component, or combine the conditions in a contributed action's `visible` predicate. `requiredPolicy` and action `permission` only evaluate policies; do not put feature names into policy expressions.

Global enablement is controlled in the backend solution. There is no frontend switch that can enable a disabled global feature. After a backend change, reload application configuration using `ConfigStateService.refreshAppState()`. Backend authorization and feature checks remain required for API calls.

## Diagnose an unexpected false result

Inspect the configuration returned for the same host/tenant and user. Check spelling and case in `enabledFeatures`, then check the tenant value and granted policy independently. If the relevant backend module or global feature is absent, hiding the dependent UI is expected.

See [settings and features](/core/settings-features), [permissions](/concepts/permissions).
