# Permissions

`grantedPolicies` arrives in the application configuration, and everything else reads it.

```ts
const permission = inject(PermissionService);

permission.isGranted('Identity.Users.Create');        // boolean
permission.isGranted('A || B');                      // policy expressions too
permission.isGrantedRef(() => policy);               // ComputedRef<boolean>
```

## In a template

```vue
<AbpPermission policy="Identity.Users.Create">
  <AbpButton @click="add">{{ $t('AbpIdentity::NewUser') }}</AbpButton>
</AbpPermission>
```

A component rather than a directive: Vue's directives cannot remove the element they are
on, and rendering a button that does nothing is worse than not rendering it.

`usePermission()` is the same check in `setup()`.

## Policy expressions

ABP's `||` and `&&` are supported, and so are parentheses:

```
Identity.Users.Create || Identity.Users.Update
(A || B) && C
```

The Angular UI returns false for a parenthesised expression — its own source carries a
`TODO` about it. This is a recursive descent parser, and what it accepts is a superset of
what Angular does, so no configuration written for Angular breaks here.

## On routes

```ts
{
  path: 'users',
  meta: { requiredPolicy: IdentityPolicyNames.Users },
}
```

The guard sends an unauthorized visitor away, and `RoutesService` leaves the entry out of
the menu — the same name doing both jobs.

## Names that cannot be misspelled

The proxy generator writes the permission names as constants, and merging its union into
core turns a typo into a compile error:

```ts
declare module '@lsw-abpvue/core' {
  interface AbpKnownPolicyName extends Record<AbpIdentityPolicyName, true> {}
}
```

Merging nothing keeps `isGranted` taking any string, so this is opt-in per application.

## Granting them

The permission management UI is a package of its own:

```vue
<AbpPermissionManagement
  v-model:visible="open"
  provider-name="R"
  :provider-key="role.name"
  :entity-display-name="role.name"
/>
```

Provider names are ABP's: `R` for a role, `U` for a user, `C` for a client.
