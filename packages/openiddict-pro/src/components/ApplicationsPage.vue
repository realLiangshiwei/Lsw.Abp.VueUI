<template>
  <OpenIddictPage
    :state="state"
    title="AbpOpenIddict::Applications"
    create-title="AbpOpenIddict::NewApplication"
    size="lg"
  >
    <AbpReplaceable
      v-if="permissionsKey"
      v-model:visible="permissionsOpen"
      :replaceable-key="PermissionManagementComponents.PermissionManagement"
      provider-name="C"
      :provider-key="permissionsKey"
      :entity-display-name="permissionsKey"
    >
      <AbpPermissionManagement
        v-model:visible="permissionsOpen"
        provider-name="C"
        :provider-key="permissionsKey"
        :entity-display-name="permissionsKey"
      />
    </AbpReplaceable>
    <TokenLifetimeDialog
      v-if="lifetimeFor"
      :application="lifetimeFor"
      @close="lifetimeFor = undefined"
    />
    <GenerateAccessTokenDialog
      v-if="tokenFor"
      :application="tokenFor"
      @close="tokenFor = undefined"
    />
  </OpenIddictPage>
</template>

<script setup lang="ts">
import { AbpReplaceable, inject } from '@lsw-abpvue/core';
import { OpenIddictProPolicyNames as Policy } from '@lsw-abpvue/openiddict-pro/config';
import {
  ApplicationService,
  ScopeService,
  type CreateApplicationInput,
  type ApplicationDto,
  type ScopeDto,
} from '@lsw-abpvue/openiddict-pro/proxy';
import {
  AbpPermissionManagement,
  PermissionManagementComponents,
} from '@lsw-abpvue/permission-management';
import { computed, ref, shallowRef, watch } from 'vue';
import { OpenIddictProComponents as Keys } from '../enums/components.js';
import { APPLICATIONS_PAGE } from '../tokens/pages.token.js';
import { applicationInput } from '../utils/form-values.js';
import { useOpenIddictPage } from '../utils/use-openiddict-page.js';
import GenerateAccessTokenDialog from './GenerateAccessTokenDialog.vue';
import OpenIddictPage from './OpenIddictPage.vue';
import TokenLifetimeDialog from './TokenLifetimeDialog.vue';

const service = inject(ApplicationService);
const scopeService = inject(ScopeService);
const scopes = shallowRef<ScopeDto[]>([]);
const permissionsKey = ref('');
const permissionsOpen = computed({
  get: () => Boolean(permissionsKey.value),
  set: visible => {
    if (!visible) permissionsKey.value = '';
  },
});
const lifetimeFor = shallowRef<ApplicationDto>();
const tokenFor = shallowRef<ApplicationDto>();
const state: ReturnType<typeof useOpenIddictPage<ApplicationDto, CreateApplicationInput>> =
  useOpenIddictPage({
    key: Keys.Applications,
    policy: Policy.Application,
    service,
    name: record => record.clientId ?? '',
    deletionMessage: 'AbpOpenIddict::ApplicationDeletionWarningMessage',
    input: applicationInput,
    load: async signal => {
      const result = await scopeService.getAllScopes({ signal });
      if (!signal.aborted) scopes.value = result;
    },
    initialize: (form, record) => {
      if (!record) return;
      form.form.patch({
        ...Object.fromEntries(
          (['extensionGrantTypes', 'redirectUris', 'postLogoutRedirectUris'] as const).map(name => [
            name,
            record[name]?.join('\n') ?? '',
          ]),
        ),
        clientSecret: '',
        clientAuthMethod: record.jsonWebKeySet?.trim() ? 'jwks' : 'secret',
      });
    },
    providers: [
      {
        provide: APPLICATIONS_PAGE,
        useValue: {
          add: () => state.show(),
          edit: (record: ApplicationDto) => state.show(record),
          remove: (record: ApplicationDto) => state.remove(record),
          values: computed(() => state.form.value?.form.value ?? {}),
          scopes: computed(() => scopes.value),
          permissions: (record: ApplicationDto) => {
            if (
              !state.allowed.value ||
              !state.permission.isGranted(Policy.ApplicationManagePermissions) ||
              !record.clientId
            )
              return;
            permissionsKey.value = record.clientId;
          },
          tokenLifetime: (record: ApplicationDto) => {
            if (state.allowed.value && state.permission.isGranted(Policy.ApplicationUpdate))
              lifetimeFor.value = record;
          },
          generateAccessToken: (record: ApplicationDto) => {
            if (
              state.allowed.value &&
              state.permission.isGranted(Policy.ApplicationGenerateAccessToken) &&
              record.clientType === 'confidential' &&
              record.allowClientCredentialsFlow
            )
              tokenFor.value = record;
          },
        },
      },
    ],
  });

watch(
  () => state.form.value?.form.value,
  (next, previous) => {
    const form = state.form.value?.form;
    if (!form || !next) return;
    if (next.clientType === 'public' && next.clientType !== previous?.clientType) {
      form.patch({
        allowClientCredentialsFlow: false,
        clientSecret: '',
        jsonWebKeySet: '',
        clientAuthMethod: 'secret',
      });
    }
    if (next.forcePushedAuthorization === true && next.allowPushedAuthorizationEndpoint !== true)
      form.get('allowPushedAuthorizationEndpoint')?.patch(true);
  },
  { flush: 'sync' },
);

watch(
  state.context,
  () => {
    permissionsKey.value = '';
    lifetimeFor.value = undefined;
    tokenFor.value = undefined;
    scopes.value = [];
  },
  { flush: 'sync' },
);
</script>
