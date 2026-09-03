import { inject } from '@lsw-abpvue/core';
import {
  defineComponent,
  h,
  type AllowedComponentProps,
  type Component,
  type ComponentCustomProps,
  type VNodeProps,
} from 'vue';
import type { AbpComponentKey } from '../contracts/component-key.js';
import { MissingThemeComponentError } from '../models/errors.js';
import { THEME_COMPONENTS } from '../tokens/theme-components.token.js';

/**
 * `{ 'update:visible': [boolean] }` becomes `{ 'onUpdate:visible'?: (v: boolean) => void }`,
 * the same rewrite Vue applies to `defineEmits`. Left unconstrained so the contracts can
 * stay interfaces, which have no implicit index signature.
 */
type EmitHandlers<Emits> = {
  [K in keyof Emits as `on${Capitalize<K & string>}`]?: Emits[K] extends unknown[]
    ? (...args: Emits[K]) => void
    : never;
};

/**
 * The type of a contract component: its props, the handler props its emits turn into,
 * and its slots. Written as a constructor type because that is the shape `vue-tsc` reads
 * a component's template types off.
 */
export type ThemeComponent<
  Props,
  Emits = Record<never, never>,
  Slots = Record<never, never>,
> = new () => {
  $props: Props & EmitHandlers<Emits> & VNodeProps & AllowedComponentProps & ComponentCustomProps;
  $slots: Slots;
};

/**
 * The theme's implementation of a contract. Resolved from the injector covering the
 * calling component, so a page can override one component for its own subtree.
 * @param key Which of the twelve contracts to resolve
 */
export function useThemeComponent(key: AbpComponentKey): Component {
  const registrations = inject(THEME_COMPONENTS, { optional: true }) ?? [];

  for (let index = registrations.length - 1; index >= 0; index -= 1) {
    const component = registrations[index]?.[key];
    if (component) return component;
  }

  throw new MissingThemeComponentError(key);
}

/**
 * Builds the typed stand-in a caller imports. It renders nothing of its own -- it
 * resolves the theme's implementation once and forwards attributes and slots -- which is
 * what lets `components` and the module packages be type-checked against the contract
 * without importing a theme.
 * @param key Which of the twelve contracts this stands in for
 */
export function defineThemeComponent<
  Props,
  Emits = Record<never, never>,
  Slots = Record<never, never>,
>(key: AbpComponentKey): ThemeComponent<Props, Emits, Slots> {
  const proxy = defineComponent({
    name: key,
    // Everything is forwarded explicitly; letting Vue also apply attrs would duplicate
    // them onto the implementation's root element.
    inheritAttrs: false,
    setup(_props, { attrs, slots }) {
      const implementation = useThemeComponent(key);
      return () => h(implementation, attrs, slots);
    },
  });

  return proxy as unknown as ThemeComponent<Props, Emits, Slots>;
}
