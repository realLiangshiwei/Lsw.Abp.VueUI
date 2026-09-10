<script setup lang="ts">
import { useReplaceableComponents } from '@lsw-abpvue/core';
import { AbpButton } from '@lsw-abpvue/theme-shared';
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import MyUsersPage from '../extensions/MyUsersPage.vue';
import { IdentityComponents, UsersPage } from '../modules/identity-demo';

const replaceable = useReplaceableComponents();
const replaced = ref(false);

/** Registering a component under a page's key is the coarsest extension point there is. */
function replacePage(replace: boolean): void {
  replaceable.add({
    key: IdentityComponents.Users,
    component: replace ? MyUsersPage : UsersPage,
  });
  replaced.value = replace;
}

const report = ref('');

/** Development only, and it is the answer to "my contributor did nothing". */
function inspect(): void {
  const inspector = globalThis.__abpvue;
  if (!inspector) {
    // It installs itself the first time an extensible component is set up.
    report.value = 'Open the users page once, then come back.';
    return;
  }

  inspector.inspect();
  report.value = JSON.stringify(inspector.dump(IdentityComponents.Users), null, 2);
}
</script>

<template>
  <section class="card mb-3">
    <div class="card-body">
      <h2 class="h5">Extensions</h2>
      <p class="mb-2">
        The
        <RouterLink to="/extensions">users page</RouterLink>
        belongs to a module. Everything the host adds to it -- a column, a form field, a row button,
        a toolbar button, and a field taken off the edit form -- is in
        <code>src/extensions/user-contributors.ts</code>, and the module knows nothing about it.
        What the backend's own <code>objectExtensions</code> declare shows up there too, with
        nothing written for it at all.
      </p>

      <div class="d-flex flex-wrap gap-2">
        <AbpButton
          v-if="!replaced"
          variant="secondary"
          outline
          size="sm"
          @click="replacePage(true)"
        >
          Replace the page
        </AbpButton>
        <AbpButton v-else variant="secondary" outline size="sm" @click="replacePage(false)">
          Restore the module's page
        </AbpButton>

        <AbpButton variant="secondary" outline size="sm" @click="inspect">
          Inspect the extension points
        </AbpButton>
      </div>

      <pre v-if="report" class="mt-3 mb-0 small">{{ report }}</pre>
    </div>
  </section>
</template>
