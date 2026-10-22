import {
  EXTENSIONS_IDENTIFIER,
  ExtensionsService,
  FormProp,
  PropType,
  useExtensibleForm,
} from '@lsw-abpvue/components';
import {
  ConfigStateService,
  createInjector,
  HTTP_FETCH,
  HttpErrorReporterService,
  type FetchLike,
  type Injector,
} from '@lsw-abpvue/core';
import {
  IdentityUserService,
  type IdentityRoleDto,
  type IdentityUserDto,
  type OrganizationUnitDto,
  type OrganizationUnitWithDetailsDto,
} from '@lsw-abpvue/identity-pro/proxy';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createIdentityUserEditorLoader,
  getIdentityUserFormChanges,
  getIdentityUserInheritedRoleIds,
  getIdentityUserInitialSelection,
  IdentityUserEditorStateError,
  refreshIdentityUserFormState,
  serializeIdentityUserCreate,
  serializeIdentityUserUpdate,
  type IdentityUserCreateSnapshot,
  type IdentityUserEditSnapshot,
  type IdentityUserFormChanges,
} from './user-editor.js';

const USER: IdentityUserDto = {
  id: 'user-1',
  userName: 'reader',
  name: 'Existing',
  surname: 'Person',
  email: 'reader@example.test',
  emailConfirmed: true,
  phoneNumber: '123456',
  phoneNumberConfirmed: true,
  isActive: false,
  lockoutEnabled: false,
  shouldChangePasswordOnNextLogin: true,
  concurrencyStamp: 'current-stamp',
  supportTwoFactor: true,
  twoFactorEnabled: false,
  isLockedOut: false,
  accessFailedCount: 0,
  isExternal: false,
  extraProperties: { Hidden: 'keep', Editable: 'before', Readonly: 'original' },
};
const role = (name: string, isDefault = false): IdentityRoleDto => ({
  id: `${name}-id`,
  name,
  isDefault,
  isStatic: false,
  isPublic: true,
  userCount: 0,
  creationTime: '2026-10-19T00:00:00Z',
});
const AVAILABLE_ROLE = role('reader', true);
const PROTECTED_ROLE = role('protected');
const UNIT: OrganizationUnitWithDetailsDto = {
  id: 'unit-1',
  displayName: 'First unit',
  roles: [role('inherited')],
  userCount: 0,
};
const ASSIGNED_UNIT: OrganizationUnitDto = {
  id: 'unit-1',
  displayName: 'First unit',
  roles: [{ organizationUnitId: 'unit-1', roleId: 'inherited-id' }],
};
const EDIT: IdentityUserEditSnapshot = {
  mode: 'edit',
  permissions: { manageRoles: true, manageOrganizationUnits: true },
  user: USER,
  assignedRoles: [AVAILABLE_ROLE, PROTECTED_ROLE],
  assignedOrganizationUnits: [ASSIGNED_UNIT],
  assignableRoles: [AVAILABLE_ROLE, role('writer')],
  availableOrganizationUnits: [UNIT, { id: 'unit-2', userCount: 0 }],
};
const CREATE: IdentityUserCreateSnapshot = {
  mode: 'create',
  permissions: { manageRoles: true, manageOrganizationUnits: true },
  assignableRoles: [AVAILABLE_ROLE, role('writer')],
  availableOrganizationUnits: [UNIT],
};
const NO_RELATIONS = { manageRoles: false, manageOrganizationUnits: false };
const EMPTY_SELECTION = { roleNames: [], organizationUnitIds: [] };
const injectors: Injector[] = [];

afterEach(() => {
  for (const injector of injectors.splice(0)) injector.destroy();
});

function changes(
  values: Record<string, unknown> = {},
  writableFields = Object.keys(values).filter(name => name !== 'extraProperties'),
  writableExtraProperties: string[] = [],
): IdentityUserFormChanges {
  return { values, writableFields, writableExtraProperties };
}

