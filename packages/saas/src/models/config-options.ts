import type {
  SaasEntityActionContributors,
  SaasEntityPropContributors,
  SaasFormPropContributors,
  SaasToolbarActionContributors,
} from '../tokens/extensions.token.js';
import type {
  SaasTenantFormAsyncValidator,
  SaasTenantFormValidator,
} from '../tokens/pages.token.js';

export interface SaasConfigOptions {
  entityPropContributors?: SaasEntityPropContributors | undefined;
  createFormPropContributors?: SaasFormPropContributors | undefined;
  editFormPropContributors?: SaasFormPropContributors | undefined;
  entityActionContributors?: SaasEntityActionContributors | undefined;
  toolbarActionContributors?: SaasToolbarActionContributors | undefined;
  tenantFormValidators?: readonly SaasTenantFormValidator[] | undefined;
  tenantFormAsyncValidators?: readonly SaasTenantFormAsyncValidator[] | undefined;
}
