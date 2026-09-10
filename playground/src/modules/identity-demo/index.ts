/**
 * What a module package exports. `@lsw-abpvue/identity` will export the same shapes in
 * M6; until then this stands in for it, so the extension system is exercised the way a
 * real module exercises it.
 */
export { IdentityComponents } from './enums.js';
export type { IdentityComponent } from './enums.js';
export { identityExtensionsResolver } from './extensions.resolver.js';
export { default as UsersPage } from './pages/UsersPage.vue';
export { provideIdentityDemo } from './providers/identity-demo.provider.js';
export type { IdentityDemoOptions } from './providers/identity-demo.provider.js';
export { createIdentityDemoRoutes } from './routes.js';
export { DemoUsersService } from './services/users.service.js';
export type { DemoUserDto } from './services/users.service.js';
export {
  IDENTITY_CREATE_FORM_PROP_CONTRIBUTORS,
  IDENTITY_EDIT_FORM_PROP_CONTRIBUTORS,
  IDENTITY_ENTITY_ACTION_CONTRIBUTORS,
  IDENTITY_ENTITY_PROP_CONTRIBUTORS,
  IDENTITY_TOOLBAR_ACTION_CONTRIBUTORS,
  USERS_PAGE,
} from './tokens/extensions.token.js';
