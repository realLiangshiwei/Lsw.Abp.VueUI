# Automatic imports

The application template uses `unplugin-auto-import` and `unplugin-vue-components` to insert imports for the APIs and components a page actually uses. Unused exports are not imported.

## What is included

The preset in `abp-auto-imports.ts` covers common Vue, Vue Router, core, components and theme-shared APIs. It also resolves `Abp*` components from their public packages.

```vue
<template>
  <AbpButton @click="count++">{{ count }}</AbpButton>
</template>

<script setup lang="ts">
const count = ref(0);
</script>
```

This requires the template's Vite configuration. In a library or a project without that configuration, write explicit imports.

## Injection names

`inject` remains Vue's native injection function. ABP injection is exposed as `injectAbp` to prevent ambiguity:

```ts
const rest = injectAbp(RestService);
```

Business service and DTO imports stay explicit. The preset does not scan every npm package or automatically import your generated proxy.

## Type declarations and disabling

The plugins write `auto-imports.d.ts` and `components.d.ts`; restart Vite after changing the preset. Keep those declarations in the TypeScript project. They are generated output, so edit the preset rather than their contents.

Set `abpVue.autoImports` to `false` in `package.json` to disable the template preset. `abpv generate --no-auto-imports` writes explicit common imports for a generated page. CSS imports remain explicit in `main.ts`.
