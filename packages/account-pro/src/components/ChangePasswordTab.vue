<template>
  <ChangePasswordTab
    ><template #password-strength="field"><PasswordStrength :password="field.password" /></template
  ></ChangePasswordTab>
</template>
<script setup lang="ts">
import { ChangePasswordTab } from '@lsw-abpvue/account';
import PasswordStrength from './PasswordStrength.vue';
</script>
