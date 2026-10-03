import { defineToken, type TwoFactorRequiredError } from '@lsw-abpvue/core';

export interface TwoFactorProvider {
  name: string;
  displayName?: string | undefined;
  requiresCodeDelivery: boolean;
}

/** Supplies the available second factors and delivers codes through the host's backend. */
export interface TwoFactorService {
  getProviders(challenge: TwoFactorRequiredError): Promise<readonly TwoFactorProvider[]>;
  sendCode(challenge: TwoFactorRequiredError, provider: string): Promise<void>;
}

export class TwoFactorDeliveryUnavailableError extends Error {
  constructor() {
    super('Verification codes cannot be sent with this provider. Choose another sign-in method.');
    this.name = 'TwoFactorDeliveryUnavailableError';
  }
}

export const TwoFactorService = defineToken<TwoFactorService>('TwoFactorService', {
  factory: () => ({
    getProviders: () => Promise.resolve([{ name: 'Authenticator', requiresCodeDelivery: false }]),
    sendCode: () => Promise.reject(new TwoFactorDeliveryUnavailableError()),
  }),
});
