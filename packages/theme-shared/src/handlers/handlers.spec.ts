import {
  AbpHttpError,
  AuthService,
  createInjector,
  SessionStateService,
  type AbpErrorEnvelope,
  type Injector,
} from '@lsw-abpvue/core';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmationStatus } from '../models/confirmation.js';
import { provideAbpThemeShared } from '../providers/theme-shared.provider.js';
import { ConfirmationService } from '../services/confirmation.service.js';
import { ErrorPageService } from '../services/error-page.service.js';
import { HttpErrorHandlerService } from '../services/http-error-handler.service.js';
import { ToasterService } from '../services/toaster.service.js';
import { ValidationErrorService } from '../services/validation-error.service.js';

interface Failure {
  status?: number;
  headers?: Record<string, string>;
  error?: AbpErrorEnvelope;
}

const failure = ({ status = 500, headers, error }: Failure = {}) =>
  new AbpHttpError({
    status,
    statusText: '',
    method: 'POST',
    url: '/api/identity/users',
    error,
    headers: headers ? new Headers(headers) : undefined,
  });

const authService = () => ({
  init: vi.fn(),
  isAuthenticated: { value: false } as never,
  isInternalAuth: true,
  navigateToLogin: vi.fn(async () => {}),
  logout: vi.fn(async () => {}),
  login: vi.fn(async () => {}),
  getAccessToken: () => null,
  refreshToken: vi.fn(async () => {}),
});

const create = (providers: Parameters<typeof createInjector>[0] = []): Injector =>
  createInjector([provideAbpThemeShared(), ...providers]);

describe('AuthenticationErrorHandler', () => {
  it('sends the user to the login page when a 401 got past the token refresh', async () => {
    const auth = authService();
    const injector = create([{ provide: AuthService, useValue: auth }]);

    await injector.get(HttpErrorHandlerService).handle(failure({ status: 401 }));

    expect(auth.navigateToLogin).toHaveBeenCalled();
    expect(injector.get(ErrorPageService).current.value).toBeNull();
  });

  it('leaves the 401 to the error page when nothing provides authentication', async () => {
    const injector = create();

    await injector.get(HttpErrorHandlerService).handle(failure({ status: 401 }));

    expect(injector.get(ErrorPageService).current.value?.status).toBe(401);
  });
});

describe('TenantResolveErrorHandler', () => {
  it('drops the tenant and says so', async () => {
    const injector = create();
    const session = injector.get(SessionStateService);
    session.setTenant({ id: '1', name: 'acme', isAvailable: true });

    await injector
      .get(HttpErrorHandlerService)
      .handle(failure({ status: 400, headers: { 'Abp-Tenant-Resolve-Error': 'no such tenant' } }));

    expect(session.getTenant()).toBeNull();
    expect(injector.get(ToasterService).toasts.value[0]).toMatchObject({
      severity: 'error',
      message: 'no such tenant',
    });
  });

  it('names the tenant that could not be resolved when the backend gave no reason', async () => {
    const injector = create();
    injector.get(SessionStateService).setTenant({ id: '1', name: 'acme', isAvailable: true });

    await injector
      .get(HttpErrorHandlerService)
      .handle(failure({ status: 400, headers: { 'Abp-Tenant-Resolve-Error': '' } }));

    const toast = injector.get(ToasterService).toasts.value[0];
    expect(toast?.message).toMatchObject({ key: 'AbpUiMultiTenancy::GivenTenantIsNotAvailable' });
    expect(toast?.options.messageLocalizationParams).toEqual(['acme']);
  });
});

describe('ValidationErrorHandler', () => {
  const rejected = () =>
    failure({
      status: 400,
      error: {
        message: 'Your request is not valid!',
        validationErrors: [{ message: 'Taken.', members: ['userName'] }],
      },
    });

  it('puts the errors on the form that is listening', async () => {
    const injector = create();
    const form = { setServerErrors: vi.fn() };
    injector.get(ValidationErrorService).register(form);

    await injector.get(HttpErrorHandlerService).handle(rejected());

    expect(form.setServerErrors).toHaveBeenCalledWith([
      { message: 'Taken.', members: ['userName'] },
    ]);
    expect(injector.get(ToasterService).toasts.value).toHaveLength(0);
  });

  it('gives them to the innermost form, which is the one on screen', async () => {
    const injector = create();
    const page = { setServerErrors: vi.fn() };
    const dialog = { setServerErrors: vi.fn() };
    injector.get(ValidationErrorService).register(page);
    injector.get(ValidationErrorService).register(dialog);

    await injector.get(HttpErrorHandlerService).handle(rejected());

    expect(dialog.setServerErrors).toHaveBeenCalled();
    expect(page.setServerErrors).not.toHaveBeenCalled();
  });

  it('leaves them to the envelope handler when no form is listening', async () => {
    const injector = create();

    await injector.get(HttpErrorHandlerService).handle(rejected());

    expect(injector.get(ToasterService).toasts.value[0]?.message).toBe(
      'Your request is not valid!',
    );
  });

  it('stops taking them once the form has unregistered', async () => {
    const injector = create();
    const form = { setServerErrors: vi.fn() };
    const stop = injector.get(ValidationErrorService).register(form);
    stop();

    await injector.get(HttpErrorHandlerService).handle(rejected());

    expect(form.setServerErrors).not.toHaveBeenCalled();
  });
});

describe('AbpFormatErrorHandler', () => {
  it('shows a message on its own as a toast', async () => {
    const injector = create();

    await injector
      .get(HttpErrorHandlerService)
      .handle(failure({ error: { message: 'There is already a user with this name.' } }));

    expect(injector.get(ToasterService).toasts.value[0]).toMatchObject({
      severity: 'error',
      message: 'There is already a user with this name.',
    });
  });

  it('shows details in a dialog, where there is room to read them', async () => {
    const injector = create();
    const confirmation = injector.get(ConfirmationService);

    const handled = injector.get(HttpErrorHandlerService).handle(
      failure({
        error: {
          message: 'Volo.Abp.Identity:DuplicateUserName',
          details: 'The name "admin" is taken.',
        },
      }),
    );

    expect(confirmation.current.value).toMatchObject({
      severity: 'error',
      message: 'The name "admin" is taken.',
      title: 'Volo.Abp.Identity:DuplicateUserName',
      options: { hideCancelBtn: true },
    });

    confirmation.clear(ConfirmationStatus.confirm);
    await handled;
  });

  it('claims an envelope ABP marked in the headers even with nothing in it', async () => {
    const injector = create();

    await injector
      .get(HttpErrorHandlerService)
      .handle(failure({ status: 500, headers: { _AbpErrorFormat: 'true' } }));

    expect(injector.get(ToasterService).toasts.value).toHaveLength(1);
    expect(injector.get(ErrorPageService).current.value).toBeNull();
  });

  it('leaves a plain status with no envelope to the error page', async () => {
    const injector = create();

    await injector.get(HttpErrorHandlerService).handle(failure({ status: 500 }));

    expect(injector.get(ErrorPageService).current.value?.status).toBe(500);
  });
});

describe('the chain as a whole', () => {
  it('runs in the documented order', () => {
    expect(
      create()
        .get(HttpErrorHandlerService)
        .handlers.map(handler => handler.priority),
    ).toEqual([10, 20, 30, 40, 50, 99]);
  });
});
