<template>
  <AbpPermission policy="BookStore.Books.Create">
    <button type="button">Create book</button>
  </AbpPermission>
</template>

<script setup lang="ts">
import { AbpPermission } from '@lsw-abpvue/core';
</script>
