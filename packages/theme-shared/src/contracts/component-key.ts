import type { Component } from 'vue';

/**
 * The twelve components a theme has to bring. Every entry here is a component each theme
 * implements forever, which is the whole reason the list is short: anything that can be
 * built out of semantic markup and theme CSS -- cards, breadcrumbs, the loader bar --
 * stays out of it.
 */
export const ABP_COMPONENT_KEYS = [
  'AbpModal',
  'AbpToastHost',
  'AbpConfirmHost',
  'AbpButton',
  'AbpFormField',
  'AbpInput',
  'AbpSelect',
  'AbpToggle',
  'AbpDatePicker',
  'AbpTypeahead',
  'AbpPagination',
  'AbpSpinner',
] as const;

export type AbpComponentKey = (typeof ABP_COMPONENT_KEYS)[number];

/** A theme registers what it implements; partial so a host can override one key. */
export type ThemeComponents = Partial<Record<AbpComponentKey, Component>>;
