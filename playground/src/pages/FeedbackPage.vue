<script setup lang="ts">
import { AbpHttpError, useHttpErrorReporter, type AbpHttpErrorInit } from '@lsw-abpvue/core';
import {
  AbpButton,
  ConfirmationStatus,
  useConfirmation,
  usePageAlert,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { ref } from 'vue';

const toaster = useToaster();
const confirmation = useConfirmation();
const alerts = usePageAlert();
const reporter = useHttpErrorReporter();

const answer = ref('');

async function ask(): Promise<void> {
  const status = await confirmation.warn('Delete this user?', 'Are you sure?');
  answer.value = status;

  if (status === ConfirmationStatus.confirm) toaster.success('Deleted.');
}

/**
 * The five failures of the milestone's acceptance list, each reported the way a real
 * request would report it, so the handler chain decides what is shown.
 */
const FAILURES: Record<string, Omit<AbpHttpErrorInit, 'statusText' | 'method' | 'url'>> = {
  '401': { status: 401 },
  '403': { status: 403 },
  '404': { status: 404 },
  '500': { status: 500 },
  validation: {
    status: 400,
    error: {
      message: 'Your request is not valid!',
      validationErrors: [{ message: 'That name is taken.', members: ['userName'] }],
    },
  },
  envelope: {
    status: 500,
    error: {
      message: 'Volo.Abp.Identity:DuplicateUserName',
      details: 'There is already a user with the name "admin".',
    },
  },
};

function fail(kind: string): void {
  reporter.reportError(
    new AbpHttpError({
      statusText: '',
      method: 'POST',
      url: '/api/identity/users',
      status: 500,
      ...FAILURES[kind],
    }),
  );
}
</script>

<template>
  <h1 class="h4 mb-3">Feedback and failures</h1>

  <section class="mb-4">
    <h2 class="h6">Toasts</h2>
    <div class="d-flex flex-wrap gap-2">
      <AbpButton variant="success" @click="toaster.success('Saved.')">Success</AbpButton>
      <AbpButton variant="info" @click="toaster.info('Nothing to do.')">Info</AbpButton>
      <AbpButton variant="warning" @click="toaster.warn('Careful.')">Warning</AbpButton>
      <AbpButton variant="danger" @click="toaster.error('That did not work.')">Error</AbpButton>
      <AbpButton
        variant="secondary"
        @click="toaster.info('This one stays.', undefined, { sticky: true })"
      >
        Sticky
      </AbpButton>
    </div>
  </section>

  <section class="mb-4">
    <h2 class="h6">Confirmation</h2>
    <AbpButton variant="danger" @click="ask">Delete something</AbpButton>
    <p v-if="answer" class="mt-2 mb-0 text-body-secondary">You answered: {{ answer }}</p>
  </section>

  <section class="mb-4">
    <h2 class="h6">Page alerts</h2>
    <div class="d-flex flex-wrap gap-2">
      <AbpButton
        variant="secondary"
        @click="alerts.show({ severity: 'warning', message: 'Your licence expires in 3 days.' })"
      >
        Add one
      </AbpButton>
      <AbpButton variant="secondary" @click="alerts.clear()">Clear</AbpButton>
    </div>
  </section>

  <section>
    <h2 class="h6">Failed requests</h2>
    <p class="text-body-secondary">
      Each of these goes through the handler chain, which decides between the login page, a toast, a
      dialog and the error page.
    </p>
    <div class="d-flex flex-wrap gap-2">
      <AbpButton
        v-for="kind in Object.keys(FAILURES)"
        :key="kind"
        variant="secondary"
        outline
        @click="fail(kind)"
      >
        {{ kind }}
      </AbpButton>
    </div>
  </section>
</template>
