# Feature management

Edits features for a backend provider, including tenant features opened from tenant management.

## Install and use

```bash
pnpm add @lsw-abpvue/feature-management
```

```vue
<AbpFeatureManagement v-model:visible="open" provider-name="T" :provider-key="tenant.id" />
```

Import the component from the package. Supply a local visibility value and provider key. A tenant uses provider `T`; other provider names require backend support. There is no independent feature route. `provideFeatureManagementConfig()` from `/config` contributes feature management to settings; register it after setting-management config when using that integration.

## Values and permissions

Boolean features use toggles, selection features use backend-declared options, and free-text features use inputs with supported validation. Numeric constraints use backend bounds. The caller must have the management policy required by the selected provider; tenant actions use `AbpTenantManagement.Tenants.ManageFeatures`.

## Cascade and save

Turning a parent off disables its descendants; turning it back on restores the prior child values. Only changed values are sent. Saving failures preserve edits, and unsaved cancellation follows the modal contract.

Effective features read through core's `FeatureService` are separate from these editable provider values. Reload session configuration after a custom save that changes current effective values. The component key is `FeatureManagement.FeatureManagementComponent`.
