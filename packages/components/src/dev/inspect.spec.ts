import {
  ConfigStateService,
  createInjector,
  type ApplicationConfigurationDto,
  type Injector,
} from '@lsw-abpvue/core';
import { describe, expect, it, vi } from 'vitest';
import { PropType } from '../enums/prop-type.js';
import { EntityAction } from '../models/actions.js';
import { EntityProp, type EntityPropList } from '../models/entity-props.js';
import { ExtensionsService } from '../services/extensions.service.js';
import { mergeWithDefaultActions, mergeWithDefaultProps } from '../utils/merge.js';
import { markObjectExtensionContributor } from '../utils/object-extension-marker.js';
import { dumpExtensions, installInspector, type InspectionReport } from './inspect.js';

interface Book {
  id: string;
  name: string;
}

const BOOKS = 'BookStore.BooksComponent';

const column = (name: string, options = {}) =>
  EntityProp.create<Book>({ type: PropType.String, name, ...options });

function context(policies: Record<string, boolean> = {}): Injector {
  const injector = createInjector([]);
  const configState = injector.get(ConfigStateService);
  configState.setState({
    ...configState.snapshot(),
    auth: { grantedPolicies: policies },
  } as ApplicationConfigurationDto);

  return injector;
}

const propsOf = (report: InspectionReport | undefined) =>
  report?.points.find(point => point.extensionPoint === 'entityProps')?.items ?? [];

describe('what the report says about every entry', () => {
  it('names where each one came from', () => {
    const injector = context();
    const extensions = injector.get(ExtensionsService);

    function addIsbnColumn(propList: EntityPropList<Book>): void {
      propList.addTail(column('Isbn'));
    }

    const fromBackend = markObjectExtensionContributor((propList: EntityPropList<Book>) => {
      propList.addTail(column('SocialSecurityNumber'));
    });

    mergeWithDefaultProps(
      extensions.entityProps,
      { [BOOKS]: [column('name')] },
      { [BOOKS]: [fromBackend] },
      { [BOOKS]: [addIsbnColumn] },
    );

    expect(propsOf(dumpExtensions(injector, BOOKS)[0])).toEqual([
      { name: 'name', origin: 'default', contributor: 'defaults' },
      {
        name: 'SocialSecurityNumber',
        origin: 'object-extension',
        contributor: expect.any(String) as unknown as string,
      },
      { name: 'Isbn', origin: 'contributor', contributor: 'addIsbnColumn' },
    ]);
  });

  it('points at whoever added a second column of the same name', () => {
    const injector = context();

    function addNameAgain(propList: EntityPropList<Book>): void {
      propList.addTail(column('name'));
    }

    mergeWithDefaultProps(
      injector.get(ExtensionsService).entityProps,
      { [BOOKS]: [column('name')] },
      { [BOOKS]: [addNameAgain] },
    );

    const items = propsOf(dumpExtensions(injector, BOOKS)[0]);

    expect(items[0]?.overriddenBy).toBe('addNameAgain');
    expect(items[1]?.overriddenBy).toBeUndefined();
  });

  it('says which policy hid one', () => {
    const injector = context({ 'BookStore.Books.Manage': false });

    mergeWithDefaultProps(injector.get(ExtensionsService).entityProps, {
      [BOOKS]: [column('name'), column('note', { permission: 'BookStore.Books.Manage' })],
    });

    const items = propsOf(dumpExtensions(injector, BOOKS)[0]);

    expect(items[0]?.filteredBy).toBeUndefined();
    expect(items[1]?.filteredBy).toBe('policy: BookStore.Books.Manage');
  });

  it('says when a predicate is what hid one', () => {
    const injector = context();

    mergeWithDefaultProps(injector.get(ExtensionsService).entityProps, {
      [BOOKS]: [
        column('hiddenColumn', { columnVisible: () => false }),
        column('hiddenRow', { visible: () => false }),
        // A predicate about the record cannot be answered without a record, and is not
        // reported as a reason.
        column('perRow', {
          visible: (data?: { record: Book }) => (data as { record: Book }).record.name !== '',
        }),
      ],
    });

    const items = propsOf(dumpExtensions(injector, BOOKS)[0]);

    expect(items[0]?.filteredBy).toBe('columnVisible predicate');
    expect(items[1]?.filteredBy).toBe('visible predicate');
    expect(items[2]?.filteredBy).toBeUndefined();
  });

  it('reports a contributor registered under a key no module has', () => {
    const injector = context();

    mergeWithDefaultProps(
      injector.get(ExtensionsService).entityProps,
      { [BOOKS]: [column('name')] },
      { 'BookStore.BookComponent': [() => {}] },
    );

    expect(dumpExtensions(injector, BOOKS)[0]?.orphans).toEqual([
      {
        extensionPoint: 'entityProps',
        componentKey: 'BookStore.BookComponent',
        count: 1,
      },
    ]);
  });

  it('counts the orphans of the last assembly, not of every visit', () => {
    const injector = context();
    const orphan = { 'BookStore.BookComponent': [() => {}] };

    // A resolver runs again on every navigation into the module.
    for (let visit = 0; visit < 3; visit += 1) {
      mergeWithDefaultProps(
        injector.get(ExtensionsService).entityProps,
        { [BOOKS]: [column('name')] },
        orphan,
      );
    }

    expect(dumpExtensions(injector, BOOKS)[0]?.orphans[0]?.count).toBe(1);
  });
});

