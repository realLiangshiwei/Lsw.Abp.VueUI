# Profile and settings tabs

Use a contributed tab when a module needs another panel in the local profile or settings page. Each panel is a Vue component with its own loading, validation and save workflow.

## Add both components

Create `src/components/ContactProfileTab.vue`. This example uses the real Account profile proxy to edit the phone number. It preserves the other profile values, extra properties and concurrency stamp rather than replacing the profile with a partial body.

<<< ../examples/ContactProfileTab.vue

Create `src/components/PrintingTab.vue`. Use the complete PrintingSettingsAppService from [the backend examples](/tutorials/backend-examples). It implements GET/PUT `/api/app/printing-settings`, accepts/returns `{ copies: number }`, persists a per-user setting and requires `AbpIdentity.Users` for this walkthrough. These are sample application endpoints, not built-in setting-management endpoints.

<<< ../examples/PrintingTab.vue

A failed load disables Save and exposes Retry. A failed save keeps the entered value and field errors. An abort signal ends requests when the panel unmounts.

## Register the panels

Create `src/custom-tabs.ts`, adjusting the two imports to the components directory:

<<< ../examples/custom-tabs.ts

Add `customTabs` to your existing startup providers after the selected modules' configuration and default-tab registrations. Keep `provideAccountConfig()` after OAuth for a local My account destination, `provideManageProfileTabs()` from account for the personal/password defaults, and `provideSettingManagementConfig()` for settings. Keep their existing account and setting-management lazy routes. Registering a tab does not create a route or install a backend endpoint.

Add `BookStore::Contact` and `BookStore::Printing` to the application's localization resources. Open `/account/manage` or `/setting-management` and select the new tab.

## Stable identity, order and permission

| Property | Purpose |
| --- | --- |
| `name` | Stable identity, default localization key |
| `text` | Required on profile tabs; optional label override on settings tabs |
| `component` | Panel to mount when selected |
| `order` | Sort order, default zero |
| `requiredPolicy` | Permission required to see the panel |
| `visible` / `invisible` | Additional condition / explicit hide flag |
| `parentName` | Parent group identity when grouping |

Patch with `tabs.patch(name, { order: 10 })`; remove with `tabs.remove([name])`. Removal also removes descendants. Keep the name stable when changing text. A hidden tab does not remove backend capabilities: its endpoint still enforces authorization.

## Refresh and unsaved state

The profile example writes the returned profile into `ManageProfileStateService`, so other panels see the latest shared profile. Refresh application configuration after saving an effective setting or current-user field that other UI reads. Saving a setting override and reading its effective value are different requests; retain a clear error if refresh fails after the save succeeded.

Switching panels may unmount their components. Page/tab navigation is not automatically protected by a modal's dirty-close guard. For a panel requiring unsaved-change confirmation, implement a page navigation policy or edit inside a guarded modal rather than claiming the tab list saves it automatically.

## Scope and verification

These contributions affect the local pages. They do not modify `/Account/Manage` rendered by a separate authorization server. Check the actual My account provider and destination.

Test first load, load failure/retry, invalid copies, save failure, denied policy, reopen after save, another tab observing updated profile, and tenant-specific effective settings. See [authentication](/guide/authentication), [forms](/utilities/forms) and [settings](/core/settings-features).
