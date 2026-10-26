<template>
  <OpenIddictPage
    :state="state"
    title="AbpOpenIddict::Scopes"
    create-title="AbpOpenIddict::NewScope"
  />
</template>

<script setup lang="ts">
import { inject } from '@lsw-abpvue/core';
import { OpenIddictProPolicyNames as Policy } from '@lsw-abpvue/openiddict-pro/config';
import {
  ScopeService,
  type CreateScopeInput,
  type ScopeDto,
} from '@lsw-abpvue/openiddict-pro/proxy';
import { OpenIddictProComponents as Keys } from '../enums/components.js';
import { SCOPES_PAGE } from '../tokens/pages.token.js';
import { scopeInput } from '../utils/form-values.js';
import { useOpenIddictPage } from '../utils/use-openiddict-page.js';
import OpenIddictPage from './OpenIddictPage.vue';

const state: ReturnType<typeof useOpenIddictPage<ScopeDto, CreateScopeInput>> = useOpenIddictPage({
  key: Keys.Scopes,
  policy: Policy.Scope,
  service: inject(ScopeService),
  name: record => record.name ?? '',
  deletionMessage: 'AbpOpenIddict::ScopeDeletionWarningMessage',
  input: scopeInput,
  initialize: (form, record) => {
    if (record) form.form.patch({ resources: record.resources?.join('\n') ?? '' });
  },
  providers: [
    {
      provide: SCOPES_PAGE,
      useValue: {
        add: () => state.show(),
        edit: (record: ScopeDto) => state.show(record),
        remove: (record: ScopeDto) => state.remove(record),
      },
    },
  ],
});
</script>