describe('what the report covers', () => {
  it('every extension point that was assembled, and only those', () => {
    const injector = context();
    const extensions = injector.get(ExtensionsService);

    mergeWithDefaultProps(extensions.entityProps, { [BOOKS]: [column('name')] });
    mergeWithDefaultActions(extensions.entityActions, {
      [BOOKS]: [EntityAction.create<Book>({ text: 'AbpUi::Edit', action: () => {} })],
    });

    expect(dumpExtensions(injector, BOOKS)[0]?.points.map(point => point.extensionPoint)).toEqual([
      'entityProps',
      'entityActions',
    ]);
  });

  it('an action is listed under the text it carries', () => {
    const injector = context();

    mergeWithDefaultActions(injector.get(ExtensionsService).entityActions, {
      [BOOKS]: [EntityAction.create<Book>({ text: 'AbpUi::Delete', action: () => {} })],
    });

    const actions = dumpExtensions(injector, BOOKS)[0]?.points[0]?.items;

    expect(actions?.[0]?.name).toBe('AbpUi::Delete');
  });

  it('every component key at once when none is named', () => {
    const injector = context();
    const extensions = injector.get(ExtensionsService);

    mergeWithDefaultProps(extensions.entityProps, {
      [BOOKS]: [column('name')],
      'BookStore.AuthorsComponent': [column('name')],
    });

    expect(dumpExtensions(injector).map(report => report.identifier)).toEqual([
      BOOKS,
      'BookStore.AuthorsComponent',
    ]);
  });

  it('a component nobody assembled has nothing to report', () => {
    expect(dumpExtensions(context(), 'Nope.Component')[0]?.points).toEqual([]);
  });
});

describe('the facade', () => {
  it('answers on globalThis, and dump returns what inspect prints', () => {
    const injector = context();
    mergeWithDefaultProps(injector.get(ExtensionsService).entityProps, {
      [BOOKS]: [column('name')],
    });

    installInspector(injector);

    const inspector = (globalThis as { __abpvue?: { dump(): InspectionReport[] } }).__abpvue;

    expect(propsOf(inspector?.dump()[0])).toHaveLength(1);
  });

  it('printing says something even when nothing has been assembled', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    installInspector(context());

    (globalThis as { __abpvue?: { inspect(): void } }).__abpvue?.inspect();

    expect(info).toHaveBeenCalled();
    info.mockRestore();
  });

  it('printing a report groups it by extension point and warns about orphans', () => {
    const table = vi.spyOn(console, 'table').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

    const injector = context();
    mergeWithDefaultProps(
      injector.get(ExtensionsService).entityProps,
      { [BOOKS]: [column('name')] },
      { 'BookStore.Typo': [() => {}] },
    );

    installInspector(injector);
    (globalThis as { __abpvue?: { inspect(id?: string): void } }).__abpvue?.inspect(BOOKS);

    expect(table).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toContain('BookStore.Typo');

    vi.restoreAllMocks();
  });
});
