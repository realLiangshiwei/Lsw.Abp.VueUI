---
layout: home

hero:
  name: ABP Vue UI
  text: An unofficial Vue UI for the ABP Framework
  tagline: The Angular UI's features and extension points, taken down the Vue-native path. No backend changes.
  actions:
    - theme: brand
      text: Get started
      link: /guide/what-is-this
    - theme: alt
      text: Coming from Angular?
      link: /migration/from-angular
    - theme: alt
      text: View on GitHub
      link: https://github.com/realLiangshiwei/Lsw.Abp.VueUI

features:
  - title: Zero backend changes
    details: >
      Four framework endpoints and the modules' own, exactly as ABP already serves them.
      Nothing to install on the server, nothing to configure beyond a CORS origin.
  - title: The extension system, in full
    details: >
      Entity props, form props, entity actions, toolbar actions and object extensions,
      under ABP's own component keys — so a configuration written for the Angular UI
      moves over as it is.
  - title: A CRUD page in seventy lines
    details: >
      `abpv generate Book` reads the entity off api-definition and writes the page. Paging,
      sorting, validation and the permission checks belong to the framework, not to your
      page.
  - title: Typed proxies from the backend
    details: >
      `abpv proxy add` turns api-definition into DTOs, services, validator maps and
      permission-name constants. A misspelled permission stops compiling.
  - title: Themes that owe nothing to a UI library
    details: >
      The contract layer has no UI dependency at all. `theme-basic` is reka-ui and
      Bootstrap; a theme built on Web Components would satisfy the same twelve contracts.
  - title: Your source when you want it
    details: >
      `abpv add-package --with-source-code` puts a module's UI in your repository, with not
      one import in your application changed.
---

## Install

```bash
# a whole solution: the backend by the official ABP CLI, the frontend by this one
npx @lsw-abpvue/cli new Acme.BookStore

# or add a Vue UI to a solution you already have
npx @lsw-abpvue/cli switch-ui
```

## What it looks like

```vue
<script setup lang="ts">
import { AbpExtensibleTable, AbpPage, useRecordEditor } from '@lsw-abpvue/components';
import { inject, useListService } from '@lsw-abpvue/core';
import { BookService } from '../proxy/acme/book-store/books';

const books = inject(BookService);
const list = useListService();
const { items } = list.hookToQuery(query => books.getList(query));
</script>

<template>
  <AbpPage title="BookStore::Menu:Books">
    <AbpExtensibleTable :data="items" :list="list" record-key="id" />
  </AbpPage>
</template>
```

The columns come from the extension system: the ones your page declares, the ones the
backend's `ObjectExtensions` add, and the ones another package contributed.

## Status

Pre-1.0 and moving. The packages are on their own `0.x` series; version numbers line up
with ABP's at 1.0. What is here now covers the six open source module UIs, the theme
layer, authentication and multi-tenancy, the proxy generator and the CLI.

Unofficial and not affiliated with Volosoft. MIT licensed.
