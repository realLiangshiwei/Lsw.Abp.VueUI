import {
  AuthError,
  AuthService,
  ConfigStateService,
  createInjector,
  TwoFactorRequiredError,
  type Injector,
  type LoginParams,
} from '@lsw-abpvue/core';
import { computed } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountAuthFlowService } from './auth-flow.service.js';

const injectors: Injector[] = [];
afterEach(() => {
  injectors.splice(0).forEach(injector => injector.destroy());
  vi.useRealTimers();
});
function setup() {
  const login = vi.fn<(params: LoginParams) => Promise<void>>().mockResolvedValue(undefined);
  const injector = createInjector([
    { provide: AuthService, useValue: { login, isAuthenticated: computed(() => false) } },
  ]);
  injectors.push(injector);
  return { login, injector, flow: injector.get(AccountAuthFlowService) };
}
const credentials = {
  username: 'member',
  password: 'original-password',
  rememberMe: true,
  redirectUrl: '/books',
};

describe('account authentication challenges', () => {
  it('keeps the two-factor challenge after a refused code and permits a corrected code', async () => {
    const { login, flow } = setup();
    login.mockRejectedValueOnce(new TwoFactorRequiredError('member-id', 'challenge-token'));
    expect(await flow.login(credentials)).toBe('two-factor');
    login.mockRejectedValueOnce(new AuthError('invalid_grant', 'Invalid two-factor code'));
    await expect(flow.verify('Email', 'wrong')).rejects.toBeInstanceOf(AuthError);
    expect(flow.challenge.value?.twoFactorToken).toBe('challenge-token');
    await flow.verify('Email', '123456', true);
    expect(login).toHaveBeenLastCalledWith({
      ...credentials,
      twoFactorProvider: 'Email',
      twoFactorCode: '123456',
      rememberBrowser: true,
    });
    expect(flow.challenge.value).toBeUndefined();
  });
  it('uses the new password for a second-factor challenge after a required password change', async () => {
    const { login, flow } = setup();
    login.mockRejectedValueOnce(
      new AuthError('invalid_grant', 'ShouldChangePasswordOnNextLogin', {
        changePasswordToken: 'change-token',
      }),
    );
    expect(await flow.login(credentials)).toBe('change-password');
    login.mockRejectedValueOnce(new TwoFactorRequiredError('member-id', 'second-token'));
    expect(await flow.changePassword('original-password', 'new-password')).toBe('two-factor');
    await flow.verify('Authenticator', '123456');
    expect(login).toHaveBeenLastCalledWith(
      expect.objectContaining({ password: 'new-password', twoFactorCode: '123456' }),
    );
    expect(login.mock.lastCall?.[0]).not.toHaveProperty('changePasswordToken');
    expect(login.mock.lastCall?.[0]).not.toHaveProperty('newPassword');
  });
  it('redeems recovery codes without reusing a failed provider code or remember-browser choice', async () => {
    const { login, flow } = setup();
    login.mockRejectedValueOnce(new TwoFactorRequiredError('member-id', 'token'));
    await flow.login(credentials);
    login.mockRejectedValueOnce(new AuthError('invalid_grant', 'Invalid code'));
    await expect(flow.verify('Email', 'wrong', true)).rejects.toBeInstanceOf(AuthError);
    await flow.recover('ABCD-EFGH 1234');
    expect(login).toHaveBeenLastCalledWith({
      ...credentials,
      rememberMe: false,
      recoveryCode: 'ABCD-EFGH1234',
    });
  });
  it('expires secret challenge state and clears it on tenant changes and destruction', async () => {
    vi.useFakeTimers();
    const { login, flow, injector } = setup();
    login.mockRejectedValue(new TwoFactorRequiredError('member-id', 'token'));
    await flow.login(credentials);
    await vi.advanceTimersByTimeAsync(600_000);
    expect(flow.challenge.value).toBeUndefined();
    await flow.login(credentials);
    const config = injector.get(ConfigStateService);
    config.setState({
      ...config.snapshot(),
      currentTenant: { id: 'another-tenant', isAvailable: true },
    });
    expect(flow.challenge.value).toBeUndefined();
    await flow.login(credentials);
    injector.destroy();
    expect(flow.challenge.value).toBeUndefined();
  });
});
