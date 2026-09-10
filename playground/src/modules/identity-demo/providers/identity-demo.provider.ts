import type {
  EntityActionContributorCallbacks,
  EntityPropContributorCallbacks,
  FormPropContributorCallbacks,
  ToolbarActionContributorCallbacks,
} from '@lsw-abpvue/components';
import type { ProviderInput } from '@lsw-abpvue/core';
import type { DemoUserDto } from '../services/users.service.js';
import {
  IDENTITY_CREATE_FORM_PROP_CONTRIBUTORS,
  IDENTITY_EDIT_FORM_PROP_CONTRIBUTORS,
  IDENTITY_ENTITY_ACTION_CONTRIBUTORS,
  IDENTITY_ENTITY_PROP_CONTRIBUTORS,
  IDENTITY_TOOLBAR_ACTION_CONTRIBUTORS,
} from '../tokens/extensions.token.js';

/** What a host may contribute, keyed by component key. Named as `@abp/ng.identity` is. */
export interface IdentityDemoOptions {
  entityPropContributors?: EntityPropContributorCallbacks<DemoUserDto>;
  createFormPropContributors?: FormPropContributorCallbacks<DemoUserDto>;
  editFormPropContributors?: FormPropContributorCallbacks<DemoUserDto>;
  entityActionContributors?: EntityActionContributorCallbacks<DemoUserDto>;
  toolbarActionContributors?: ToolbarActionContributorCallbacks<readonly DemoUserDto[]>;
}

/**
 * The module's providers. They go on the route record, so the contributors are resolved
 * from the injector covering the module's own pages and nowhere else.
 */
export function provideIdentityDemo(options: IdentityDemoOptions = {}): ProviderInput[] {
  return [
    {
      provide: IDENTITY_ENTITY_PROP_CONTRIBUTORS,
      useValue: options.entityPropContributors ?? {},
    },
    {
      provide: IDENTITY_CREATE_FORM_PROP_CONTRIBUTORS,
      useValue: options.createFormPropContributors ?? {},
    },
    {
      provide: IDENTITY_EDIT_FORM_PROP_CONTRIBUTORS,
      useValue: options.editFormPropContributors ?? {},
    },
    {
      provide: IDENTITY_ENTITY_ACTION_CONTRIBUTORS,
      useValue: options.entityActionContributors ?? {},
    },
    {
      provide: IDENTITY_TOOLBAR_ACTION_CONTRIBUTORS,
      useValue: options.toolbarActionContributors ?? {},
    },
  ];
}
