import type {
  IdentityEntityActionContributors,
  IdentityEntityPropContributors,
  IdentityFormPropContributors,
  IdentityToolbarActionContributors,
} from '../tokens/extensions.token.js';

/** What a host may contribute to the identity pages, named as `@abp/ng.identity` names it. */
export interface IdentityConfigOptions {
  entityPropContributors?: IdentityEntityPropContributors | undefined;
  createFormPropContributors?: IdentityFormPropContributors | undefined;
  editFormPropContributors?: IdentityFormPropContributors | undefined;
  entityActionContributors?: IdentityEntityActionContributors | undefined;
  toolbarActionContributors?: IdentityToolbarActionContributors | undefined;
}