function environment(responder: FetchLike) {
  const injector = createInjector([{ provide: HTTP_FETCH, useValue: responder }]);
  injectors.push(injector);
  return { injector, loader: createIdentityUserEditorLoader(injector.get(IdentityUserService)) };
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function responseFor(url: string): Response {
  if (url.endsWith('/assignable-roles')) return json({ items: [AVAILABLE_ROLE] });
  if (url.endsWith('/available-organization-units')) return json({ items: [UNIT] });
  if (url.endsWith('/roles')) return json({ items: [AVAILABLE_ROLE, PROTECTED_ROLE] });
  if (url.endsWith('/organization-units')) return json([ASSIGNED_UNIT]);
  return json(USER);
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (error: unknown) => void = () => {};
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

describe('commercial user editor loading', () => {
  it('loads fresh details and both assigned relationships before making editing available', async () => {
    const pending = deferred<Response>();
    const send = vi.fn<FetchLike>(url =>
      url.endsWith('/organization-units') ? pending.promise : Promise.resolve(responseFor(url)),
    );
    const { loader } = environment(send);
    const opening = loader.load('user-1', EDIT.permissions);
    expect(loader.state.value.status).toBe('loading');
    await Promise.resolve();
    expect(loader.state.value.status).toBe('loading');
    pending.resolve(json([ASSIGNED_UNIT]));
    const snapshot = await opening;

    expect(loader.state.value.status).toBe('ready');
    expect(snapshot).toEqual({
      ...EDIT,
      assignableRoles: [AVAILABLE_ROLE],
      availableOrganizationUnits: [UNIT],
    });
    expect(send.mock.calls.map(([url]) => url)).toEqual(
      expect.arrayContaining([
        '/api/identity/users/user-1',
        '/api/identity/users/user-1/roles',
        '/api/identity/users/user-1/organization-units',
        '/api/identity/users/assignable-roles',
        '/api/identity/users/available-organization-units',
      ]),
    );
  });

  it('reads assigned relationships without offering relation editing to an unprivileged operator', async () => {
    const send = vi.fn<FetchLike>(url => Promise.resolve(responseFor(url)));
    const { loader } = environment(send);
    const snapshot = await loader.load('user-1', NO_RELATIONS);
    expect(snapshot).toMatchObject({
      mode: 'edit',
      assignedRoles: [AVAILABLE_ROLE, PROTECTED_ROLE],
      assignedOrganizationUnits: [ASSIGNED_UNIT],
      assignableRoles: [],
      availableOrganizationUnits: [],
    });
    expect(send).toHaveBeenCalledTimes(3);
  });

  it('accepts nullable optional strings from the runtime response without treating null as phone text', async () => {
    const { loader } = environment(url =>
      Promise.resolve(
        url.endsWith('/user-1')
          ? json({
              ...USER,
              name: null,
              surname: null,
              phoneNumber: null,
              phoneNumberConfirmed: false,
            })
          : responseFor(url),
      ),
    );
    const snapshot = await loader.load('user-1', NO_RELATIONS);
    if (snapshot?.mode !== 'edit')
      throw new IdentityUserEditorStateError('The test editor did not load.');
    expect(serializeIdentityUserUpdate(snapshot, changes(), {})).toMatchObject({
      name: undefined,
      surname: undefined,
      phoneNumber: undefined,
      phoneNumberConfirmed: false,
    });
  });

  it('loads only permitted creation lookups and selects the available default roles', async () => {
    const send = vi.fn<FetchLike>(url => Promise.resolve(responseFor(url)));
    const { loader } = environment(send);
    const snapshot = await loader.load(undefined, {
      manageRoles: true,
      manageOrganizationUnits: false,
    });
    expect(snapshot?.mode).toBe('create');
    expect(send).toHaveBeenCalledExactlyOnceWith(
      '/api/identity/users/assignable-roles',
      expect.anything(),
    );
    if (snapshot)
      expect(getIdentityUserInitialSelection(snapshot)).toEqual({
        roleNames: ['reader'],
        organizationUnitIds: [],
      });
  });

  it('does not turn a failed relationship read into an empty editable relationship', async () => {
    const send = vi.fn<FetchLike>(url =>
      Promise.resolve(
        url.endsWith('/roles') ? json({ error: { message: 'Denied' } }, 403) : responseFor(url),
      ),
    );
    const { injector, loader } = environment(send);
    const report = vi.fn();
    injector.get(HttpErrorReporterService).onError(report);
    await expect(loader.load('user-1', EDIT.permissions)).rejects.toMatchObject({ status: 403 });
    expect(loader.state.value.status).toBe('error');
    expect(report).not.toHaveBeenCalled();

    send.mockImplementation(url => Promise.resolve(responseFor(url)));
    await loader.load('user-1', EDIT.permissions);
    expect(loader.state.value.status).toBe('ready');
  });

  it('cancels the previous opening and ignores its late successful response', async () => {
    const previous = deferred<Response>();
    const send = vi.fn<FetchLike>(url =>
      url.endsWith('/user-1')
        ? previous.promise
        : Promise.resolve(
            url.endsWith('/user-2') ? json({ ...USER, id: 'user-2' }) : responseFor(url),
          ),
    );
    const { loader } = environment(send);
    const first = loader.load('user-1', NO_RELATIONS);
    const second = await loader.load('user-2', NO_RELATIONS);
    expect(second?.mode).toBe('edit');
    previous.resolve(json({ ...USER, userName: 'obsolete' }));
    expect(await first).toBeUndefined();
    expect(loader.state.value).toMatchObject({
      status: 'ready',
      revision: 2,
      snapshot: { user: { userName: 'reader' } },
    });
    expect(send.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  });

  it('silences an obsolete failure after closing and clears the complete previous session', async () => {
    const pending = deferred<Response>();
    const { loader, injector } = environment(() => pending.promise);
    const report = vi.fn();
    injector.get(HttpErrorReporterService).onError(report);
    const opening = loader.load('user-1', NO_RELATIONS);
    loader.reset();
    pending.reject(new DOMException('Closed', 'AbortError'));
    expect(await opening).toBeUndefined();
    expect(loader.state.value).toEqual({ status: 'idle', revision: 2 });
    expect(report).not.toHaveBeenCalled();
  });

  it.each([
    { endpoint: '/roles', body: {} },
    { endpoint: '/organization-units', body: { items: [] } },
    { endpoint: '/user-1', body: { ...USER, id: 'another-user' } },
  ])(
    'refuses an incomplete $endpoint response rather than publishing an editable snapshot',
    async ({ endpoint, body }) => {
      const { loader } = environment(url =>
        Promise.resolve(url.endsWith(endpoint) ? json(body) : responseFor(url)),
      );
      await expect(loader.load('user-1', NO_RELATIONS)).rejects.toBeInstanceOf(
        IdentityUserEditorStateError,
      );
      expect(loader.state.value.status).toBe('error');
    },
  );
});

describe('commercial user request serialization', () => {
  it('supplies all non-nullable create defaults without sending administrative detail fields', () => {
    const body = serializeIdentityUserCreate(
      CREATE,
      changes({
        userName: 'new-user',
        email: 'new@example.test',
        password: 'Strong1!',
        id: 'forged',
        tenantId: 'other',
        concurrencyStamp: 'forged',
        roleNames: ['forged'],
        supportTwoFactor: true,
        isExternal: true,
      }),
      EMPTY_SELECTION,
    );
    expect(body).toEqual({
      userName: 'new-user',
      email: 'new@example.test',
      name: undefined,
      surname: undefined,
      phoneNumber: undefined,
      password: 'Strong1!',
      isActive: true,
      lockoutEnabled: true,
      shouldChangePasswordOnNextLogin: false,
      sendConfirmationEmail: false,
      emailConfirmed: false,
      phoneNumberConfirmed: false,
      roleNames: [],
      organizationUnitIds: [],
      extraProperties: {},
    });
  });

  it('preserves complete existing scalar values and the original concurrency stamp when fields are absent', () => {
    const body = serializeIdentityUserUpdate(
      EDIT,
      changes(
        {
          name: 'Changed',
          password: 'Never included',
          id: 'forged',
          concurrencyStamp: 'forged',
          accessFailedCount: 999,
          isActive: true,
          lockoutEnabled: true,
        },
        ['name'],
      ),
      getIdentityUserInitialSelection(EDIT),
    );
    expect(body).toEqual({
      userName: 'reader',
      name: 'Changed',
      surname: 'Person',
      email: 'reader@example.test',
      phoneNumber: '123456',
      isActive: false,
      lockoutEnabled: false,
      shouldChangePasswordOnNextLogin: true,
      emailConfirmed: true,
      phoneNumberConfirmed: true,
      concurrencyStamp: 'current-stamp',
      extraProperties: USER.extraProperties,
    });
    expect(body).not.toHaveProperty('password');
    expect(body).not.toHaveProperty('sendConfirmationEmail');
    expect(body).not.toHaveProperty('id');
    expect(body).not.toHaveProperty('accessFailedCount');
  });

  it('preserves fields that have explicit undefined values rather than replacing their snapshot', () => {
    const body = serializeIdentityUserUpdate(
      EDIT,
      changes({ name: undefined, isActive: undefined }),
      EMPTY_SELECTION,
    );
    expect(body.name).toBe('Existing');
    expect(body.isActive).toBe(false);
  });

  it('distinguishes false and explicit scalar clearing from an omitted field', () => {
    const body = serializeIdentityUserUpdate(
      EDIT,
      changes({
        name: '',
        surname: null,
        emailConfirmed: false,
        shouldChangePasswordOnNextLogin: false,
      }),
      EMPTY_SELECTION,
    );
    expect(body).toMatchObject({
      name: '',
      surname: '',
      emailConfirmed: false,
      shouldChangePasswordOnNextLogin: false,
    });
  });

  it.each(['', '   ', '\t'])('never confirms an empty phone number %j', phoneNumber => {
    const body = serializeIdentityUserUpdate(
      EDIT,
      changes({ phoneNumber, phoneNumberConfirmed: true }),
      EMPTY_SELECTION,
    );
    expect(body.phoneNumberConfirmed).toBe(false);
    expect(body.phoneNumber).toBe(phoneNumber);
  });

  it('keeps a confirmation value when changing to another nonempty number for backend validation', () => {
    const body = serializeIdentityUserUpdate(
      EDIT,
      changes({ phoneNumber: '654321' }),
      EMPTY_SELECTION,
    );
    expect(body.phoneNumberConfirmed).toBe(true);
  });

  it('allows an explicit create confirmation email request but never derives it from email confirmation', () => {
    expect(
      serializeIdentityUserCreate(CREATE, changes({ emailConfirmed: true }), EMPTY_SELECTION)
        .sendConfirmationEmail,
    ).toBe(false);
    expect(
      serializeIdentityUserCreate(
        CREATE,
        changes({ sendConfirmationEmail: true, emailConfirmed: true }),
        EMPTY_SELECTION,
      ),
    ).toMatchObject({ sendConfirmationEmail: true, emailConfirmed: true });
  });

  it('preserves unknown, hidden and readonly extra properties while applying only writable changes', () => {
    const body = serializeIdentityUserUpdate(
      EDIT,
      changes(
        {
          extraProperties: { Editable: '', Hidden: 'erase', Readonly: 'erase', New: false },
        },
        [],
        ['Editable', 'New'],
      ),
      EMPTY_SELECTION,
    );
    expect(body.extraProperties).toEqual({
      Hidden: 'keep',
      Editable: '',
      Readonly: 'original',
      New: false,
    });
    expect(USER.extraProperties).toEqual({
      Hidden: 'keep',
      Editable: 'before',
      Readonly: 'original',
    });
  });

  it('preserves an explicitly undefined extra property but allows an explicit null value', () => {
    const body = serializeIdentityUserUpdate(
      EDIT,
      changes(
        { extraProperties: { Editable: undefined, Hidden: null } },
        [],
        ['Editable', 'Hidden'],
      ),
      EMPTY_SELECTION,
    );
    expect(body.extraProperties).toMatchObject({ Editable: 'before', Hidden: null });
  });

  it('omits unchanged relationship sets even when their selection order differs', () => {
    const body = serializeIdentityUserUpdate(EDIT, changes(), {
      roleNames: ['protected', 'reader'],
      organizationUnitIds: ['unit-1'],
    });
    expect(body).not.toHaveProperty('roleNames');
    expect(body).not.toHaveProperty('organizationUnitIds');
  });

  it('preserves effective inherited roles when an explicit role change is serialized', () => {
    const inherited = role('inherited');
    const snapshot = {
      ...EDIT,
      assignedRoles: [...EDIT.assignedRoles, inherited],
      assignableRoles: [...EDIT.assignableRoles, inherited],
    };
    const body = serializeIdentityUserUpdate(snapshot, changes(), {
      roleNames: ['writer', 'inherited'],
      organizationUnitIds: ['unit-1'],
    });
    expect(body.roleNames).toEqual(['protected', 'writer', 'inherited']);
  });

  it.each([
    { manageRoles: false, manageOrganizationUnits: false },
    { manageRoles: false, manageOrganizationUnits: true },
    { manageRoles: true, manageOrganizationUnits: false },
    { manageRoles: true, manageOrganizationUnits: true },
  ])(
    'preserves relations outside the $manageRoles/$manageOrganizationUnits editing permissions',
    permissions => {
      const body = serializeIdentityUserUpdate({ ...EDIT, permissions }, changes(), {
        roleNames: ['writer'],
        organizationUnitIds: ['unit-2'],
      });
      expect(body.roleNames).toEqual(permissions.manageRoles ? ['protected', 'writer'] : undefined);
      expect(body.organizationUnitIds).toEqual(
        permissions.manageOrganizationUnits ? ['unit-2'] : undefined,
      );
    },
  );

  it('omits creation relations without management permission rather than inventing empty assignments', () => {
    const body = serializeIdentityUserCreate(
      { ...CREATE, permissions: NO_RELATIONS },
      changes(),
      {},
    );
    expect(body).not.toHaveProperty('roleNames');
    expect(body).not.toHaveProperty('organizationUnitIds');
  });

  it('clears only editable assignments and retains protected roles and unavailable organization units', () => {
    const body = serializeIdentityUserUpdate(
      {
        ...EDIT,
        assignedOrganizationUnits: [...EDIT.assignedOrganizationUnits, { id: 'protected-unit' }],
      },
      changes(),
      EMPTY_SELECTION,
    );
    expect(body.roleNames).toEqual(['protected']);
    expect(body.organizationUnitIds).toEqual(['protected-unit']);
  });

  it.each([
    {},
    { roleNames: ['forged'], organizationUnitIds: [] },
    { roleNames: [], organizationUnitIds: ['forged'] },
  ])(
    'refuses incomplete or unavailable editable selections instead of silently dropping them',
    selection => {
      expect(() => serializeIdentityUserUpdate(EDIT, changes(), selection)).toThrow(
        IdentityUserEditorStateError,
      );
    },
  );

  it.each([{ isActive: 'false' }, { email: 123 }, { emailConfirmed: null }])(
    'refuses invalid contributor types %j',
    values => {
      expect(() => serializeIdentityUserUpdate(EDIT, changes(values), EMPTY_SELECTION)).toThrow(
        IdentityUserEditorStateError,
      );
    },
  );

  it('reports inherited role identifiers without turning them into direct assignments', () => {
    expect(getIdentityUserInheritedRoleIds(EDIT, ['unit-1'])).toEqual(['inherited-id']);
    expect(
      getIdentityUserInheritedRoleIds({ ...EDIT, availableOrganizationUnits: [] }, ['unit-1']),
    ).toEqual(['inherited-id']);
    expect(getIdentityUserInheritedRoleIds(EDIT, [])).toEqual([]);
    expect(getIdentityUserInitialSelection(EDIT).roleNames).toEqual(['reader', 'protected']);
    expect(
      serializeIdentityUserUpdate(EDIT, changes(), getIdentityUserInitialSelection(EDIT)),
    ).not.toHaveProperty('roleNames');
  });
});

describe('commercial user form protection', () => {
  function formFor(record: IdentityUserDto | undefined) {
    const injector = createInjector([
      { provide: EXTENSIONS_IDENTIFIER, useValue: 'Identity.UsersComponent' },
    ]);
    injectors.push(injector);
    const props = FormProp.createMany<IdentityUserDto>([
      { name: 'name', type: PropType.String },
      { name: 'surname', type: PropType.String, defaultValue: 'Do not overwrite' },
      { name: 'email', type: PropType.String, disabled: () => true },
      { name: 'userName', type: PropType.String, readonly: () => true },
      { name: 'isActive', type: PropType.Boolean, visible: () => false },
      { name: 'lockoutEnabled', type: PropType.Boolean, permission: 'AbpIdentity.Users.Update' },
      { name: 'phoneNumber', type: PropType.String },
      { name: 'phoneNumberConfirmed', type: PropType.Boolean },
      { name: 'Editable', type: PropType.String, isExtra: true },
      { name: 'Readonly', type: PropType.String, isExtra: true, readonly: () => true },
    ]);
    const extensions = injector.get(ExtensionsService);
    extensions.createFormProps
      .get<IdentityUserDto>('Identity.UsersComponent')
      .addContributor(list => list.addManyTail(props));
    extensions.editFormProps
      .get<IdentityUserDto>('Identity.UsersComponent')
      .addContributor(list => list.addManyTail(props));
    const form = injector.runInContext(() => useExtensibleForm(record));
    return { form, injector };
  }

  it('does not serialize untouched defaults or changes to hidden, disabled, readonly or forbidden fields', () => {
    const { form, injector } = formFor({ ...USER, surname: undefined });
    for (const name of [
      'name',
      'email',
      'userName',
      'isActive',
      'lockoutEnabled',
      'Editable',
      'Readonly',
    ]) {
      const control = form.form.get(name);
      if (control)
        control.value = name === 'isActive' || name === 'lockoutEnabled' ? true : 'Changed';
    }
    const edited = getIdentityUserFormChanges(form, USER, injector);
    expect(edited.writableFields).toEqual(['name']);
    expect(edited.writableExtraProperties).toEqual(['Editable']);
    expect(serializeIdentityUserUpdate(EDIT, edited, EMPTY_SELECTION)).toMatchObject({
      name: 'Changed',
      email: USER.email,
      userName: USER.userName,
      isActive: false,
      lockoutEnabled: false,
    });
  });

  it('rechecks effective permission and dynamic control protection immediately before saving', () => {
    const { form, injector } = formFor(USER);
    const control = form.form.get('lockoutEnabled');
    if (control) control.value = true;
    const config = injector.get(ConfigStateService);
    config.setState({
      ...config.snapshot(),
      auth: { grantedPolicies: { 'AbpIdentity.Users.Update': true } },
    });
    expect(getIdentityUserFormChanges(form, USER, injector).writableFields).toContain(
      'lockoutEnabled',
    );
    if (control) control.readonly = true;
    expect(getIdentityUserFormChanges(form, USER, injector).writableFields).not.toContain(
      'lockoutEnabled',
    );
  });

  it('collects permitted creation defaults even when no control was touched', () => {
    const { form, injector } = formFor(undefined);
    expect(getIdentityUserFormChanges(form, undefined, injector).writableFields).toEqual([
      'name',
      'surname',
      'phoneNumber',
      'phoneNumberConfirmed',
    ]);
  });

  it('refreshes field restrictions and clears phone confirmation when the phone becomes empty', () => {
    const { form, injector } = formFor(USER);
    const phone = form.form.get('phoneNumber');
    if (phone) phone.value = '';
    refreshIdentityUserFormState(form, USER, injector);
    expect(form.form.get('phoneNumberConfirmed')?.disabled).toBe(true);
    expect(form.form.get('phoneNumberConfirmed')?.value).toBe(false);
    expect(form.form.get('phoneNumberConfirmed')?.dirty).toBe(true);
    expect(form.form.get('email')?.disabled).toBe(true);
    expect(form.form.get('userName')?.readonly).toBe(true);
    expect(form.form.get('isActive')?.disabled).toBe(true);
    if (phone) phone.value = '654321';
    refreshIdentityUserFormState(form, USER, injector);
    expect(form.form.get('phoneNumberConfirmed')?.disabled).toBe(false);
  });
});
