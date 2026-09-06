import type { LocalizationWithDefault } from '@lsw-abpvue/core';

/**
 * What the table and the form say. The keys ABP's own resources have are used as they
 * are; the rest are written as keys with the English as a fallback, so a backend that
 * has never heard of them shows something sensible and one that translates them wins for
 * free.
 *
 * `scripts/localization-keys.spec.ts` is what keeps this honest -- a key the backend
 * cannot resolve and that carries no default fails the build.
 */
export const EMPTY_TEXT = 'AbpUi::NoDataAvailableInDatatable';

export const LOADING = 'AbpUi::LoadingWithThreeDot';

export const ACTIONS = 'AbpUi::Actions';

export const SELECT_ALL: LocalizationWithDefault = {
  key: 'AbpUi::SelectAll',
  defaultValue: 'Select all',
};

export const SELECT_ROW: LocalizationWithDefault = {
  key: 'AbpUi::SelectRow',
  defaultValue: 'Select row',
};

export const EXPAND_ROW: LocalizationWithDefault = {
  key: 'AbpUi::ExpandRow',
  defaultValue: 'Show details',
};
