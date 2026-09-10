<script setup lang="ts">
import { AbpPage } from '@lsw-abpvue/components';
</script>

<template>
  <!-- What a host replaces the whole page with. Registering it takes one line; the
       module's routes and its extension points are untouched. -->
  <AbpPage title="AbpIdentity::Users">
    <div class="alert alert-info mb-0">
      This page comes from the host application. The module's own page is still registered as the
      default; the replacement simply won.
    </div>
  </AbpPage>
</template>
