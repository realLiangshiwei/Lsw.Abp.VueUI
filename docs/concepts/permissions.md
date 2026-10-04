# Permissions

Permission checks read `auth.grantedPolicies` from application configuration. They control the interface; backend authorization still decides whether a request succeeds.

## Snapshot and reactive checks

~~~ts
import { usePermission } from '@lsw-abpvue/core';
import { IdentityPolicyNames } from '@lsw-abpvue/identity/config';

const permission = usePermission();
const canCreateNow = permission.isGranted(IdentityPolicyNames.UsersCreate);
const canCreate = permission.isGrantedRef(IdentityPolicyNames.UsersCreate);
~~~

`isGranted` returns a boolean for that call. `isGrantedRef` returns a computed ref that changes when policies or its reactive input change. Use the reactive form for buttons and other UI that must follow a session refresh.

## Render a permitted action

<<< ../examples/PermissionButton.vue

`AbpPermission` renders its content only when the policy is granted. Import it explicitly in a reusable component; the generated application preset also supports automatic imports. The click handler and its busy state remain the page's responsibility.

[Test this component](/development/testing#test-a-reactive-permission) by starting without the policy and then granting it.

## Expressions

Use actual, case-sensitive backend names:

~~~text
AbpIdentity.Users.Create || AbpIdentity.Users.Update
(AbpIdentity.Users.Create || AbpIdentity.Users.Update) && AbpIdentity.Users
~~~

`&&` binds more tightly than `||`; parentheses group a condition. An absent or empty policy means no additional restriction. An unknown policy or invalid expression is denied. Invalid expressions produce a development diagnostic.

## Routes and menus

Add `meta.requiredPolicy` to a protected route:

~~~ts
const route = {
  path: '/identity/users',
  component: () => import('../pages/UsersPage.vue'),
  meta: { requiredPolicy: IdentityPolicyNames.Users },
};
~~~

The registered router guards enforce the requirement and navigation filters use the corresponding policy. A group with no visible children is hidden. Register routing through `provideAbpRouter` so guards are installed; declaring route metadata alone does not initialize the framework.

For an application list with plain `RowAction` callbacks, filter actions by policy before passing them to `AbpGridActions`. Reusable module contributors can specify their action's permission. See [row actions](/customization/entity-actions).

## Names and changes

Built-in modules expose policy constants from their configuration entries. Your generated proxies expose the names described by your backend. Optional `AbpKnownPolicyName` augmentation can narrow policy strings; without it, ordinary strings remain accepted.

A role or user grant changes on the server. Refresh the effective current session through `ConfigStateService.refreshAppState()` when needed; merely hiding a button does not revoke a grant. If a request returns 403 after the interface showed an action, check current tenant, user, policy and session configuration.

The [permission management dialog](/modules/permission-management) manages provider grants. `R`, `U` and `C` identify role, user and client providers where supported by the backend.
