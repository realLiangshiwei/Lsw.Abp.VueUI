/**
 * The replaceable component keys of the basic theme, verbatim from the Angular UI so an
 * existing `ReplaceableComponents` registration moves over unchanged.
 */
export const ThemeBasicComponents = {
  ApplicationLayout: 'Theme.ApplicationLayoutComponent',
  AccountLayout: 'Theme.AccountLayoutComponent',
  EmptyLayout: 'Theme.EmptyLayoutComponent',
  Logo: 'Theme.LogoComponent',
  Routes: 'Theme.RoutesComponent',
  NavItems: 'Theme.NavItemsComponent',
  CurrentUser: 'Theme.CurrentUserComponent',
  Languages: 'Theme.LanguagesComponent',
} as const;
export type ThemeBasicComponents = (typeof ThemeBasicComponents)[keyof typeof ThemeBasicComponents];
