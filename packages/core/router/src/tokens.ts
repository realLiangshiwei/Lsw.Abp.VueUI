import { defineToken, LayoutType } from '@lsw-abpvue/core';
import type { Component } from 'vue';
import type { RouteLocationRaw, Router, RouterHistory } from 'vue-router';

/** The application's router, so a service can reach it outside a component. */
export const ABP_ROUTER = defineToken<Router>('ABP_ROUTER', {
  hint: 'Add provideAbpRouter(routes) to createAbpApp({ providers: [...] }).',
});

/** How the URL is kept. Provide `createWebHashHistory()` for hash routing. */
export const ROUTER_HISTORY = defineToken<RouterHistory>('ROUTER_HISTORY');

/**
 * Which replaceable component renders which layout. The keys are the ones the Angular UI
 * registers, verbatim, so a theme answers to the same names in either UI.
 */
export const DYNAMIC_LAYOUTS = defineToken<Map<LayoutType, string>>('DYNAMIC_LAYOUTS', {
  factory: () =>
    new Map([
      [LayoutType.application, 'Theme.ApplicationLayoutComponent'],
      [LayoutType.account, 'Theme.AccountLayoutComponent'],
      [LayoutType.empty, 'Theme.EmptyLayoutComponent'],
    ]),
});

/**
 * Where a visitor lands when a route's policy is not granted. A redirect rather than a
 * refusal, because refusing the *first* navigation of a cold load leaves a blank page.
 */
export const FORBIDDEN_ROUTE = defineToken<RouteLocationRaw>('FORBIDDEN_ROUTE', {
  factory: () => '/',
});

export interface TitleStrategy {
  /**
   * Sets the document title after a navigation.
   * @param title The route's `meta.title`, a localization key, when it has one
   */
  setTitle(title: string | undefined): void;
}

export interface ReplaceableRoute {
  key: string;
  defaultComponent: Component;
}
