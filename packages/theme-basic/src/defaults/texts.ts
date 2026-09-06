import type { LocalizationWithDefault } from '@lsw-abpvue/core';

/**
 * Texts the theme needs that ABP's own resources do not have a key for. They are still
 * written as keys, with the English as the fallback: nothing breaks if a backend has
 * never heard of them, and the day one does they are translated for free.
 *
 * `scripts/localization-keys.spec.ts` is what keeps this list honest -- a key the
 * backend cannot resolve and that carries no default fails the build.
 */
export const MENU: LocalizationWithDefault = { key: 'AbpUi::Menu', defaultValue: 'Menu' };

export const BREADCRUMB: LocalizationWithDefault = {
  key: 'AbpUi::Breadcrumb',
  defaultValue: 'Breadcrumb',
};

export const PAGER_SIZE: LocalizationWithDefault = {
  key: 'AbpUi::PagerSize',
  defaultValue: 'Page size',
};

export const SHOW_PASSWORD: LocalizationWithDefault = {
  key: 'AbpUi::ShowPassword',
  defaultValue: 'Show password',
};

export const HIDE_PASSWORD: LocalizationWithDefault = {
  key: 'AbpUi::HidePassword',
  defaultValue: 'Hide password',
};
