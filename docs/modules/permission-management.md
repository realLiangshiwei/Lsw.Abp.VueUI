# Permission management

A dialog for permissions provided by the backend. Identity opens it for users and roles; another page can open it for a supported provider.

## Install and use

```bash
pnpm add @lsw-abpvue/permission-management@alpha
```

```vue
<AbpPermissionManagement
  v-model:visible="open"
  provider-name="R"
  :provider-key="role.name"
  :entity-display-name="role.name"
/>
```

Import `AbpPermissionManagement` from the package unless your resolver covers it. Supply the local boolean `open` and role record. There is no independent page route or startup menu provider for this dialog.

## Providers and authorization

ABP provider names include `R` for roles, `U` for users and `C` for clients. The provider key is the backend's identifier for that provider: role name for `R`, user id for `U`. Confirm that the corresponding backend grant provider is installed and the caller has the provider-specific management permission.

## Editing behavior

The dialog shows groups, hierarchical permissions and grants from other providers. A user grant inherited through a role is displayed as granted and disabled. Granting a child also grants its parent; revoking a parent revokes its descendants. Search narrows the display without discarding the current edit state.

Only changes from the initial state are sent. Saving failures keep edits, and Cancel uses the modal's unsaved-change confirmation. Public grant utilities and service DTOs are listed in the [API reference](/api/permission-management). The replaceable key is `PermissionManagement.PermissionManagementComponent`.
