import type {
  SampleEntityActionContributors,
  SampleEntityPropContributors,
  SampleFormPropContributors,
  SampleToolbarActionContributors,
} from '../tokens/extensions.token.js';

/** What a host may contribute to this module's page. */
export interface SampleConfigOptions {
  entityPropContributors?: SampleEntityPropContributors | undefined;
  createFormPropContributors?: SampleFormPropContributors | undefined;
  editFormPropContributors?: SampleFormPropContributors | undefined;
  entityActionContributors?: SampleEntityActionContributors | undefined;
  toolbarActionContributors?: SampleToolbarActionContributors | undefined;
}
