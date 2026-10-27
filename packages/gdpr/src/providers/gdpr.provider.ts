import type { ProviderInput } from '@lsw-abpvue/core';
import {
  DEFAULT_GDPR_ENTITY_PROPS,
  DEFAULT_GDPR_TOOLBAR_ACTIONS,
  type GdprConfigOptions,
} from '../tokens/extensions.token.js';

export function provideGdpr(options: GdprConfigOptions = {}): ProviderInput[] {
  return [
    { provide: DEFAULT_GDPR_ENTITY_PROPS, useValue: options.createFormPropContributors ?? {} },
    { provide: DEFAULT_GDPR_TOOLBAR_ACTIONS, useValue: options.toolbarActionContributors ?? {} },
  ];
}
