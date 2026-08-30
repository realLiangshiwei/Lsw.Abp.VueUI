import type { AbpRoute, LayoutType } from '@lsw-abpvue/core';
import type { ReplaceableRoute } from './tokens';

declare module 'vue-router' {
  interface RouteMeta {
    /** Checked by the permission guard; accepts the full `A || B && C` grammar. */
    requiredPolicy?: string;
    /** Sends anonymous visitors to the login page. */
    requiresAuthentication?: boolean;
    /** Rendered by `AbpReplaceableRouteContainer`, so a host can swap the page. */
    replaceableComponent?: ReplaceableRoute;
    /** Menu entries this route contributes; collected into `RoutesService` at startup. */
    routes?: AbpRoute | AbpRoute[];
    /** Localization key for the document title. */
    title?: string;
    layout?: LayoutType;
  }
}

export {};
