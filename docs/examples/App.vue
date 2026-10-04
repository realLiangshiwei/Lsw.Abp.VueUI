<template>
  <AbpDynamicLayout :default-layout="LayoutType.application">
    <RouterView />
  </AbpDynamicLayout>
</template>

<script setup lang="ts">
import { AbpDynamicLayout } from '@lsw-abpvue/core/router';
import { LayoutType } from '@lsw-abpvue/core';
import { RouterView } from 'vue-router';
</script>
