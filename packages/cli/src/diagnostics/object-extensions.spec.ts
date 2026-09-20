import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ApplicationConfiguration } from '../api-definition/object-extensions.js';
import { extensionCoverage } from './object-extensions.js';

const FIXTURE = resolve(
  import.meta.dirname,
  '../../../../e2e/fixtures/application-configuration.json',
);

const configuration = JSON.parse(
  await readFile(FIXTURE, 'utf8'),
) as unknown as ApplicationConfiguration;

/** One entity's worth of extensions, built around the property under test. */
const withProperty = (property: Record<string, unknown>): ApplicationConfiguration => ({
  objectExtensions: {
    modules: { Identity: { entities: { User: { properties: { Custom: property } } } } },
    enums: { 'BookStore.EmployeeTitle': {} },
  },
});

const shown = { onTable: { isVisible: true }, onCreateForm: {}, onEditForm: {} };

describe('extensionCoverage', () => {
  it('recognises everything the test backend declares', () => {
    const coverage = extensionCoverage(configuration);

    expect(coverage.declared).toBeGreaterThan(0);
    expect(coverage.recognised).toBe(coverage.declared);
  });

  it('says nothing about a backend that extends nothing', () => {
    expect(extensionCoverage({})).toEqual({ declared: 0, recognised: 0, reported: [] });
  });

  it('reports a type no rule turns into a control', () => {
    const coverage = extensionCoverage(withProperty({ typeSimple: 'guid', ui: shown }));

    expect(coverage.recognised).toBe(0);
    expect(coverage.reported[0]?.reason).toContain('guid is not one the mapping knows');
  });

  it('reports an enum the configuration does not carry the members of', () => {
    const coverage = extensionCoverage(
      withProperty({ typeSimple: 'enum', type: 'BookStore.Missing', ui: shown }),
    );

    expect(coverage.recognised).toBe(0);
    expect(coverage.reported[0]?.reason).toContain('no enum called BookStore.Missing');
  });

  it('takes an enum it has the members of', () => {
    const coverage = extensionCoverage(
      withProperty({ typeSimple: 'enum', type: 'BookStore.EmployeeTitle', ui: shown }),
    );

    expect(coverage).toMatchObject({ declared: 1, recognised: 1, reported: [] });
  });

  it('reads a lookup as a typeahead, whatever its type says', () => {
    const coverage = extensionCoverage(
      withProperty({ typeSimple: 'guid', ui: { ...shown, lookup: { url: '/api/x' } } }),
    );

    expect(coverage.recognised).toBe(1);
  });

  it('says when a property is configured to show nowhere, which is not our gap', () => {
    const coverage = extensionCoverage(
      withProperty({
        typeSimple: 'string',
        ui: { onTable: { isVisible: false }, onCreateForm: {}, onEditForm: {} },
      }),
    );

    expect(coverage.recognised).toBe(1);
    expect(coverage.reported[0]?.reason).toContain('show nowhere');
  });
});
