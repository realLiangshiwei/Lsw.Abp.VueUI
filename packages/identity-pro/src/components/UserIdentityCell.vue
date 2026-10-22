<template>
  <span>
    <template v-if="prop.name === 'userName'">
      <i
        v-if="isUserLockedOut(record)"
        class="bi bi-lock text-danger me-1"
        :title="$t('AbpIdentity::ThisUserIsLockedOutMessage')"
      />
      <i
        v-if="!record.isActive"
        class="bi bi-slash-circle text-danger me-1"
        :title="$t('AbpIdentity::ThisUserIsNotActiveMessage')"
      />
      <span :class="{ 'text-body-secondary': isUserLockedOut(record) || !record.isActive }">{{
        record.userName
      }}</span>
    </template>
    <template v-else>
      {{ prop.name === 'email' ? record.email : record.phoneNumber }}
      <i
        v-if="prop.name === 'email' ? record.emailConfirmed : record.phoneNumberConfirmed"
        class="bi bi-check text-success ms-1"
        :aria-label="
          $t(
            prop.name === 'email'
              ? 'AbpIdentity::DisplayName:EmailConfirmed'
              : 'AbpIdentity::DisplayName:PhoneNumberConfirmed',
          )
        "
      />
    </template>
  </span>
</template>

<script setup lang="ts">
import type { EntityProp } from '@lsw-abpvue/components';
import type { IdentityUserDto } from '@lsw-abpvue/identity-pro/proxy';
import { isUserLockedOut } from '../utils/user-operation-policy.js';

defineProps<{ record: IdentityUserDto; prop: EntityProp<IdentityUserDto> }>();
</script>
