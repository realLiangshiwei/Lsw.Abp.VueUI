<template>
  <span class="abp-http-request" style="overflow-wrap: anywhere">
    <span class="badge me-1" :class="httpStatusClass(record.httpStatusCode)">{{
      record.httpStatusCode
    }}</span>
    <span class="badge me-1" :class="httpMethodClass(record.httpMethod)">{{
      record.httpMethod
    }}</span>
    {{ record.url }}
  </span>
</template>
<script setup lang="ts">
import type { AuditLogDto } from '@lsw-abpvue/audit-logging/proxy';
import { httpMethodClass, httpStatusClass } from '../constants/http.js';
defineProps<{ record: AuditLogDto }>();
</script>
