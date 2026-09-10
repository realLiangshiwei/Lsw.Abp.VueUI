import { getCurrentInjector, PermissionService, type Injector } from '@lsw-abpvue/core';
import { installInspector } from '../dev/inspect.js';
import { computed, type ComputedRef } from 'vue';
import type { EntityAction, ToolbarAction } from '../models/actions.js';
import type { GetInjected, PropData } from '../models/prop-data.js';
import { ExtensionsService } from '../services/extensions.service.js';
import { EXTENSIONS_IDENTIFIER } from '../tokens/extensions.token.js';

/**
 * The injector covering the component being set up, for the callbacks that run later.
 * Contributors are plain functions with no injection context of their own, so they carry
 * one with them.
 */
export function useGetInjected(): { injector: Injector; getInjected: GetInjected } {
  const injector = getCurrentInjector();
  if (!injector) {
    throw new Error(
      'An extensible component was set up outside an injection context. Render it inside an application created with createAbpApp().',
    );
  }

  // The one place every extensible component passes through, which is what makes the
  // inspector need no wiring from the host. The branch is what a production build drops,
  // and the module goes with it.
  if ((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV) {
    installInspector(injector);
  }

  return { injector, getInjected: injector.get.bind(injector) as GetInjected };
}

function permitted<A extends { permission: string; visible: (data?: never) => boolean }, R>(
  actions: readonly A[],
  data: PropData<R>,
  injector: Injector,
): A[] {
  const permission = injector.get(PermissionService);

  return actions.filter(
    action =>
      (!action.permission || permission.isGranted(action.permission)) &&
      action.visible(data as never),
  );
}

/**
 * The row buttons of the current component, filtered by what this user may do and by
 * what each of them says about this record.
 * @param data The row the buttons would act on
 */
export function useEntityActions<R>(data: () => PropData<R>): ComputedRef<EntityAction<R>[]> {
  const { injector } = useGetInjected();
  const extensions = injector.get(ExtensionsService);
  const identifier = injector.get(EXTENSIONS_IDENTIFIER);

  return computed(() =>
    permitted(extensions.entityActions.get<R>(identifier).actions.toArray(), data(), injector),
  );
}

/**
 * The toolbar buttons of the current component. `R` is the whole page of records, the
 * way ABP writes them.
 * @param data The page the buttons would act on
 */
export function useToolbarActions<R>(data: () => PropData<R>): ComputedRef<ToolbarAction<R>[]> {
  const { injector } = useGetInjected();
  const extensions = injector.get(ExtensionsService);
  const identifier = injector.get(EXTENSIONS_IDENTIFIER);

  return computed(() =>
    permitted(extensions.toolbarActions.get<R>(identifier).actions.toArray(), data(), injector),
  );
}
