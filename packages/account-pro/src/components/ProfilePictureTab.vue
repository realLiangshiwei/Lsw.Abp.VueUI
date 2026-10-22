<template>
  <div class="abp-profile-picture" style="max-width: 36rem">
    <h2 class="h5">{{ $t('AbpAccount::CurrentProfilePicture') }}</h2>
    <p v-if="failed || imageFailed" role="alert">{{ $t('AbpUi::DefaultErrorMessage') }}</p>
    <AbpButton v-if="failed" :disabled="busy" @click="load">{{ $t('AbpUi::Refresh') }}</AbpButton>
    <img
      v-if="currentSource"
      :src="currentSource"
      :alt="$t('AbpAccount::CurrentProfilePicture')"
      width="150"
      height="150"
      class="rounded"
    />
    <form v-if="loaded" class="mt-3" @submit.prevent="save">
      <fieldset :disabled="busy || needsReload">
        <AbpFormField v-slot="control" :label="$t('AbpAccount::ChoosePhoto')"
          ><AbpSelect :id="control.id" v-model="type" :options="choices"
        /></AbpFormField>
        <p v-if="type === '1'">{{ $t('AbpAccount::Description:UseGravatar') }}</p>
        <template v-if="type === '2'">
          <label :for="fileId">{{ $t('AbpAccount::SelectNewImage') }}</label>
          <input
            :id="fileId"
            type="file"
            name="profilePicture"
            accept="image/png,image/jpeg,image/webp"
            class="form-control"
            @change="selectImage"
          />
          <template v-if="image">
            <canvas
              ref="canvas"
              width="250"
              height="250"
              class="d-block my-3 rounded"
              :aria-label="$t('AbpAccount::SelectNewImage')"
            />
            <label class="d-block"
              >×<input
                v-model.number="zoom"
                class="form-range d-block"
                type="range"
                min="1"
                max="4"
                step="0.05"
            /></label>
            <label class="d-block"
              >X<input
                v-model.number="horizontal"
                class="form-range d-block"
                type="range"
                min="0"
                max="1"
                step="0.01"
            /></label>
            <label class="d-block"
              >Y<input
                v-model.number="vertical"
                class="form-range d-block"
                type="range"
                min="0"
                max="1"
                step="0.01"
            /></label>
          </template>
        </template>
        <AbpButton type="submit" class="mt-3" :disabled="type === '2' && !image" :loading="busy">{{
          $t('AbpAccount::SaveChanges')
        }}</AbpButton>
      </fieldset>
    </form>
  </div>
</template>
<script setup lang="ts">
import { AccountService, ProfilePictureType } from '@lsw-abpvue/account-pro/proxy';
import { ConfigStateService, inject as injectAbp, useLocalization } from '@lsw-abpvue/core';
import {
  AbpButton,
  AbpFormField,
  AbpSelect,
  ConfirmationStatus,
  useConfirmation,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { computed, nextTick, onMounted, onScopeDispose, ref, shallowRef, useId, watch } from 'vue';
import { useAccountOperation } from '../utils/use-account-operation.js';

const service = injectAbp(AccountService);
const config = injectAbp(ConfigStateService);
const localization = useLocalization();
const confirmation = useConfirmation();
const toaster = useToaster();
const { busy, failed, needsReload, run } = useAccountOperation();
const loaded = ref(false);
const currentSource = ref('');
const type = ref('0');
const image = shallowRef<HTMLImageElement>();
const canvas = ref<HTMLCanvasElement>();
const imageFailed = ref(false);
const zoom = ref(1);
const horizontal = ref(0.5);
const vertical = ref(0.5);
const fileId = useId();
let imageRevision = 0;
const choices = computed(() => [
  { value: '0', label: localization.t('AbpAccount::UseDefault') },
  { value: '1', label: localization.t('AbpAccount::DisplayName:UseGravatar') },
  { value: '2', label: localization.t('AbpAccount::UploadFile') },
]);
function load(): Promise<boolean> {
  const id = config.snapshot().currentUser.id;
  if (!id) return Promise.resolve(false);
  return run(
    signal => service.getProfilePicture(id, { signal }),
    value => {
      type.value = String(value.type);
      const content: unknown = value.fileContent;
      currentSource.value =
        value.source ?? (typeof content === 'string' ? `data:image/png;base64,${content}` : '');
      loaded.value = true;
    },
  );
}
async function selectImage(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  const own = ++imageRevision;
  image.value = undefined;
  imageFailed.value = false;
  if (!file) return;
  if (
    !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
    file.size > 10 * 1024 * 1024
  ) {
    imageFailed.value = true;
    return;
  }
  const url = URL.createObjectURL(file);
  try {
    const selected = new Image();
    selected.src = url;
    await selected.decode();
    if (own !== imageRevision) return;
    image.value = selected;
    zoom.value = 1;
    horizontal.value = vertical.value = 0.5;
    await nextTick();
    draw();
  } catch {
    if (own === imageRevision) imageFailed.value = true;
  } finally {
    URL.revokeObjectURL(url);
  }
}
function draw(): void {
  const source = image.value;
  const context = canvas.value?.getContext('2d');
  if (!source || !context) return;
  const size = Math.min(source.naturalWidth, source.naturalHeight) / zoom.value;
  context.clearRect(0, 0, 250, 250);
  context.drawImage(
    source,
    (source.naturalWidth - size) * horizontal.value,
    (source.naturalHeight - size) * vertical.value,
    size,
    size,
    0,
    0,
    250,
    250,
  );
}
async function save(): Promise<void> {
  if (busy.value || needsReload.value) return;
  const selected = Number(type.value) as ProfilePictureType;
  const imageCanvas = canvas.value;
  const imageVersion = imageRevision;
  if (selected === ProfilePictureType.Image && (!image.value || !imageCanvas)) return;
  const subject = `${config.snapshot().currentTenant.id}:${config.snapshot().currentUser.id}`;
  const message =
    selected === ProfilePictureType.Image
      ? 'PPUploadConfirm'
      : selected === ProfilePictureType.Gravatar
        ? 'UseGravatarConfirm'
        : 'NoProfilePictureConfirm';
  if (
    (await confirmation.warn(`AbpAccount::${message}`, 'AbpAccount::AreYouSure')) !==
      ConfirmationStatus.confirm ||
    subject !== `${config.snapshot().currentTenant.id}:${config.snapshot().currentUser.id}` ||
    selected !== Number(type.value) ||
    imageVersion !== imageRevision
  )
    return;
  const saved = await run(
    async signal => {
      const blob =
        selected === ProfilePictureType.Image
          ? await new Promise<Blob | null>(resolve => imageCanvas?.toBlob(resolve, 'image/png'))
          : undefined;
      if (selected === ProfilePictureType.Image && !blob) return false;
      const body = new FormData();
      body.append('Type', String(selected));
      if (blob) body.append('ImageContent', blob, 'profile.png');
      await service.setProfilePicture(body, { signal });
      return true;
    },
    value => {
      if (value) {
        image.value = undefined;
        toaster.success('AbpUi::SavedSuccessfully');
      }
    },
    true,
  );
  if (saved) await load();
}
watch([zoom, horizontal, vertical], draw);
onMounted(load);
onScopeDispose(() => {
  imageRevision += 1;
  image.value = undefined;
});
</script>
