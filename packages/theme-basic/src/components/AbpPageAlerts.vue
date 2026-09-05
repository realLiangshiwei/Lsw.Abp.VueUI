<script setup lang="ts">
import { useLocalization } from '@lsw-abpvue/core';
import { usePageAlert } from '@lsw-abpvue/theme-shared';

const alerts = usePageAlert();
const localization = useLocalization();

const ALERT_CLASS = {
  neutral: 'alert-secondary',
  info: 'alert-info',
  success: 'alert-success',
  warning: 'alert-warning',
  error: 'alert-danger',
} as const;
</script>

<template>
  <div class="abp-page-alerts">
    <div
      v-for="alert in alerts.alerts.value"
      :key="alert.id"
      class="alert d-flex align-items-start gap-2"
      :class="[
        ALERT_CLASS[alert.severity ?? 'neutral'],
        alert.dismissible ? 'alert-dismissible' : null,
      ]"
      role="alert"
    >
      <div>
        <strong v-if="alert.title" class="d-block">
          {{ localization.t(alert.title, ...(alert.titleLocalizationParams ?? [])) }}
        </strong>
        {{ localization.t(alert.message, ...(alert.messageLocalizationParams ?? [])) }}
      </div>

      <button
        v-if="alert.dismissible"
        type="button"
        class="btn-close ms-auto"
        :aria-label="$t('AbpUi::Close')"
        @click="alerts.remove(alert.id)"
      />
    </div>
  </div>
</template>
