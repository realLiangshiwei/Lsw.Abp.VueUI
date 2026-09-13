<script setup lang="ts">
import { AbpPermission, inject, useListService } from '@lsw-abpvue/core';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  useAbpForm,
  useValidationMessages,
} from '@lsw-abpvue/theme-shared';
import { computed } from 'vue';
import { IdentityUserService } from '../proxy/volo/abp/identity/identity-user.service.js';
import type { IdentityUserDto } from '../proxy/volo/abp/identity/models.js';
import {
  identityUserCreateDtoValidators,
  identityUserCreateOrUpdateDtoBaseValidators,
} from '../proxy/volo/abp/identity/validators.js';
import { identityUserExtensionValidators } from '../proxy/object-extension-validators.js';
import { AbpIdentityPolicyNames } from '../proxy/policy-names.js';

/**
 * Everything on this page came out of `abpvue proxy add`: the service that fetches, the
 * types it fetches, the rules the two inputs enforce, and the permission name the button
 * is behind. Nothing here was written against the backend's documentation.
 */
const users = inject(IdentityUserService);
const list = useListService({ maxResultCount: 5 });
const source = list.hookToQuery((query, signal) => users.getList(query, { signal }));

const extraOf = (record: IdentityUserDto, name: string) =>
  String(record.extraProperties?.[name] ?? '');

// The validators the backend declared: `userName` is required and capped at 256 by a
// data annotation, and the social security number by an object extension attribute.
// A rule stays in the map of the DTO that declares it, so the two are spread together
// the way the form's own type is composed.
const createValidators = {
  ...identityUserCreateOrUpdateDtoBaseValidators,
  ...identityUserCreateDtoValidators,
};

const form = useAbpForm({
  userName: { value: '', validators: createValidators.userName },
  socialSecurityNumber: {
    value: '',
    validators: identityUserExtensionValidators.SocialSecurityNumber,
  },
});

const messages = useValidationMessages();
const errorsFor = (name: keyof typeof form.controls) =>
  computed(() => (form.controls[name].touched ? messages(form.controls[name].errors) : []));

const userNameErrors = errorsFor('userName');
const socialSecurityNumberErrors = errorsFor('socialSecurityNumber');
</script>

<template>
  <div class="abp-users">
    <h1>Users</h1>
    <p class="text-body-secondary">
      Fetched through the generated <code>IdentityUserService</code>, from the backend the proxy was
      generated against.
    </p>

    <p v-if="source.error.value" class="alert alert-warning">
      The request failed. The backend at the configured URL has to be running, and you have to be
      signed in as someone with <code>{{ AbpIdentityPolicyNames.Users }}</code
      >.
    </p>

    <table v-else class="table align-middle">
      <thead>
        <tr>
          <th scope="col">User name</th>
          <th scope="col">Email</th>
          <th scope="col">Active</th>
          <th scope="col">Social security number</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in source.items.value" :key="user.id">
          <td>{{ user.userName }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.isActive ? 'yes' : 'no' }}</td>
          <td>{{ extraOf(user, 'SocialSecurityNumber') }}</td>
        </tr>
      </tbody>
    </table>

    <p class="text-body-secondary">{{ source.totalCount.value }} in total, five at a time.</p>

    <AbpPermission :policy="AbpIdentityPolicyNames.UsersCreate">
      <fieldset class="abp-users__form">
        <legend class="h5">What the backend already says about a new user</legend>
        <p class="text-body-secondary">
          Both rules are generated: the first from a data annotation on
          <code>IdentityUserCreateDto</code>, the second from an object extension attribute. Neither
          was written here.
        </p>

        <AbpFormField label="User name" :errors="userNameErrors">
          <AbpInput
            v-model="form.controls.userName.value"
            @blur="form.controls.userName.markAsTouched()"
          />
        </AbpFormField>

        <AbpFormField label="Social security number" :errors="socialSecurityNumberErrors">
          <AbpInput
            v-model="form.controls.socialSecurityNumber.value"
            @blur="form.controls.socialSecurityNumber.markAsTouched()"
          />
        </AbpFormField>

        <AbpButton :disabled="form.invalid">Save</AbpButton>
      </fieldset>
    </AbpPermission>
  </div>
</template>

<style scoped>
.abp-users__form {
  max-width: 32rem;
  margin-top: 2rem;
}
</style>
