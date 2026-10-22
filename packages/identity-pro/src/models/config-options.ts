import type {
  IdentityProEntityActionContributors,
  IdentityProEntityPropContributors,
  IdentityProFormPropContributors,
  IdentityProToolbarActionContributors,
} from '../tokens/extensions.token.js';

/** Contributions for commercial users, roles and claim types. */
export interface IdentityProConfigOptions {
  entityPropContributors?: IdentityProEntityPropContributors | undefined;
  createFormPropContributors?: IdentityProFormPropContributors | undefined;
  editFormPropContributors?: IdentityProFormPropContributors | undefined;
  entityActionContributors?: IdentityProEntityActionContributors | undefined;
  toolbarActionContributors?: IdentityProToolbarActionContributors | undefined;
}
