import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ApiDefinition } from '../api-definition/models.js';
import { generateProxy } from '../generator/generate.js';
import { GenerationReport } from '../generator/report.js';
import {
  EntityNotFoundError,
  NotACrudControllerError,
  pluralize,
  readEntityPage,
  singularize,
} from './entity.js';

const FIXTURES = resolve(import.meta.dirname, '../../../../e2e/fixtures');

const definition = JSON.parse(
  readFileSync(resolve(FIXTURES, 'api-definition.json'), 'utf8'),
) as ApiDefinition;

const proxy = generateProxy({ definition, modules: ['all'] });

function read(entity: string, options: Record<string, unknown> = {}) {
  const report = new GenerationReport();
  const page = readEntityPage({
    definition,
    registry: proxy.registry,
    serviceNames: proxy.serviceNames,
    entity,
    report,
    ...options,
  });

  return { page, report };
}

describe('readEntityPage', () => {
  it('finds the controller whatever number the name was given in', () => {
    expect(read('Tenant').page.entity).toBe('Tenant');
    expect(read('Tenants').page.entity).toBe('Tenant');
    expect(read('tenant').page.entity).toBe('Tenant');
  });

  it('says which controllers there are when the entity is not one of them', () => {
    expect(() => read('Sandwich')).toThrow(EntityNotFoundError);
    expect(() => read('Sandwich')).toThrow(/Tenant/);
  });

  it('refuses a controller that lists nothing', () => {
    // The account module's `Account` controller registers, logs in and resets passwords.
    expect(() => read('Account')).toThrow(NotACrudControllerError);
  });

  it('takes the record type off the list endpoint and the fields off the create body', () => {
    const { page } = read('Tenant');

    expect(page.types).toEqual({
      record: 'TenantDto',
      create: 'TenantCreateDto',
      update: 'TenantUpdateDto',
    });
    expect(page.service).toEqual({
      name: 'TenantService',
      directory: 'volo/abp/tenant-management',
    });
  });

  it('collects the properties a DTO inherits, which is where ABP puts half of them', () => {
    // `Name` is on `TenantCreateOrUpdateDtoBase`, not on `TenantCreateDto`.
    expect(read('Tenant').page.fields.map(field => field.name)).toEqual([
      'name',
      'adminEmailAddress',
      'adminPassword',
    ]);
  });

  it('leaves out what every DTO carries and no page shows', () => {
    const names = read('IdentityRole').page.columns.map(column => column.name);

    expect(names).not.toContain('id');
    expect(names).not.toContain('concurrencyStamp');
    expect(names).not.toContain('creationTime');
    expect(names).toContain('name');
  });

  it('reads the validators off the data annotations the backend reports', () => {
    const name = read('Tenant').page.fields.find(field => field.name === 'name');

    expect(name?.validators).toEqual(['Validators.required()', 'Validators.maxLength(64)']);
  });

  it('an address property becomes an email control', () => {
    const email = read('Tenant').page.fields.find(field => field.name === 'adminEmailAddress');

    expect(email?.type).toBe('PropType.Email');
  });

  it('notices the concurrency stamp, which an update has to carry back', () => {
    expect(read('Tenant').page.concurrencyStamp).toBe(true);
  });

  it('takes the permissions off the controller when the backend puts them there', () => {
    // ABP's own modules authorize elsewhere; an application's controllers say so here.
    expect(read('Book').page.policies).toEqual({
      list: 'BookStore.Books',
      create: 'BookStore.Books.Create',
      update: 'BookStore.Books.Update',
      delete: 'BookStore.Books.Delete',
    });
  });

  it('refuses a controller that lists but cannot create, update or delete', () => {
    // The file store lists and uploads; a page calling `service.create` on it would not
    // compile, so saying which endpoints are missing is the more useful answer.
    expect(() => read('File')).toThrow(NotACrudControllerError);
    expect(() => read('File')).toThrow(/that creates.*that updates.*that deletes/);
  });

  it('derives the four permissions from --policy', () => {
    expect(read('Tenant', { policy: 'BookStore.Tenants' }).page.policies).toEqual({
      list: 'BookStore.Tenants',
      create: 'BookStore.Tenants.Create',
      update: 'BookStore.Tenants.Update',
      delete: 'BookStore.Tenants.Delete',
    });
  });

  it('names the keys after the resource, and the route and menu after the plural', () => {
    const { page } = read('Tenant', { resource: 'BookStore' });

    expect(page.componentKey).toBe('BookStore.TenantsComponent');
    expect(page.route).toBe('/tenants');
    expect(page.menuKey).toBe('BookStore::Menu:Tenants');
    expect(page.columns[0]?.displayName).toBe('BookStore::Name');
  });

  it('a property of a shape no control shows is left out, and said so', () => {
    const { page, report } = read('IdentityUser');

    expect(page.columns.map(column => column.name)).not.toContain('roleNames');
    expect(report.of('skipped').join('\n')).toMatch(/roleNames|RoleNames/);
  });
});

describe('pluralize', () => {
  it('covers the three rules entity names actually hit', () => {
    expect(pluralize('Book')).toBe('Books');
    expect(pluralize('Category')).toBe('Categories');
    expect(pluralize('Address')).toBe('Addresses');
    expect(pluralize('Day')).toBe('Days');
  });

  it('and back again, which is how a plural on the command line finds a controller', () => {
    expect(singularize('Books')).toBe('Book');
    expect(singularize('Categories')).toBe('Category');
    expect(singularize('Addresses')).toBe('Address');
    expect(singularize('Address')).toBe('Address');
  });
});
