/**
 * The route names the contract layer itself registers, verbatim from the Angular UI so a
 * module that parents its menu under one of them keeps working.
 */
export const ThemeSharedRouteNames = {
  Administration: 'AbpUiNavigation::Menu:Administration',
} as const;

export type ThemeSharedRouteName =
  (typeof ThemeSharedRouteNames)[keyof typeof ThemeSharedRouteNames];
