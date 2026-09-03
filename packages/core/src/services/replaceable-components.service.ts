import { computed, shallowRef, type Component, type ComputedRef } from 'vue';
import { inject } from '../di/inject.js';
import { defineService, type ServiceOf } from '../di/token.js';

export interface ReplaceableComponent {
  key: string;
  component: Component;
}

/**
 * The registry behind ABP's replaceable components: a host swaps the users table for its
 * own by registering under the same key. Keys are the ones the Angular UI uses, verbatim,
 * so an existing configuration can be moved over unchanged.
 */
export const ReplaceableComponentsService = defineService('ReplaceableComponentsService', () => {
  const replacements = shallowRef(new Map<string, Component>());

  return {
    /** Replacing again later is allowed; whatever is registered last wins. */
    add: (item: ReplaceableComponent): void => {
      replacements.value = new Map(replacements.value).set(item.key, item.component);
    },

    get: (key: string): ReplaceableComponent | undefined => {
      const component = replacements.value.get(key);
      return component ? { key, component } : undefined;
    },

    getRef: (key: string): ComputedRef<Component | undefined> =>
      computed(() => replacements.value.get(key)),
  };
});
export type ReplaceableComponentsService = ServiceOf<typeof ReplaceableComponentsService>;

export const useReplaceableComponents = (): ReplaceableComponentsService =>
  inject(ReplaceableComponentsService);
