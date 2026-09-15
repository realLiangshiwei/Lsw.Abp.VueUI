export { default as RolesPage } from './components/RolesPage.vue';
export { default as UsersPage } from './components/UsersPage.vue';

export {
  DEFAULT_ROLES_CREATE_FORM_PROPS,
  DEFAULT_ROLES_EDIT_FORM_PROPS,
  DEFAULT_ROLES_ENTITY_ACTIONS,
  DEFAULT_ROLES_ENTITY_PROPS,
  DEFAULT_ROLES_TOOLBAR_ACTIONS,
} from './defaults/roles.js';
export {
  DEFAULT_USERS_CREATE_FORM_PROPS,
  DEFAULT_USERS_EDIT_FORM_PROPS,
  DEFAULT_USERS_ENTITY_ACTIONS,
  DEFAULT_USERS_ENTITY_PROPS,
  DEFAULT_USERS_TOOLBAR_ACTIONS,
} from './defaults/users.js';

export { IdentityComponents } from './enums/components.js';
export type { IdentityComponent } from './enums/components.js';

export type { IdentityConfigOptions } from './models/config-options.js';

export { provideIdentity } from './providers/identity.provider.js';

export { identityExtensionsResolver } from './resolvers/extensions.resolver.js';

export { createIdentityRoutes } from './routes.js';

export {
  IDENTITY_CREATE_FORM_PROP_CONTRIBUTORS,
  IDENTITY_EDIT_FORM_PROP_CONTRIBUTORS,
  IDENTITY_ENTITY_ACTION_CONTRIBUTORS,
  IDENTITY_ENTITY_PROP_CONTRIBUTORS,
  IDENTITY_TOOLBAR_ACTION_CONTRIBUTORS,
  ROLES_PAGE,
  USERS_PAGE,
} from './tokens/extensions.token.js';
export type {
  IdentityEntityActionContributors,
  IdentityEntityPropContributors,
  IdentityFormPropContributors,
  IdentityToolbarActionContributors,
  RolesPageCommands,
  UsersPageCommands,
} from './tokens/extensions.token.js';
