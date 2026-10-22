import { expectTypeOf, test } from 'vitest';
import type {
  OrganizationUnitCreateDto,
  OrganizationUnitUpdateDto,
} from '@lsw-abpvue/identity-pro/proxy';
import {
  serializeOrganizationUnitCreate,
  serializeOrganizationUnitUpdate,
  type OrganizationUnitFormChanges,
} from './organization-units.js';
test('organization unit serializers preserve commercial contracts', () => {
  const changes: OrganizationUnitFormChanges = {
    values: {},
    writableFields: [],
    writableExtraProperties: [],
  };
  expectTypeOf(
    serializeOrganizationUnitCreate(changes, null),
  ).toEqualTypeOf<OrganizationUnitCreateDto>();
  expectTypeOf(
    serializeOrganizationUnitUpdate({ userCount: 0 }, changes),
  ).toEqualTypeOf<OrganizationUnitUpdateDto>();
});
