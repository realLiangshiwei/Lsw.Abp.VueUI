import { expectTypeOf, test } from 'vitest';
import type {
  ApplicationConfigurationDto,
  ApplicationLocalizationResourceDto,
  CurrentUserDto,
} from '../proxy/models.js';
import type { ConfigStateService } from './config-state.service.js';

test('distinguishes optional wire fields from complete configuration state', () => {
  const config = {} as ConfigStateService;
  expectTypeOf<ApplicationConfigurationDto['currentUser']>().toEqualTypeOf<
    CurrentUserDto | undefined
  >();
  expectTypeOf(config.getOne('currentUser').value.roles).toEqualTypeOf<string[]>();
  expectTypeOf(config.snapshot().localization.resources).toEqualTypeOf<
    Record<string, ApplicationLocalizationResourceDto>
  >();
  expectTypeOf<Parameters<ConfigStateService['setState']>>().toEqualTypeOf<
    [configuration: ApplicationConfigurationDto]
  >();
});
