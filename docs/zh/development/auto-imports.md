# 自动按需导入

应用模板使用 `unplugin-auto-import` 和 `unplugin-vue-components`，只为页面实际使用的 API 和组件插入导入。未使用的导出不会被导入。

## 包含范围

`abp-auto-imports.ts` 的预设包含常用 Vue、Vue Router、core、components 和 theme-shared API，同时从公共包入口解析 `Abp*` 组件。

```vue
<template>
  <AbpButton @click="count++">{{ count }}</AbpButton>
</template>

<script setup lang="ts">
const count = ref(0);
</script>
```

这依赖模板中的 Vite 配置。在组件库或未配置插件的项目中，需要显式导入。

## 注入函数命名

`inject` 保留为 Vue 原生注入函数，ABP 注入使用 `injectAbp`，避免同名混淆：

```ts
const rest = injectAbp(RestService);
```

业务服务和 DTO 仍然显式导入。预设不会扫描所有 npm 包，也不会自动导入应用生成的代理。

## 类型声明与关闭方式

插件会生成 `auto-imports.d.ts`、`components.d.ts`。修改预设后重启 Vite，并将声明文件包含在 TypeScript 项目中。它们属于生成结果，应修改预设而不是手工修改声明。

在 `package.json` 中将 `abpVue.autoImports` 设置为 `false`，可关闭模板预设。`abpv generate --no-auto-imports` 会为生成页面写出完整的常用 API 导入。CSS 仍在 `main.ts` 中显式导入。
