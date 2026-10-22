import { defineAsyncComponent } from 'vue';

export const PersonalSettingsTab = defineAsyncComponent(() => import('./PersonalSettingsTab.vue'));
export const ProfilePictureTab = defineAsyncComponent(() => import('./ProfilePictureTab.vue'));
export const ChangePasswordTab = defineAsyncComponent(() => import('./ChangePasswordTab.vue'));
export const AuthenticatorAppTab = defineAsyncComponent(() => import('./AuthenticatorAppTab.vue'));
export const TwoFactorTab = defineAsyncComponent(() => import('./TwoFactorTab.vue'));
