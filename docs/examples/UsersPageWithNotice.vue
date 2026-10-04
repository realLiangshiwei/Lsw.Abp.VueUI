<template>
  <section>
    <p class="alert alert-info" role="status">{{ localization.t('BookStore::UsersNotice') }}</p>
    <UsersPage />
  </section>
</template>

<script setup lang="ts">
import { useLocalization } from '@lsw-abpvue/core';
import { UsersPage } from '@lsw-abpvue/identity';
const localization = useLocalization();
</script>
